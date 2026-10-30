import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StoryPageArtwork from '../../src/components/StoryPageArtwork'
import type { Story } from '../../src/data/stories'
import { STORY_PAGE_TRANSITION_MS } from '../../src/lib/storyMotion'
import * as photoMoment from '../../src/lib/storyPhotoMoment'
import * as underwater from '../../src/lib/storyUnderwater'

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
  vi.restoreAllMocks()
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

it('plays the photo once after decoding and disposes it immediately when scrubbing away', async () => {
  vi.useFakeTimers()
  const play = vi.fn().mockResolvedValue(undefined)
  const dispose = vi.fn()
  vi.spyOn(photoMoment, 'createPhotoMoment').mockReturnValue({
    play,
    stop: vi.fn(),
    dispose,
  })
  const scenes: Story['panels'] = panels.map((panel, index) =>
    index === 1 ? { ...panel, effect: 'photo-moment' } : panel
  )
  const view = render(<StoryPageArtwork panels={scenes} page={0} />)
  view.rerender(<StoryPageArtwork panels={scenes} page={1} />)
  expect(play).not.toHaveBeenCalled()
  await act(async () => requests.at(-1)!.onload!())
  expect(play).toHaveBeenCalledTimes(1)
  act(() => vi.advanceTimersByTime(STORY_PAGE_TRANSITION_MS))
  expect(play).toHaveBeenCalledTimes(1)
  view.rerender(<StoryPageArtwork panels={scenes} page={2} />)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('img', { name: 'Story one' })).toBeVisible()
  view.rerender(<StoryPageArtwork panels={scenes} page={1} />)
  expect(play).toHaveBeenCalledTimes(2)
  view.unmount()
  expect(dispose).toHaveBeenCalledTimes(2)
})

it('retains one underwater scene between introductions and disposes it when leaving', async () => {
  const show = vi.fn().mockResolvedValue(undefined)
  const dispose = vi.fn()
  const create = vi
    .spyOn(underwater, 'createUnderwaterScene')
    .mockReturnValue({ show, stop: vi.fn(), dispose })
  const scenes: Story['panels'] = panels.map((panel, index) =>
    index < 2 ? { ...panel, effect: 'underwater-meeting' } : panel
  )
  const view = render(<StoryPageArtwork panels={scenes} page={0} />)
  expect(show).toHaveBeenLastCalledWith('cover')
  view.rerender(<StoryPageArtwork panels={scenes} page={1} />)
  await act(async () => requests.at(-1)!.onload!())
  expect(create).toHaveBeenCalledTimes(1)
  expect(show).toHaveBeenLastCalledWith('one')
  view.rerender(<StoryPageArtwork panels={scenes} page={2} />)
  expect(dispose).toHaveBeenCalledTimes(1)
})
