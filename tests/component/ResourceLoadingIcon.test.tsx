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

it('restarts a new request and cancels animation on unmount', () => {
  const { rerender, unmount } = render(
    <ResourceLoadingIcon src="heart.webp" loading label="Loading" />
  )
  act(() => vi.advanceTimersByTime(2000))
  rerender(<ResourceLoadingIcon src="butterfly.webp" loading label="Loading" />)
  expect(screen.getByRole('status', { name: 'Loading' })).toBeVisible()
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('honors reduced motion while reporting loading until ready', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  )
  const { rerender } = render(
    <ResourceLoadingIcon src="heart.webp" loading label="Loading" />
  )
  expect(screen.getByRole('status', { name: 'Loading' })).toBeVisible()
  expect(vi.getTimerCount()).toBe(0)
  rerender(
    <ResourceLoadingIcon src="heart.webp" loading={false} label="Loading" />
  )
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
