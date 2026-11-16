vi.mock('../../src/offline/runtime', () => ({ offlineRuntime: vi.fn() }))
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ManageChildrenPage from '../../src/pages/ManageChildrenPage'

vi.mock('../../src/sharing/ChildAccessContext', () => ({
  useDataScope: () => ({ canAdmin: true }),
}))

const state = vi.hoisted(() => ({
  themeId: 'princess' as 'princess' | 'teenie',
  deleteChild: vi.fn(),
  avatarToken: 'odette-ping',
  updateChildField: vi.fn(),
}))

vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: 'child-1' }),
}))
vi.mock('../../src/contexts/ThemeContext', async (original) => {
  const actual =
    await original<typeof import('../../src/contexts/ThemeContext')>()
  return {
    ...actual,
    useTheme: () => ({ theme: actual.themes[state.themeId] }),
  }
})
vi.mock('../../src/components/PageShell', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../src/data/useChildren', () => ({
  useChildren: () => ({
    children: [
      {
        id: 'child-1',
        displayName: 'Alex',
        themeId: state.themeId,
        avatarToken: state.avatarToken,
        totalStars: 5,
      },
    ],
    nameDrafts: {},
    setNameDraft: vi.fn(),
    commitDisplayName: vi.fn(),
    updateChildField: state.updateChildField,
    changeTheme: vi.fn(),
    createChild: vi.fn(),
    deleteChild: state.deleteChild,
    selectChild: vi.fn(),
  }),
}))

beforeEach(() => {
  state.themeId = 'princess'
  state.avatarToken = 'odette-ping'
  state.updateChildField.mockReset()
  state.deleteChild.mockReset().mockResolvedValue(undefined)
})
afterEach(() => vi.restoreAllMocks())

it('offers the existing Odette portraits in the standard carousel and saves only the avatar field', async () => {
  const { rerender } = render(<ManageChildrenPage />)
  expect(
    screen.getByRole('group', { name: 'Select Avatar' })
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Selected: Odette Ping')).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Next: Mermaid Odette Ping' })
  )
  await waitFor(() =>
    expect(
      screen.getByLabelText('Selected: Mermaid Odette Ping')
    ).toBeInTheDocument()
  )
  expect(state.updateChildField).toHaveBeenCalledWith('child-1', {
    avatarToken: 'mermaid-odette-ping',
  })
  state.avatarToken = 'mermaid-odette-ping'
  state.themeId = 'teenie'
  rerender(<ManageChildrenPage />)
  expect(
    screen.getByLabelText('Selected: Mermaid Odette Ping')
  ).toBeInTheDocument()
  for (const name of [
    'Angel Odette Ping',
    'Space Odette Ping',
    'Theme character',
    'Odette Ping',
  ]) {
    fireEvent.click(screen.getByRole('button', { name: `Next: ${name}` }))
    await waitFor(() =>
      expect(screen.getByLabelText(`Selected: ${name}`)).toBeInTheDocument()
    )
  }
})

it('keeps older profiles on the theme character until an avatar is chosen', () => {
  state.avatarToken = '👑'
  render(<ManageChildrenPage />)
  expect(screen.getByLabelText('Selected: Theme character')).toBeInTheDocument()
  expect(state.updateChildField).not.toHaveBeenCalled()
})

describe('child deletion confirmation', () => {
  it.each(['princess'] as const)(
    'confirms %s deletion, restores focus on cancel and retries a failed save',
    async (themeId) => {
      state.themeId = themeId
      vi.spyOn(console, 'error').mockImplementation(() => {})
      state.deleteChild.mockRejectedValueOnce(new Error('Offline'))
      render(<ManageChildrenPage />)
      const deleteButton = screen.getByRole('button', { name: 'Delete Alex' })
      const card = deleteButton.closest('article')!
      fireEvent.click(deleteButton)
      expect(state.deleteChild).not.toHaveBeenCalled()
      expect(card).not.toHaveClass('whimsical-card-exiting')
      const no = screen.getByRole('button', { name: 'No, keep' })
      expect(no).toHaveFocus()

      fireEvent.click(no)
      expect(state.deleteChild).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('button', { name: 'Yes, delete' })
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete Alex' })).toHaveFocus()

      fireEvent.click(screen.getByRole('button', { name: 'Delete Alex' }))
      fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
      fireEvent.animationEnd(card)
      expect(await screen.findByRole('alert')).toHaveTextContent('failed')
      expect(card).not.toHaveClass('whimsical-card-exiting')
      expect(screen.getByRole('textbox', { name: 'Child name' })).toHaveValue(
        'Alex'
      )
      fireEvent.click(screen.getByRole('button', { name: 'Delete Alex' }))
      fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
      fireEvent.animationEnd(card)
      await waitFor(() => expect(state.deleteChild).toHaveBeenCalledTimes(2))
      expect(state.deleteChild).toHaveBeenLastCalledWith('child-1')
    }
  )
})
