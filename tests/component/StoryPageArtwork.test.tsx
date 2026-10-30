import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StoryPageArtwork from '../../src/components/StoryPageArtwork'
import type { Story } from '../../src/data/stories'
import { STORY_PAGE_TRANSITION_MS } from '../../src/lib/storyMotion'

class ControlledImage {
  src = ''
  decoding = ''
  fetchPriority = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  decode = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  constructor() {
    requests.push(this)
  }
}
const requests: ControlledImage[] = []
const panels: Story['panels'] = ['cover', 'one', 'two'].map((id) => ({
  id,
  label: id,
  image: `/${id}.webp`,
  alt: `Story ${id}`,
  tone: 'ocean',
  framing: 'poster',
  aspectRatio: 1,
  maxWidth: 100,
}))

beforeEach(() => {
  requests.length = 0
  vi.stubGlobal('Image', ControlledImage)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('keeps the current page visible until the next image is decoded, then releases the outgoing page', async () => {
  vi.useFakeTimers()
  const view = render(<StoryPageArtwork panels={panels} page={0} />)
  view.rerender(<StoryPageArtwork panels={panels} page={1} />)
  expect(requests.at(-1)).toMatchObject({
    decoding: 'async',
    fetchPriority: 'high',
  })
  expect(screen.getByRole('img', { name: 'Story cover' })).toBeVisible()
  expect(view.container.firstChild).toHaveAttribute('aria-busy', 'true')
  await act(async () => {
    requests.at(-1)!.onload!()
  })
  const current = screen.getByRole('img', { name: 'Story one' })
  expect(current).toBeVisible()
  expect(view.container.querySelector('.story-page-previous')).toHaveAttribute(
    'aria-hidden',
    'true'
  )
  act(() => vi.advanceTimersByTime(STORY_PAGE_TRANSITION_MS - 1))
  expect(
    view.container.querySelector('.story-page-previous')
  ).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1))
  expect(view.container.querySelector('.story-page-previous')).toBeNull()
  expect(view.container.firstChild).toHaveAttribute('aria-busy', 'false')
})

it('ignores an old decode that finishes after scrubbing to a later page', async () => {
  const view = render(<StoryPageArtwork panels={panels} page={0} />)
  view.rerender(<StoryPageArtwork panels={panels} page={1} />)
  let finishSlowDecode!: () => void
  requests.at(-1)!.decode.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finishSlowDecode = resolve
      })
  )
  act(() => {
    requests.at(-1)!.onload!()
  })
  view.rerender(<StoryPageArtwork panels={panels} page={2} />)
  await act(async () => {
    requests.at(-1)!.onload!()
  })
  expect(screen.getByRole('img', { name: 'Story two' })).toBeVisible()
  await act(async () => {
    finishSlowDecode()
  })
  expect(screen.getByRole('img', { name: 'Story two' })).toBeVisible()
  expect(screen.queryByRole('img', { name: 'Story one' })).toBeNull()
})

it('keeps the previous artwork on a failed load and recovers on another page', async () => {
  const view = render(<StoryPageArtwork panels={panels} page={0} />)
  view.rerender(<StoryPageArtwork panels={panels} page={1} />)
  act(() => {
    requests.at(-1)!.onerror!()
  })
  expect(screen.getByRole('alert')).toHaveTextContent('could not load')
  expect(screen.getByRole('img', { name: 'Story cover' })).toBeVisible()
  view.rerender(<StoryPageArtwork panels={panels} page={2} />)
  await act(async () => {
    requests.at(-1)!.onload!()
  })
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('img', { name: 'Story two' })).toBeVisible()
})
