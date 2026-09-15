// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const database = vi.hoisted(() => ({
  get: vi.fn(),
  child: vi.fn(),
  listDocuments: vi.fn(),
  update: vi.fn(),
  commit: vi.fn(),
}))
vi.mock(
  '../../functions/node_modules/firebase-admin/lib/esm/app/index.js',
  () => ({ initializeApp: vi.fn() })
)
vi.mock(
  '../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js',
  () => ({
    getFirestore: () => ({
      collection: () => ({
        get: database.get,
        where: () => ({ get: database.get }),
        listDocuments: database.listDocuments,
      }),
      doc: () => ({ get: database.child }),
      batch: () => ({ update: database.update, commit: database.commit }),
    }),
  })
)
// Expose each callback through the same .run entry used by Firebase tests.
vi.mock(
  '../../functions/node_modules/firebase-functions/lib/esm/v2/providers/scheduler.mjs',
  () => ({
    onSchedule: (_: unknown, run: unknown) => ({ run }),
  })
)
vi.mock(
  '../../functions/node_modules/firebase-functions/lib/esm/v2/providers/https.mjs',
  async (original) => ({
    ...(await original<
      typeof import('../../functions/node_modules/firebase-functions/lib/v2/providers/https')
    >()),
    onCall: (run: unknown) => ({ run }),
    onRequest: vi.fn(),
  })
)
import { generateDailyTodos, resetTodayChores } from '../../functions/src/index'

const chore = (id: string, data: Record<string, unknown>) => ({
  id,
  ref: id,
  data: () => ({ taskType: 'standard', title: 'Chore', ...data }),
})
// The mocked .run callback reads only data and auth, not the HTTP transport.
const request = (data: unknown, signedIn = true) =>
  ({
    data,
    auth: signedIn ? { uid: 'parent' } : undefined,
  }) as Parameters<typeof resetTodayChores.run>[0]

beforeEach(() => {
  vi.useFakeTimers().setSystemTime(new Date('2026-09-14T12:00:00Z'))
  database.child.mockResolvedValue({ exists: true })
  database.commit.mockResolvedValue(undefined)
  database.get.mockResolvedValue({
    docs: [
      chore('normal', {}),
      chore('blank', { title: '' }),
      chore('weekend', { schoolDayEnabled: false }),
      chore('test', { taskType: 'math' }),
      chore('legacy', { taskType: 'daynight' }),
      chore('dinner', {
        taskType: 'eating',
        dinnerDurationSeconds: 900,
        dinnerTotalBites: 4,
      }),
    ],
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

it('manual reset includes untitled chores, skips tests/unscheduled/legacy records and preserves dinner settings', async () => {
  expect(await resetTodayChores.run(request({ childId: 'child' }))).toEqual({
    created: 0,
    refreshed: 3,
  })
  expect(database.update.mock.calls).toEqual([
    ['normal', { manageCompletedAt: null }],
    ['blank', { manageCompletedAt: null }],
    [
      'dinner',
      {
        manageDinnerCompletedAt: null,
        manageDinnerRemainingSeconds: 900,
        manageDinnerBitesLeft: 4,
        manageDinnerTimerStartedAt: null,
      },
    ],
  ])
  expect(database.commit).toHaveBeenCalledTimes(1)
})

it('scheduled reset skips untitled and malformed-title chores', async () => {
  database.listDocuments.mockResolvedValue([{ id: 'parent' }])
  database.get
    .mockResolvedValueOnce({ docs: [{ id: 'child' }] })
    .mockResolvedValueOnce({
      docs: [
        chore('normal', {}),
        chore('blank', { title: '' }),
        chore('invalid', { title: 42 }),
      ],
    })
  await generateDailyTodos.run({
    scheduleTime: '2026-09-14T12:00:00Z',
    jobName: 'test',
  })
  expect(database.update.mock.calls).toEqual([
    ['normal', { manageCompletedAt: null }],
  ])
})

it('rejects unauthenticated, malformed and foreign-child requests before writes', async () => {
  await expect(
    resetTodayChores.run(request(null, false))
  ).rejects.toMatchObject({ code: 'unauthenticated' })
  for (const data of [null, {}, { childId: 42 }])
    await expect(resetTodayChores.run(request(data))).rejects.toMatchObject({
      code: 'invalid-argument',
    })
  database.child.mockResolvedValue({ exists: false })
  await expect(
    resetTodayChores.run(request({ childId: 'missing' }))
  ).rejects.toMatchObject({ code: 'not-found' })
  expect(database.update).not.toHaveBeenCalled()
})
