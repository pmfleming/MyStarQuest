import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import ParentAccessPanel from '../../src/sharing/ParentAccessPanel'
import InvitationPage from '../../src/sharing/InvitationPage'
import type { ChildProfile } from '../../src/data/types'

const call = vi.hoisted(() => vi.fn())
vi.mock('../../src/sharing/api', () => ({ sharingCall: call }))
vi.mock('../../src/offline/runtime', () => ({ offlineRuntime: vi.fn() }))
vi.mock('../../src/sharing/ChildAccessContext', () => ({
  useDataScope: () => ({ canAdmin: true }),
}))
afterEach(cleanup)

it('marks extra parents as in development without loading or inviting parents', () => {
  render(
    <ParentAccessPanel
      child={{ id: 'child', displayName: 'Odette' } as ChildProfile}
    />
  )
  expect(screen.getByText('In development')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Invite parent' })).toBeNull()
  expect(call).not.toHaveBeenCalled()
})

it('keeps invitation links on the development notice without accepting them', () => {
  render(
    <MemoryRouter initialEntries={['/invite/example#token']}>
      <InvitationPage />
    </MemoryRouter>
  )
  expect(screen.getByText('In development')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Accept invitation' })).toBeNull()
  expect(
    screen.getByRole('link', { name: 'Back to MyStarQuest' })
  ).toHaveAttribute('href', '/tabs/chores')
  expect(call).not.toHaveBeenCalled()
})
