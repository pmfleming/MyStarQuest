import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SchoolCalendarSync from '../../src/components/SchoolCalendarSync'

const state = vi.hoisted(() => ({
  user: null as null | { uid: string },
  idle: undefined as undefined | (() => void),
  cancel: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: state.user }),
}))
vi.mock('../../src/lib/afterFirstPaint', () => ({
  afterFirstPaint: (callback: () => void) => {
    state.idle = callback
    return state.cancel
  },
}))
vi.mock('../../src/lib/schoolCalendarStore', () => ({
  schoolCalendarStore: { start: state.start },
}))
beforeEach(() => {
  vi.clearAllMocks()
  state.user = null
  state.idle = undefined
  state.start.mockReturnValue(state.stop)
})
afterEach(() => vi.restoreAllMocks())

it('does not start a late import after sign-out or unmount', async () => {
  state.user = { uid: 'test' }
  const view = render(<SchoolCalendarSync />)
  view.unmount()
  await act(async () => {
    state.idle!()
  })
  expect(state.start).not.toHaveBeenCalled()
  expect(state.cancel).toHaveBeenCalledOnce()
})
