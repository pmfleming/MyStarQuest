import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OfflineState } from '../../src/offline/model'

const session = vi.hoisted(() => ({
  user: { uid: 'offline-parent' },
  childId: 'child',
  failWrites: false,
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/offline/platform', () => ({ isAndroidOffline: () => true }))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: session.user }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: session.childId }),
}))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
vi.mock('../../src/offline/firebaseTransport', () => ({
  sendToFirebase: vi.fn().mockRejectedValue(new Error('Firebase unavailable')),
  localDocument: (value: unknown) => value,
  snapshotDocument: (value: Record<string, unknown>) => ({
    ...value,
    createdAt: { toDate: () => new Date(0) },
  }),
}))
vi.mock('../../src/offline/persistence', () => ({
  IndexedDbPersistence: class {
    values = new Map<string, OfflineState>()
    async read(id: string) {
      return structuredClone(this.values.get(id))
    }
    async write(id: string, state: OfflineState) {
      if (session.failWrites) throw new Error('Disk full')
      this.values.set(id, structuredClone(state))
    }
  },
}))

import { offlineRuntime } from '../../src/offline/runtime'
import { useChores } from '../../src/data/useChores'
import { useTests } from '../../src/data/useTests'
import { useRewards } from '../../src/data/useRewards'
import { projectDocuments } from '../../src/offline/model'
import { getTodayDescriptor } from '../../src/lib/today'

beforeEach(async () => {
  session.failWrites = false
  session.user = { uid: crypto.randomUUID() }
  const store = offlineRuntime(session.user.uid).store
  await store.mergeCollection('children', {
    child: { displayName: 'Child', totalStars: 5 },
  })
  await store.mergeCollection('chores', {
    tidy: {
      childId: 'child',
      title: 'Tidy',
      taskType: 'standard',
      isRepeating: true,
      starValue: 3,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
    },
  })
  await store.mergeCollection('rewards', {
    toy: { title: 'Toy', costStars: 3, isRepeating: true },
  })
})

describe('Android offline data hooks', () => {
  it('does not save a completed test without its stars when storage fails', async () => {
    const hook = renderHook(() => useTests())
    await waitFor(() =>
      expect(hook.result.current.tests.length).toBeGreaterThan(0)
    )
    const runtime = offlineRuntime(session.user.uid)
    // Materialize the default definition first so the failed write is the award.
    await act(async () => {
      await hook.result.current.resetTest(hook.result.current.tests[0])
    })
    const before = runtime.store.getSnapshot()
    session.failWrites = true
    await act(async () => {
      await expect(
        hook.result.current.completeTest(hook.result.current.tests[0])
      ).rejects.toThrow('Disk full')
    })
    expect(runtime.store.getSnapshot()).toBe(before)
    expect(hook.result.current.tests[0].lastAttemptedAt ?? null).toBeNull()
    expect(
      projectDocuments(runtime.store.getSnapshot()!, 'children').child
        .totalStars
    ).toBe(5)
    session.failWrites = false
  })

  it('completes, reloads, resets and repeats a chore without Firebase', async () => {
    const hook = renderHook(() => useChores())
    await waitFor(() => expect(hook.result.current.chores).toHaveLength(1))
    await act(async () => {
      await hook.result.current.completeChore(hook.result.current.chores[0])
    })
    const runtime = offlineRuntime(session.user.uid)
    expect(
      projectDocuments(runtime.store.getSnapshot()!, 'children').child
        .totalStars
    ).toBe(8)
    hook.unmount()
    const reopened = renderHook(() => useChores())
    await waitFor(() =>
      expect(reopened.result.current.chores[0]?.manageCompletedAt).toBeTruthy()
    )
    await act(async () => {
      await reopened.result.current.resetChore(
        reopened.result.current.chores[0]
      )
    })
    await act(async () => {
      await reopened.result.current.completeChore(
        reopened.result.current.chores[0]
      )
    })
    expect(
      projectDocuments(runtime.store.getSnapshot()!, 'children').child
        .totalStars
    ).toBe(11)
    expect(
      runtime.store
        .getSnapshot()
        ?.pending.filter(
          (op) => op.action.kind === 'activity' && op.action.complete
        )
    ).toHaveLength(2)
  })

  it('buys a reward and updates the balance immediately while Firebase is unavailable', async () => {
    const hook = renderHook(() => useRewards())
    await waitFor(() => expect(hook.result.current.rewards).toHaveLength(1))
    await act(async () => {
      expect(
        await hook.result.current.giveReward(hook.result.current.rewards[0])
      ).toEqual({ title: 'Toy', starsBefore: 5, starsAfter: 2 })
    })
    expect(hook.result.current.activeChildStars).toBe(2)
    await act(async () => {
      await hook.result.current.giveReward(hook.result.current.rewards[0])
    })
    expect(hook.result.current.activeChildStars).toBe(0)
  })

  it('persists default-test completion and reset locally', async () => {
    const hook = renderHook(() => useTests())
    await waitFor(() =>
      expect(hook.result.current.tests.length).toBeGreaterThan(0)
    )
    const id = hook.result.current.tests[0].id
    await act(async () => {
      await hook.result.current.completeTest(
        hook.result.current.tests.find((test) => test.id === id)!
      )
    })
    const runtime = offlineRuntime(session.user.uid)
    const awards = () =>
      runtime.store
        .getSnapshot()!
        .pending.filter(
          (op) => op.action.kind === 'activity' && op.action.complete
        )
    expect(awards()).toHaveLength(1)
    await act(async () => {
      await hook.result.current.resetTest(
        hook.result.current.tests.find((test) => test.id === id)!
      )
    })
    await act(async () => {
      await hook.result.current.completeTest(
        hook.result.current.tests.find((test) => test.id === id)!
      )
    })
    expect(awards()).toHaveLength(2)
    hook.unmount()
    const reopened = renderHook(() => useTests())
    await waitFor(() =>
      expect(
        reopened.result.current.tests.find((test) => test.id === id)
          ?.lastAttemptDateKey
      ).toBe(getTodayDescriptor().dateKey)
    )
  })

  it('keeps one-time consumption local when the shared definition refreshes', async () => {
    const runtime = offlineRuntime(session.user.uid)
    await runtime.store.mergeCollection('rewards', {
      toy: { title: 'Toy', costStars: 3, isRepeating: false },
    })
    const hook = renderHook(() => useRewards())
    await waitFor(() => expect(hook.result.current.rewards).toHaveLength(1))
    await act(async () => {
      await hook.result.current.giveReward(hook.result.current.rewards[0])
    })
    expect(hook.result.current.rewards).toHaveLength(0)
    await act(async () => {
      await runtime.store.mergeCollection('rewards', {
        toy: { title: 'Toy', costStars: 3, isRepeating: false },
      })
    })
    expect(hook.result.current.rewards).toHaveLength(0)
  })
})
