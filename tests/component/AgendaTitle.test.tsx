import { act, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AgendaTitle from '../../src/components/AgendaTitle'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('coalesces resize bursts and reuses text measurements until its font changes', () => {
  let resize = () => {}
  let frame: FrameRequestCallback = () => {}
  const request = vi.fn((next: FrameRequestCallback) => {
    frame = next
    return 1
  })
  const cancel = vi.fn()
  const disconnect = vi.fn()
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      disconnect = disconnect
    }
  )
  let width = 100
  let fontSize = 20
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    () => width
  )
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        paddingLeft: '0',
        paddingRight: '0',
        font: `${fontSize}px sans-serif`,
        fontSize: `${fontSize}px`,
        letterSpacing: 'normal',
        textTransform: 'none',
      }) as CSSStyleDeclaration
  )
  const measure = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(() => ({ width: fontSize * 10 }) as DOMRect)
  const { getByText, unmount } = render(<AgendaTitle title="A long title" />)
  expect(getByText('A long title').style.fontSize).toBe('10px')
  expect(measure).toHaveBeenCalledTimes(1)
  for (let i = 0; i < 20; i++) resize()
  expect(request).toHaveBeenCalledTimes(1)
  act(() => frame(0))
  expect(measure).toHaveBeenCalledTimes(1)
  width = 150
  resize()
  act(() => frame(16))
  expect(getByText('A long title').style.fontSize).toBe('15px')
  expect(measure).toHaveBeenCalledTimes(1)
  fontSize = 30
  resize()
  act(() => frame(32))
  expect(measure).toHaveBeenCalledTimes(2)
  expect(getByText('A long title').style.fontSize).toBe('15px')
  width = 500
  resize()
  act(() => frame(48))
  expect(getByText('A long title').style.fontSize).toBe('')
  resize()
  unmount()
  expect(cancel).toHaveBeenCalledWith(1)
  expect(disconnect).toHaveBeenCalledOnce()
})
