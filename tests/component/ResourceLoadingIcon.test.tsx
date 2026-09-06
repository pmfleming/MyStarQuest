import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ResourceLoadingIcon from '../../src/components/ui/ResourceLoadingIcon'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false }))
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('reveals clockwise, waits short of full opacity, and finishes only when ready', () => {
  const { rerender } = render(
    <ResourceLoadingIcon src="heart.webp" loading label="Loading Teeniepings" />
  )
  const icon = screen.getByRole('status')
  const angle = () =>
    parseFloat(icon.style.getPropertyValue('--resource-fill-angle'))
  expect(icon.textContent).toBe('')
  expect(angle()).toBe(0)
  act(() => vi.advanceTimersByTime(2000))
  expect(angle()).toBeGreaterThan(150)
  expect(angle()).toBeLessThan(180)
  act(() => vi.advanceTimersByTime(10000))
  expect(angle()).toBe(324)
  rerender(
    <ResourceLoadingIcon
      src="heart.webp"
      loading={false}
      label="Loading Teeniepings"
    />
  )
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  act(() => vi.advanceTimersByTime(200))
  expect(angle()).toBe(360)
  expect(vi.getTimerCount()).toBe(0)
})

it('restarts a new request and cancels animation on unmount', () => {
  const { rerender, unmount } = render(
    <ResourceLoadingIcon src="heart.webp" loading label="Loading" />
  )
  act(() => vi.advanceTimersByTime(2000))
  rerender(<ResourceLoadingIcon src="butterfly.webp" loading label="Loading" />)
  expect(
    screen.getByRole('status').style.getPropertyValue('--resource-fill-angle')
  ).toBe('0deg')
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('honors reduced motion with a static faded icon until ready', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  )
  const { rerender } = render(
    <ResourceLoadingIcon src="heart.webp" loading label="Loading" />
  )
  const icon = screen.getByRole('status')
  expect(icon.style.getPropertyValue('--resource-fill-angle')).toBe('0deg')
  expect(vi.getTimerCount()).toBe(0)
  rerender(
    <ResourceLoadingIcon src="heart.webp" loading={false} label="Loading" />
  )
  expect(icon.style.getPropertyValue('--resource-fill-angle')).toBe('360deg')
})
