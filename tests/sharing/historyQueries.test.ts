import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, type Firestore } from 'firebase/firestore'
import { childStorageKey } from '../../src/sharing/scope'
import { calendarHistoryWindow } from '../../src/offline/historyRetention'
import { subscribeHistoryWindow } from '../../src/offline/historyQueries'

const state = vi.hoisted(() => ({ db: undefined as Firestore | undefined }))
vi.mock('../../src/firebaseDb', () => ({
  get db() {
    return state.db
  },
}))
vi.mock('../../src/offline/firebaseTransport', () => ({
  localDocument: (data: unknown) => data,
}))
let env: RulesTestEnvironment
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mystarquest-sharing',
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const jan = Date.parse('2024-01-15T12:00:00Z')
    const docs: Record<string, Record<string, unknown>> = {
      'users/owner/children/child': {},
      'users/owner/children/child/parents/parent': { status: 'active' },
      'users/owner/starEvents/numeric': { childId: 'child', createdAt: jan },
      'users/owner/starEvents/timestamp': {
        childId: 'child',
        createdAt: new Date(jan),
      },
      'users/owner/starEvents/day-only': {
        childId: 'child',
        dateKey: '2024-01-15',
      },
      'users/owner/starEvents/delayed': {
        childId: 'child',
        occurredAt: jan,
        createdAt: new Date('2026-11-16'),
      },
      'users/owner/starEvents/old': {
        childId: 'child',
        createdAt: new Date('2020-01-01'),
      },
      'users/owner/starEvents/sibling': { childId: 'other', createdAt: jan },
      'users/owner/children/child/starEvents/legacy-timestamp': {
        childId: 'child',
        createdAt: new Date(jan),
      },
      'users/owner/children/child/starEvents/shared': {
        childId: 'child',
        createdAt: jan,
        operationId: 'operation',
      },
    }
    await Promise.all(
      Object.entries(docs).map(([path, data]) => setDoc(doc(db, path), data))
    )
  })
  state.db = env.authenticatedContext('parent').firestore()
})
afterAll(async () => {
  await env?.cleanup()
})
it('queries every legacy date format in a bounded period, deduplicates migration copies and respects child access', async () => {
  const receive = vi.fn(),
    error = vi.fn()
  const key = childStorageKey({
    actorUid: 'parent',
    ownerUid: 'owner',
    childId: 'child',
    membershipVersion: 1,
  })
  const stop = subscribeHistoryWindow(
    key,
    'starEvents',
    calendarHistoryWindow('2024-01-15', 'month'),
    receive,
    error
  )
  try {
    await vi.waitFor(
      () => {
        expect(error).not.toHaveBeenCalled()
        expect(receive.mock.lastCall?.[1]).toBe(false)
      },
      { timeout: 15000 }
    )
    expect(Object.keys(receive.mock.lastCall![0]).sort()).toEqual([
      'legacy-day-only',
      'legacy-delayed',
      'legacy-numeric',
      'legacy-timestamp',
      'operation',
    ])
  } finally {
    stop()
  }
})
