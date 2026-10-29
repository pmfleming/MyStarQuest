import { StrictMode, useRef } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useDismissibleLayer } from '../../src/hooks/useDismissibleLayer'

function Layer({ onDismiss }: { onDismiss: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useDismissibleLayer({ ref, onDismiss, autoFocus: true })
  return (
    <button ref={ref}>
      <span>Preview</span>
    </button>
  )
}

afterEach(cleanup)

it('owns focus through StrictMode replay, uses the latest callback and releases listeners', () => {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  trigger.focus()
  const old = vi.fn(),
    latest = vi.fn()
  const { rerender, unmount } = render(
    <StrictMode>
      <Layer onDismiss={old} />
    </StrictMode>
  )
  expect(screen.getByRole('button', { name: 'Preview' })).toHaveFocus()
  expect(old).not.toHaveBeenCalled()
  rerender(
    <StrictMode>
      <Layer onDismiss={latest} />
    </StrictMode>
  )
  fireEvent.pointerDown(screen.getByText('Preview'))
  expect(latest).not.toHaveBeenCalled()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(latest).toHaveBeenCalledOnce()
  expect(old).not.toHaveBeenCalled()
  unmount()
  expect(trigger).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(latest).toHaveBeenCalledOnce()
  trigger.remove()
})

it('dismisses on outside focus without taking focus back from the new control', () => {
  const dismiss = vi.fn()
  const { unmount } = render(<Layer onDismiss={dismiss} />)
  const outside = document.createElement('button')
  document.body.append(outside)
  outside.focus()
  expect(dismiss).toHaveBeenCalledOnce()
  unmount()
  expect(outside).toHaveFocus()
  outside.remove()
})
