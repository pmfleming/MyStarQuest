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
  await offlineRuntime(userId).store.queue({
    kind: 'document',
    collection,
    entityId,
    mode,
    data: documentData(data, mode === 'put'),
  })
}

export function saveActivityPatch(
  userId: string,
  collection: 'chores' | 'tests',
  entityId: string,
  childId: string,
  patch: LocalDocument,
  reset = false
) {
  return offlineRuntime(userId).store.queue({
    kind: 'activity',
    collection,
    entityId,
    childId,
    dateKey: getTodayDescriptor().dateKey,
    patch,
    delta: 0,
    complete: false,
    reset,
    consume: false,
  })
}

export function offlineCompletion(options: {
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
  return offlineRuntime(options.userId).store.mutate((state) => {
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
      dateKey: getTodayDescriptor().dateKey,
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
}

export function offlineRedemption(
  userId: string,
  childId: string,
  reward: { id: string; title: string; costStars: number }
) {
  // Reading the balance and consuming a reward shares the serialized commit.
  return offlineRuntime(userId).store.mutate((state) => {
    const child = projectDocuments(state, 'children')[childId]
    const definition = projectDocuments(state, 'rewards')[reward.id]
    if (!child || !definition)
      throw new Error('Load this child and reward online first.')
    const cost = Number(definition.costStars ?? reward.costStars)
    const starsBefore = starBalance(child)
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
}
