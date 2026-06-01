#!/usr/bin/env node

const admin = require('firebase-admin')
const net = require('node:net')

const args = new Set(process.argv.slice(2))
const write = args.has('--write')
const allowProduction = args.has('--allow-production')

if (!process.env.FIRESTORE_EMULATOR_HOST && !allowProduction) {
  console.error(
    'Refusing to run outside the Firestore emulator. Set FIRESTORE_EMULATOR_HOST or pass --allow-production.'
  )
  process.exit(1)
}

let db

const assertEmulatorReachable = () =>
  new Promise((resolve, reject) => {
    if (!process.env.FIRESTORE_EMULATOR_HOST || allowProduction) {
      resolve()
      return
    }

    const [host, portText] = process.env.FIRESTORE_EMULATOR_HOST.split(':')
    const socket = net.createConnection({
      host,
      port: Number(portText),
      timeout: 2000,
    })

    socket.once('connect', () => {
      socket.end()
      resolve()
    })
    socket.once('timeout', () => {
      socket.destroy()
      reject(
        new Error(
          `Firestore emulator is not reachable at ${process.env.FIRESTORE_EMULATOR_HOST}`
        )
      )
    })
    socket.once('error', () => {
      reject(
        new Error(
          `Firestore emulator is not reachable at ${process.env.FIRESTORE_EMULATOR_HOST}`
        )
      )
    })
  })

const getActivityType = (data) => {
  const explicitType = data.taskType || data.choreType || data.testType
  const category = data.category

  if (
    explicitType === 'positional-notation' ||
    category === 'positional-notation'
  ) {
    return 'positional-notation'
  }
  if (explicitType === 'math' || category === 'math') return 'math'
  if (explicitType === 'alphabet' || category === 'alphabet') return 'alphabet'
  if (explicitType === 'watertoiletcheck' || category === 'watertoiletcheck') {
    return 'watertoiletcheck'
  }
  if (explicitType === 'eating' || category === 'eating') return 'eating'
  if (explicitType === 'daynight' || category === 'daynight') return null
  return 'standard'
}

const isTestType = (type) =>
  type === 'math' || type === 'positional-notation' || type === 'alphabet'

const targetForTemplate = (type) =>
  isTestType(type)
    ? { collection: 'tests', typeField: 'testType' }
    : { collection: 'chores', typeField: 'choreType' }

const targetForTodo = (type) =>
  isTestType(type)
    ? {
        collection: 'testTodos',
        idField: 'sourceTestId',
        typeField: 'sourceTestType',
      }
    : {
        collection: 'choreTodos',
        idField: 'sourceChoreId',
        typeField: 'sourceChoreType',
      }

const copyDocIfMissing = async (targetRef, data) => {
  const existing = await targetRef.get()
  if (existing.exists) return 'skipped'
  if (write) await targetRef.set(data)
  return 'copied'
}

const bump = (stats, key) => {
  stats[key] = (stats[key] || 0) + 1
}

async function migrateUser(userRef) {
  const uid = userRef.id
  const stats = {}

  const tasks = await userRef.collection('tasks').get()
  for (const taskDoc of tasks.docs) {
    const data = taskDoc.data()
    const type = getActivityType(data)
    if (!type) {
      bump(stats, 'templates.ignoredLegacy')
      continue
    }

    const target = targetForTemplate(type)
    const targetRef = userRef.collection(target.collection).doc(taskDoc.id)
    const outcome = await copyDocIfMissing(targetRef, {
      ...data,
      taskType: type,
      [target.typeField]: type,
    })
    bump(stats, `templates.${target.collection}.${outcome}`)
  }

  const todos = await userRef.collection('todos').get()
  for (const todoDoc of todos.docs) {
    const data = todoDoc.data()
    const type = getActivityType({
      taskType: data.sourceTaskType,
      category: data.sourceTaskType,
    })
    if (!type) {
      bump(stats, 'todos.ignoredLegacy')
      continue
    }

    const target = targetForTodo(type)
    const sourceId = data.sourceTaskId || data[target.idField]
    const targetRef = userRef.collection(target.collection).doc(todoDoc.id)
    const outcome = await copyDocIfMissing(targetRef, {
      ...data,
      sourceTaskId: sourceId,
      sourceTaskType: type,
      [target.idField]: sourceId,
      [target.typeField]: type,
    })
    bump(stats, `todos.${target.collection}.${outcome}`)
  }

  return { uid, stats }
}

async function main() {
  await assertEmulatorReachable()
  admin.initializeApp({
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      'mystarquest-emulator',
  })
  db = admin.firestore()

  const users = await db.collection('users').listDocuments()
  const results = []

  for (const userRef of users) {
    results.push(await migrateUser(userRef))
  }

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        emulator: process.env.FIRESTORE_EMULATOR_HOST || null,
        users: results,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
