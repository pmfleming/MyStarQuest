import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ManageChildrenPage from '../../src/pages/ManageChildrenPage'
import { getThemeAsset } from '../../src/ui/themeAssets'

const state = vi.hoisted(() => ({
  themeId: 'princess' as 'princess' | 'teenie',
  deleteChild: vi.fn(),
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
        totalStars: 5,
      },
    ],
    nameDrafts: {},
    setNameDraft: vi.fn(),
    commitDisplayName: vi.fn(),
    updateChildField: vi.fn(),
    changeTheme: vi.fn(),
    createChild: vi.fn(),
    deleteChild: state.deleteChild,
    selectChild: vi.fn(),
  }),
}))

beforeEach(() => {
  state.themeId = 'princess'
  state.deleteChild.mockReset().mockResolvedValue(undefined)
})
afterEach(() => vi.restoreAllMocks())

describe('child deletion confirmation', () => {
  it.each(['princess'] as const)(
    'uses the shared %s confirmation buttons and deletes only after Yes',
    async (themeId) => {
      state.themeId = themeId
      render(<ManageChildrenPage />)
      const deleteButton = screen.getByRole('button', { name: 'Delete Alex' })
      const card = deleteButton.closest('article')!
      fireEvent.click(deleteButton)
      expect(state.deleteChild).not.toHaveBeenCalled()
      expect(card).not.toHaveClass('whimsical-card-exiting')
      const yes = screen.getByRole('button', { name: 'Yes, delete' })
      const no = screen.getByRole('button', { name: 'No, keep' })
      expect(yes.querySelector('img')).toHaveAttribute(
        'src',
        getThemeAsset(themeId, 'confirmExitImage')
      )
      expect(no.querySelector('img')).toHaveAttribute(
        'src',
        getThemeAsset(themeId, 'continueActivityImage')
      )
      expect(no).toHaveFocus()
      expect(yes.textContent).toBe('')
      expect(no.textContent).toBe('')

      fireEvent.click(no)
      expect(state.deleteChild).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('button', { name: 'Yes, delete' })
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete Alex' })).toHaveFocus()

      fireEvent.click(screen.getByRole('button', { name: 'Delete Alex' }))
      fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
      fireEvent.animationEnd(card)
      await waitFor(() =>
        expect(state.deleteChild).toHaveBeenCalledExactlyOnceWith('child-1')
      )
    }
  )
})
