import { offlineRuntime } from './runtime'
import {
  clampStars,
  enqueue,
  projectDocuments,
  starBalance,
  type CollectionName,
  type LocalDocument,
} from './model'
import { getTodayDescriptor } from '../lib/today'
import { parseChildScope } from '../sharing/scope'
import { isOfflineEnabled } from './platform'
import { sendChildOperation } from '../sharing/api'

async function finishOnline(userId: string) {
  const scope = parseChildScope(userId)
  if (!scope || isOfflineEnabled()) return
  if (navigator.onLine === false)
    throw new Error(
      'Connect to save changes. Offline storage is unavailable in this browser.'
    )
  const store = offlineRuntime(userId).store
  for (const operation of [...(store.getSnapshot()?.pending ?? [])]) {
    try {
      await store.acknowledge(
        operation.id,
        await sendChildOperation(scope, operation)
      )
    } catch (error) {
      await store.reject(
        operation.id,
        error instanceof Error ? error.message : 'Change was not saved.'
      )
      throw error
    }
  }
}
function requireOnlineStorage(userId: string) {
  if (
    parseChildScope(userId) &&
    !isOfflineEnabled() &&
    navigator.onLine === false
  )
    throw new Error(
      'Connect to save changes. Offline storage is unavailable in this browser.'
    )
}
function activityDay(userId: string) {
  const scope = parseChildScope(userId)
  const child = scope
    ? offlineRuntime(userId).store.getSnapshot()?.documents.children[
        scope.childId
      ]
    : undefined
  return getTodayDescriptor(
    new Date(),
    String(child?.timeZone ?? 'Europe/London')
  ).dateKey
}

function documentData(data: LocalDocument, create: boolean) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  )
  if (create)
    clean.createdAt =
      data.createdAt instanceof Date ? data.createdAt : new Date()
  return clean
}

export async function saveDocument(
  userId: string,
  collection: CollectionName,
  entityId: string,
  mode: 'put' | 'patch' | 'delete',
  data: LocalDocument = {}
) {
  requireOnlineStorage(userId)
  await offlineRuntime(userId).store.queue({
    kind: 'document',
    collection,
    entityId,
    mode,
    data: documentData(data, mode === 'put'),
  })
  await finishOnline(userId)
}

export async function saveActivityPatch(
  userId: string,
  collection: 'chores' | 'tests',
  entityId: string,
  childId: string,
  patch: LocalDocument,
  reset = false
) {
  requireOnlineStorage(userId)
  const scope = parseChildScope(userId)
  if (reset && scope && scope.actorUid !== scope.ownerUid)
    throw new Error('Only the admin can reset saved progress.')
  const result = await offlineRuntime(userId).store.queue({
    kind: 'activity',
    collection,
    entityId,
    childId,
    dateKey: activityDay(userId),
    patch,
    delta: 0,
    complete: false,
    reset,
    consume: false,
  })
  await finishOnline(userId)
  return result
}

export async function offlineCompletion(options: {
  userId: string
  childId: string
  taskId: string
  taskCollection: 'chores' | 'tests'
  dateKey: string
  delta: number
  updates: LocalDocument
  initialTaskData?: LocalDocument
  deleteOnComplete?: boolean
}) {
  requireOnlineStorage(options.userId)
  const result = await offlineRuntime(options.userId).store.mutate((state) => {
    const starsBefore = starBalance(
      projectDocuments(state, 'children')[options.childId] ?? {}
    )
    const saved = projectDocuments(state, options.taskCollection)[
      options.taskId
    ]
    const task = saved ?? options.initialTaskData
    if (!task || task.childId !== options.childId)
      throw new Error('Task does not belong to the selected child')
    // Creating a default test and awarding it is one durable local commit.
    if (!saved)
      enqueue(state, {
        kind: 'document',
        collection: options.taskCollection,
        entityId: options.taskId,
        mode: 'put',
        data: documentData(task, true),
      })
    const operation = enqueue(state, {
      kind: 'activity',
      collection: options.taskCollection,
      entityId: options.taskId,
      childId: options.childId,
      dateKey: activityDay(options.userId),
      patch: options.updates,
      delta: options.delta,
      complete: true,
      reset: false,
      consume: options.deleteOnComplete ?? false,
    })
    return {
      appliedDelta: operation ? options.delta : 0,
      wasAlreadyAwarded: !operation,
      starsBefore,
    }
  })
  await finishOnline(options.userId)
  return result
}

export async function offlineRedemption(
  userId: string,
  childId: string,
  reward: { id: string; title: string; costStars: number }
) {
  requireOnlineStorage(userId)
  // Reading the balance and consuming a reward shares the serialized commit.
  const result = await offlineRuntime(userId).store.mutate((state) => {
    const child = projectDocuments(state, 'children')[childId]
    const definition = projectDocuments(state, 'rewards')[reward.id]
    if (!child || !definition)
      throw new Error('Load this child and reward online first.')
    const cost = Number(definition.costStars ?? reward.costStars)
    const starsBefore = starBalance(child)
    if (state.shared && starsBefore < cost)
      throw new Error('Not enough stars for this reward.')
    const title = String(definition.title ?? reward.title)
    enqueue(state, {
      kind: 'redeem',
      entityId: reward.id,
      childId,
      title,
      cost,
      consume: definition.isRepeating !== true,
    })
    return { title, starsBefore, starsAfter: clampStars(starsBefore - cost) }
  })
  await finishOnline(userId)
  return result
}
