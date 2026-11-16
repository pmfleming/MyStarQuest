// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { expect, it, vi } from 'vitest'

const code = ts.transpileModule(
  readFileSync('functions/src/index.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }
).outputText
function setup(documents: Record<string, unknown>[]) {
  const update = vi.fn()
  const commit = vi.fn(async () => {})
  const batch = vi.fn(() => ({ update, commit }))
  const docs = documents.map((data, ref) => ({ ref, data: () => data }))
  const db = {
    batch,
    collection: () => ({ where: () => ({ get: async () => ({ docs }) }) }),
    doc: () => ({ get: async () => ({ exists: true, data: () => ({}) }) }),
  }
  const exports: Record<
    string,
    (request: unknown) => Promise<{ refreshed: number }>
  > = {}
  runInNewContext(code, {
    exports,
    console: { log: vi.fn() },
    require: (id: string) =>
      ({
        'firebase-admin/app': { initializeApp: vi.fn() },
        'firebase-admin/firestore': { getFirestore: () => db },
        'firebase-functions/v2/scheduler': { onSchedule: vi.fn() },
        'firebase-functions/v2/https': {
          onCall: (handler: unknown) => handler,
          onRequest: vi.fn(),
          HttpsError: Error,
        },
      })[id] ?? {},
  })
  return {
    update,
    commit,
    batch,
    reset: () =>
      exports.resetTodayChores({
        auth: { uid: 'parent' },
        data: { childId: 'child' },
      }),
  }
}
it('does not issue writes for already reset chores, but initializes missing fields', async () => {
  const dinner = {
    taskType: 'eating',
    manageDinnerCompletedAt: null,
    manageDinnerRemainingSeconds: 600,
    manageDinnerBitesLeft: 2,
    manageDinnerTimerStartedAt: null,
  }
  const water = {
    taskType: 'watertoiletcheck',
    manageWaterToiletCompletedAt: null,
    manageWaterLevel: 'full',
    manageToiletStatus: 'notpeepee',
  }
  const { reset, update, commit } = setup([
    { manageCompletedAt: null },
    dinner,
    water,
    {},
    { ...dinner, manageDinnerBitesLeft: 1 },
  ])
  expect(await reset()).toMatchObject({ refreshed: 2 })
  expect(update).toHaveBeenCalledTimes(2)
  expect(update).toHaveBeenCalledWith(3, { manageCompletedAt: null })
  expect(commit).toHaveBeenCalledOnce()
  const unchanged = setup([{ manageCompletedAt: null }, dinner, water])
  expect(await unchanged.reset()).toMatchObject({ refreshed: 0 })
  expect(unchanged.batch).not.toHaveBeenCalled()
})
it('chunks actual changes and stops after a failed batch', async () => {
  const bulk = setup(
    Array.from({ length: 1001 }, () => ({ manageCompletedAt: 123 }))
  )
  await bulk.reset()
  expect(bulk.commit).toHaveBeenCalledTimes(3)
  expect(bulk.update).toHaveBeenCalledTimes(1001)
  const failed = setup(
    Array.from({ length: 501 }, () => ({ manageCompletedAt: 123 }))
  )
  failed.commit.mockRejectedValueOnce(new Error('unavailable'))
  await expect(failed.reset()).rejects.toThrow('unavailable')
  expect(failed.update).toHaveBeenCalledTimes(500)
  expect(failed.batch).toHaveBeenCalledOnce()
})
