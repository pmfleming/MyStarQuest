import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const props = {
  theme: themes.teenie,
  totalProblems: 3,
  starReward: 3,
  isRunning: true,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onExit: vi.fn(),
}

function doubleClick(button: HTMLElement) {
  fireEvent.click(button, { detail: 1 })
  act(() => vi.advanceTimersByTime(100))
  fireEvent.click(button, { detail: 2 })
  fireEvent.doubleClick(button, { detail: 2 })
  act(() => vi.advanceTimersByTime(600))
}

describe('Who am I picture gestures', () => {
  it.each(['Dinosaurs', 'Teeniepings'])(
    '%s: a double-click zooms without switching, a single-click switches when available',
    async (collection) => {
      const { unmount } = render(<AnimalTester {...props} />)
      await act(async () => {
        fireEvent.click(screen.getByRole('radio', { name: collection }))
        await vi.dynamicImportSettled()
      })
      const portrait = await screen.findByRole('button', {
        name: /^(View |Enlarge .* picture)/,
      })
      await waitFor(() =>
        expect(
          screen.getByRole('radio', { name: collection })
        ).not.toHaveAttribute('aria-busy')
      )
      const cartoon = portrait.querySelector('img')!.getAttribute('src')
      vi.useFakeTimers()
      try {
        doubleClick(portrait)
        expect(portrait).toHaveAttribute('aria-expanded', 'true')
        expect(portrait.querySelector('img')).toHaveAttribute('src', cartoon)
        fireEvent.keyDown(portrait, { key: 'Escape' })
        expect(portrait).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(portrait, { detail: 1 })
        act(() => vi.advanceTimersByTime(600))
        if (collection === 'Teeniepings') {
          expect(portrait.querySelector('img')).toHaveAttribute('src', cartoon)
        } else {
          expect(portrait.querySelector('img')).not.toHaveAttribute(
            'src',
            cartoon
          )
          // A pending switch must not fire on the next creature.
          fireEvent.click(portrait, { detail: 1 })
          fireEvent.click(
            screen.getByRole('button', {
              name: /^Next (animal|insect|creature)$/,
            })
          )
          act(() => vi.advanceTimersByTime(600))
          expect(
            screen.getByRole('button', { name: /^View (drawing|cartoon)/ })
          ).toHaveAttribute('aria-pressed', 'true')
        }
      } finally {
        unmount()
        vi.useRealTimers()
      }
    }
  )

  it('double-clicking a hidden two-player portrait never reveals the answer', () => {
    const { rerender, unmount } = render(
      <AnimalTester {...props} isRunning={false} />
    )
    fireEvent.click(screen.getByRole('radio', { name: '2 Players' }))
    rerender(<AnimalTester {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hide animal' }))
    const hidden = screen.getByRole('button', { name: 'Show animal' })
    vi.useFakeTimers()
    try {
      doubleClick(hidden)
      expect(hidden).toHaveAttribute('aria-expanded', 'true')
      expect(hidden).toHaveAttribute('aria-pressed', 'true')
      expect(
        screen.queryByRole('button', { name: 'Hide animal' })
      ).not.toBeInTheDocument()
      fireEvent.click(hidden, { detail: 1 })
      act(() => vi.advanceTimersByTime(600))
      expect(
        screen.getByRole('button', { name: 'Hide animal' })
      ).toHaveAttribute('aria-expanded', 'true')
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })
})
