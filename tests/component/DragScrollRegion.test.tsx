import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import DragScrollRegion from '../../src/components/ui/DragScrollRegion'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(600)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.style.removeProperty('user-select')
})

const setup = () => {
  const click = vi.fn()
  const view = render(
    <DragScrollRegion>
      <div onClick={click}>Drag here</div>
      <button>Interactive</button>
      <div data-no-drag-scroll="true">Globe</div>
    </DragScrollRegion>
  )
  const content = screen.getByText('Drag here')
  return { ...view, click, content, region: content.parentElement! }
}

it('uses a movement threshold, suppresses the drag click, then permits normal clicks', () => {
  const { content, region, click } = setup()
  fireEvent.mouseDown(content, { clientY: 100 })
  fireEvent.mouseMove(window, { clientY: 95 })
  expect(region.scrollTop).toBe(0)
  fireEvent.mouseMove(window, { clientY: 80 })
  expect(region.scrollTop).toBe(30)
  expect(region).toHaveClass('is-dragging')
  fireEvent.mouseUp(window)
  fireEvent.click(content)
  expect(click).not.toHaveBeenCalled()
  act(() => vi.runAllTimers())
  fireEvent.click(content)
  expect(click).toHaveBeenCalledOnce()
})

it('leaves controls, the globe, right clicks and non-scrollable content alone', () => {
  const { content, region } = setup()
  for (const target of [
    screen.getByRole('button'),
    screen.getByText('Globe'),
  ]) {
    fireEvent.mouseDown(target, { clientY: 100 })
    fireEvent.mouseMove(window, { clientY: 80 })
    expect(region.scrollTop).toBe(0)
  }
  fireEvent.mouseDown(content, { button: 2, clientY: 100 })
  fireEvent.mouseMove(window, { clientY: 80 })
  expect(region.scrollTop).toBe(0)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200)
  fireEvent.mouseDown(content, { clientY: 100 })
  fireEvent.mouseMove(window, { clientY: 80 })
  expect(region.scrollTop).toBe(0)
})
