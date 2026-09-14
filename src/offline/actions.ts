import { offlineRuntime } from './runtime'
import {
  clampStars,
  enqueue,
  projectDocuments,
  type CollectionName,
  type LocalDocument,
  type Action,
} from './model'
import { getTodayDescriptor } from '../lib/today'

export async function saveDocument(
  userId: string,
  collection: CollectionName,
  entityId: string,
  mode: 'put' | 'patch' | 'delete',
  data: LocalDocument = {}
) {
  const runtime = offlineRuntime(userId)
  // Creation builders use serverTimestamp(); offline creation records a real Date
  // at the gesture instead, which persists and sorts before the backend returns.
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  )
  if (mode === 'put')
    clean.createdAt =
      data.createdAt instanceof Date ? data.createdAt : new Date()
  await runtime.store.queue({
    kind: 'document',
    collection,
    entityId,
    mode,
    data: clean,
  })
}

export async function saveActivity(
  userId: string,
  action: Extract<Action, { kind: 'activity' }>
) {
  return offlineRuntime(userId).store.queue(action)
}

export async function saveActivityPatch(
  userId: string,
  collection: 'chores' | 'tests',
  entityId: string,
  childId: string,
  patch: LocalDocument,
  reset = false
) {
  return saveActivity(userId, {
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
  const runtime = offlineRuntime(options.userId)
  await runtime.store.open()
  if (
    options.initialTaskData &&
    !projectDocuments(runtime.store.getSnapshot()!, options.taskCollection)[
      options.taskId
    ]
  ) {
    await saveDocument(
      options.userId,
      options.taskCollection,
      options.taskId,
      'put',
      options.initialTaskData
    )
  }
  const operation = await saveActivity(options.userId, {
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
  }
}

export async function offlineRedemption(
  userId: string,
  childId: string,
  reward: { id: string; title: string; costStars: number }
) {
  const runtime = offlineRuntime(userId)
  // Compute the balance and consume the reward inside the same serialized local
  // transaction, so a rapid second gesture cannot spend a stale local balance.
  return runtime.store.mutate((state) => {
    const child = projectDocuments(state, 'children')[childId]
    const definition = projectDocuments(state, 'rewards')[reward.id]
    if (!child || !definition)
      throw new Error('Load this child and reward online first.')
    const cost = Number(definition.costStars ?? reward.costStars)
    const starsBefore = clampStars(Number(child.totalStars ?? 0))
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
