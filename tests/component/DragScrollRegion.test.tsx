import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DragScrollRegion from '../../src/components/ui/DragScrollRegion'
import { themes } from '../../src/contexts/ThemeContext'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function setup() {
  const click = vi.fn()
  const view = render(
    <DragScrollRegion theme={themes.princess}>
      <p>Chore content</p>
      <button onClick={click}>Open chore</button>
    </DragScrollRegion>
  )
  const region = view.container.querySelector('.app-scroll-region')!
  Object.defineProperties(region, {
    scrollHeight: { value: 1000 },
    clientHeight: { value: 200 },
  })
  fireEvent.resize(window)
  fireEvent.mouseDown(screen.getByText('Chore content'), {
    button: 0,
    clientY: 200,
  })
  fireEvent.mouseMove(window, { clientY: 150 })
  return { ...view, click, region }
}

describe('chore page drag cleanup', () => {
  it('releases a cancelled drag when the window loses focus', () => {
    const { click, region } = setup()
    expect(region).toHaveClass('is-dragging')
    fireEvent.blur(window)
    expect(region).not.toHaveClass('is-dragging')
    expect(document.body.style.userSelect).not.toBe('none')
    fireEvent.click(screen.getByRole('button', { name: 'Open chore' }))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('removes active drag listeners when navigating away mid-drag', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = setup()
    const dragListeners = add.mock.calls.filter(
      ([type]) => type === 'mousemove' || type === 'mouseup'
    )
    expect(dragListeners).toHaveLength(2)
    unmount()
    for (const [type, handler] of dragListeners) {
      expect(remove).toHaveBeenCalledWith(type, handler)
    }
    expect(document.body.style.userSelect).not.toBe('none')
  })
})
