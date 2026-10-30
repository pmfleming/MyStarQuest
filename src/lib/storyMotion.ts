import { uiTokens } from '../tokens'

export const STORY_PAGE_TRANSITION_MS = 1000
export const STORY_OPEN_TRANSITION_MS = 1200

const viewportSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

export type StoryOpeningFrame = {
  x: number
  y: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  radius: number
  source?: HTMLElement | null
}

export type StorySurfaceBounds = {
  left: number
  top: number
  width: number
  height: number
  radius: number
  opacity?: number
  snapshotOpacity?: number
  shadow?: string
}
export type StorySurfaceTransition = {
  finished: Promise<void>
  cancel: () => void
}

export function captureStoryOpeningFrame(
  element: HTMLElement | null
): StoryOpeningFrame {
  const device = element?.closest<HTMLElement>('[data-app-device-frame]')
  const bounds = device?.getBoundingClientRect()
  const { width: viewportWidth, height: viewportHeight } = viewportSize()
  const width =
    bounds?.width || Math.min(uiTokens.deviceMaxWidth, viewportWidth - 32)
  const height =
    bounds?.height || Math.min(uiTokens.deviceMinHeight, viewportHeight - 32)
  return {
    x: bounds?.x ?? (viewportWidth - width) / 2,
    y: bounds?.y ?? (viewportHeight - height) / 2,
    width,
    height,
    viewportWidth,
    viewportHeight,
    radius: device
      ? Math.max(24, parseFloat(getComputedStyle(device).borderRadius) || 40)
      : 40,
    source: device ?? element?.closest<HTMLElement>('main') ?? null,
  }
}

function phoneBounds(
  frame: StoryOpeningFrame,
  width: number,
  height: number
): StorySurfaceBounds {
  // Fullscreen or a phone's landscape lock may have resized the viewport since capture.
  const scale = Math.min(
    1,
    (width - 24) / frame.width,
    (height - 24) / frame.height
  )
  const initialWidth = frame.width * scale
  const initialHeight = frame.height * scale
  const centerX = ((frame.x + frame.width / 2) / frame.viewportWidth) * width
  const centerY = ((frame.y + frame.height / 2) / frame.viewportHeight) * height
  const left = Math.max(
    0,
    Math.min(width - initialWidth, centerX - initialWidth / 2)
  )
  const top = Math.max(
    0,
    Math.min(height - initialHeight, centerY - initialHeight / 2)
  )
  return {
    left,
    top,
    width: initialWidth,
    height: initialHeight,
    radius: frame.radius * scale,
  }
}

export function currentStorySurface(
  dialog: HTMLDialogElement
): StorySurfaceBounds {
  const bounds = dialog.getBoundingClientRect()
  const stage = dialog.querySelector<HTMLElement>('.story-stage')
  const snapshot = dialog.querySelector<HTMLElement>('.story-phone-snapshot')
  return {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    radius: parseFloat(getComputedStyle(dialog).borderRadius) || 0,
    opacity: stage ? Number(getComputedStyle(stage).opacity) : 1,
    snapshotOpacity: snapshot ? Number(getComputedStyle(snapshot).opacity) : 0,
    shadow: getComputedStyle(dialog).boxShadow,
  }
}

function phoneSnapshot(dialog: HTMLDialogElement, frame: StoryOpeningFrame) {
  if (!frame.source?.isConnected) return null
  const original = frame.source
  const copy = original.cloneNode(true)
  if (!(copy instanceof HTMLElement)) return null
  copy.removeAttribute('data-app-device-frame')
  for (const element of [copy, ...copy.querySelectorAll<HTMLElement>('[id]')])
    element.removeAttribute('id')
  Object.assign(copy.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    maxWidth: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    margin: '0',
  })
  const host = document.createElement('div')
  host.className = 'story-phone-snapshot'
  host.setAttribute('aria-hidden', 'true')
  host.inert = true
  host.style.background = getComputedStyle(original).backgroundColor
  host.append(copy)
  dialog.append(host)
  const scrollers = original.querySelectorAll<HTMLElement>('.app-scroll-region')
  copy
    .querySelectorAll<HTMLElement>('.app-scroll-region')
    .forEach((element, index) => {
      element.scrollTop = scrollers[index]?.scrollTop ?? 0
      element.scrollLeft = scrollers[index]?.scrollLeft ?? 0
    })
  return { host, copy }
}

const fadeKeyframes = (
  from: number,
  to: number,
  offset: number
): Keyframe[] => [{ opacity: from }, { opacity: to, offset }, { opacity: to }]

export function animateStorySurface(
  dialog: HTMLDialogElement,
  frame: StoryOpeningFrame,
  direction: 'open' | 'close',
  current?: StorySurfaceBounds
): StorySurfaceTransition | null {
  if (
    !dialog.animate ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return null
  const book = {
    left: 0,
    top: 0,
    ...viewportSize(),
    radius: 0,
  }
  const phone = phoneBounds(frame, book.width, book.height)
  const opening = direction === 'open'
  const start = opening ? phone : (current ?? book)
  const end = opening ? book : phone
  const options: KeyframeAnimationOptions = {
    duration: STORY_OPEN_TRANSITION_MS,
    easing: 'cubic-bezier(0.22, 0.68, 0.2, 1)',
    fill: 'both',
  }
  const bezel = '0 0 0 12px #1a1a2e, 0 0 0 14px #333'
  const noBezel = '0 0 0 0px #1a1a2e00, 0 0 0 0px #3330'
  const geometry = (bounds: StorySurfaceBounds, shadow: string): Keyframe => ({
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    borderRadius: `${bounds.radius}px`,
    boxShadow: shadow,
  })
  const surface = dialog.animate(
    [
      geometry(
        start,
        opening
          ? bezel
          : (current?.shadow ?? getComputedStyle(dialog).boxShadow)
      ),
      geometry(end, opening ? noBezel : bezel),
    ],
    options
  )
  surface.id = `story-book-${direction}`
  const animations = [surface]
  const stage = dialog.querySelector<HTMLElement>('.story-stage')
  if (stage)
    animations.push(
      stage.animate(
        opening
          ? fadeKeyframes(0, 1, 0.8)
          : fadeKeyframes(current?.opacity ?? 1, 0, 0.85),
        options
      )
    )
  const snapshot = phoneSnapshot(dialog, frame)
  if (snapshot) {
    animations.push(
      snapshot.host.animate(
        opening
          ? fadeKeyframes(1, 0, 0.7)
          : fadeKeyframes(current?.snapshotOpacity ?? 0, 1, 0.8),
        options
      )
    )
    const scale = (bounds: StorySurfaceBounds) =>
      Math.min(bounds.width / frame.width, bounds.height / frame.height)
    animations.push(
      snapshot.copy.animate(
        [
          { transform: `translate(-50%, -50%) scale(${scale(start)})` },
          { transform: `translate(-50%, -50%) scale(${scale(end)})` },
        ],
        options
      )
    )
  }
  return {
    finished: Promise.all(
      animations.map((animation) => animation.finished)
    ).then(() => {}),
    cancel: () => {
      for (const animation of animations) animation.cancel()
      snapshot?.host.remove()
    },
  }
}
