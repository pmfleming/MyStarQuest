import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  createStoryLayerScene,
  storyImage,
} from '../../src/lib/storyLayerScene'

const disposers: (() => void)[] = []
const decode = vi.fn<() => Promise<void>>()
const originalDecode = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'decode'
)
beforeEach(() => {
  decode.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: decode,
  })
})
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
  vi.restoreAllMocks()
  if (originalDecode)
    Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode)
  else Reflect.deleteProperty(HTMLImageElement.prototype, 'decode')
})

function setup(entrance?: string, surface?: HTMLElement) {
  const host = document.createElement('div')
  if (surface) {
    surface.append(host)
    document.body.append(surface)
  } else document.body.append(host)
  const scene = createStoryLayerScene(host, {
    className: 'test-scene',
    panelIds: ['first', 'second'],
    entrance,
    build(stage, id) {
      stage.append(storyImage(`/${id}.webp`, 'actor'))
    },
  })
  disposers.push(scene.dispose)
  return { host, scene, stage: host.firstElementChild! }
}

it('ignores stale successful and failed decodes after navigating to another scene', async () => {
  let resolveFirst!: () => void
  let rejectSecond!: (error: Error) => void
  decode
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve
        })
    )
    .mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          rejectSecond = reject
        })
    )
    .mockResolvedValue(undefined)
  const { scene, stage } = setup()
  const first = scene.show('first')
  const second = scene.show('second')
  await scene.show('first')
  resolveFirst()
  rejectSecond(new Error('Old request failed'))
  await Promise.all([first, second])
  expect(stage).toHaveClass('ready')
  expect(stage).toHaveAttribute('data-panel-id', 'first')
  expect(stage.querySelectorAll('img')).toHaveLength(1)
})

it('falls back to static artwork on decode failure and can recover', async () => {
  decode
    .mockRejectedValueOnce(new Error('Missing layer'))
    .mockResolvedValue(undefined)
  const { scene, stage } = setup()
  await scene.show('first')
  expect(stage).not.toHaveClass('ready')
  expect(stage.children).toHaveLength(0)
  await scene.show('second')
  expect(stage).toHaveClass('ready')
  await scene.show('unrelated')
  expect(stage.children).toHaveLength(0)
})

it('waits for the page turn, follows visibility, and cancels pending entrances on disposal', async () => {
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  const { host, scene, stage } = setup('flying')
  host.classList.add('story-transition-frame')
  await scene.show('first')
  expect(stage).toHaveClass('ready', 'paused')
  expect(stage).not.toHaveClass('flying')
  host.classList.remove('story-transition-frame')
  await Promise.resolve()
  expect(stage).toHaveClass('flying')
  hidden.mockReturnValue(false)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(stage).not.toHaveClass('paused')
  host.classList.add('story-transition-frame')
  await scene.show('second')
  scene.dispose()
  host.classList.remove('story-transition-frame')
  await Promise.resolve()
  expect(stage).not.toHaveClass('ready', 'flying')
  expect(host.children).toHaveLength(0)
  await scene.show('first')
  expect(stage.children).toHaveLength(0)
})

it('also waits for a page turn on the app paper surrounding a nested effect host', async () => {
  const surface = document.createElement('div')
  surface.className = 'story-page-sheet story-transition-frame'
  const { scene, stage } = setup('flying', surface)
  await scene.show('first')
  expect(stage).not.toHaveClass('flying')
  surface.classList.remove('story-transition-frame')
  await Promise.resolve()
  expect(stage).toHaveClass('flying')
})
