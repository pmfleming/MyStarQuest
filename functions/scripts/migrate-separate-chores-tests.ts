#!/usr/bin/env node

import admin, { type firestore } from 'firebase-admin'
import net from 'node:net'

type ActivityType =
  | 'positional-notation'
  | 'large-numbers'
  | 'math'
  | 'alphabet'
  | 'spelling'
  | 'watertoiletcheck'
  | 'eating'
  | 'standard'

type MigrationStats = Record<string, number>
type DocumentData = firestore.DocumentData
type DocumentReference = firestore.DocumentReference

const args = new Set(process.argv.slice(2))
const write = args.has('--write')
const allowProduction = args.has('--allow-production')
const deleteLegacy = args.has('--delete-legacy')

if (deleteLegacy && !write) {
  throw new Error('--delete-legacy requires --write.')
}

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST
if (!emulatorHost && !allowProduction) {
  throw new Error(
    'Refusing to run outside the Firestore emulator. Set FIRESTORE_EMULATOR_HOST or pass --allow-production.'
  )
}

const TEST_TYPES = new Set<ActivityType>([
  'math',
  'large-numbers',
  'positional-notation',
  'alphabet',
  'spelling',
])

const ACTIVITY_TYPE_PRIORITY: ActivityType[] = [
  'positional-notation',
  'large-numbers',
  'math',
  'alphabet',
  'spelling',
  'watertoiletcheck',
  'eating',
]

function assertEmulatorReachable(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!emulatorHost || allowProduction) {
      resolve()
      return
    }

    const [host, portText] = emulatorHost.split(':')
    const socket = net.createConnection({
      host,
      port: Number(portText),
      timeout: 2000,
    })
    const unreachable = () => {
      socket.destroy()
      reject(
        new Error(`Firestore emulator is not reachable at ${emulatorHost}`)
      )
    }

    socket.once('connect', () => {
      socket.end()
      resolve()
    })
    socket.once('timeout', unreachable)
    socket.once('error', unreachable)
  })
}

function getActivityType(data: DocumentData): ActivityType | null {
  const candidates = new Set([
    data.taskType,
    data.choreType,
    data.testType,
    data.category,
  ])
  const type = ACTIVITY_TYPE_PRIORITY.find((candidate) =>
    candidates.has(candidate)
  )
  if (type) return type
  return candidates.has('daynight') ? null : 'standard'
}

function bump(stats: MigrationStats, key: string): void {
  stats[key] = (stats[key] ?? 0) + 1
}

async function copyDocIfMissing(
  targetRef: DocumentReference,
  data: DocumentData
): Promise<'copied' | 'skipped'> {
  if ((await targetRef.get()).exists) return 'skipped'
  if (write) await targetRef.set(data)
  return 'copied'
}

async function deleteLegacyDoc(
  doc: firestore.QueryDocumentSnapshot,
  stats: MigrationStats,
  key: string
): Promise<void> {
  if (!deleteLegacy || !write) return
  await doc.ref.delete()
  bump(stats, key)
}

async function migrateTemplates(
  userRef: DocumentReference,
  stats: MigrationStats
): Promise<void> {
  const tasks = await userRef.collection('tasks').get()
  for (const taskDoc of tasks.docs) {
    const data = taskDoc.data()
    const type = getActivityType(data)
    if (!type) {
      bump(stats, 'templates.ignoredLegacy')
      continue
    }

    const collection = TEST_TYPES.has(type) ? 'tests' : 'chores'
    const typeField = TEST_TYPES.has(type) ? 'testType' : 'choreType'
    const targetRef = userRef.collection(collection).doc(taskDoc.id)
    const outcome = await copyDocIfMissing(targetRef, {
      ...data,
      taskType: type,
      [typeField]: type,
    })
    bump(stats, `templates.${collection}.${outcome}`)
    await deleteLegacyDoc(taskDoc, stats, 'templates.legacy.deleted')
  }
}

async function migrateTodos(
  userRef: DocumentReference,
  stats: MigrationStats
): Promise<void> {
  const todos = await userRef.collection('todos').get()
  for (const todoDoc of todos.docs) {
    const data = todoDoc.data()
    const type = getActivityType({ taskType: data.sourceTaskType })
    if (!type || TEST_TYPES.has(type)) {
      bump(stats, type ? 'todos.obsoleteTestDaily' : 'todos.ignoredLegacy')
      await deleteLegacyDoc(todoDoc, stats, 'todos.legacy.deleted')
      continue
    }

    const sourceId = data.sourceTaskId ?? data.sourceChoreId
    const targetRef = userRef.collection('choreTodos').doc(todoDoc.id)
    const outcome = await copyDocIfMissing(targetRef, {
      ...data,
      sourceTaskId: sourceId,
      sourceTaskType: type,
      sourceChoreId: sourceId,
      sourceChoreType: type,
    })
    bump(stats, `todos.choreTodos.${outcome}`)
    await deleteLegacyDoc(todoDoc, stats, 'todos.legacy.deleted')
  }
}

async function migrateUser(userRef: DocumentReference) {
  const stats: MigrationStats = {}
  await migrateTemplates(userRef, stats)
  await migrateTodos(userRef, stats)
  return { uid: userRef.id, stats }
}

async function main(): Promise<void> {
  await assertEmulatorReachable()
  admin.initializeApp({
    projectId:
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      'mystarquest-emulator',
  })

  const users = await admin.firestore().collection('users').listDocuments()
  const results = []
  for (const userRef of users) results.push(await migrateUser(userRef))

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        deleteLegacy,
        emulator: emulatorHost ?? null,
        users: results,
      },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
