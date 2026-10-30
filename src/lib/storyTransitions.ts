import { storyImage } from './storyLayerScene'
import type { Panel } from '../data/stories/seaFriends'
import './storyTransitions.css'
import './storyPaper.css'
import { STORY_PAGE_TRANSITION_MS } from './storyMotion'

type Kind =
  | 'normal'
  | 'dive'
  | 'approach'
  | 'entrance'
  | 'diamond'
  | 'portal'
  | 'pull'
  | 'emerge'
  | 'doors'
  | 'birthday'
type Transition = {
  from: string
  to: string
  kind: Kind
  duration: number
  focus: [number, number]
}

export const storyTransitions: Transition[] = [
  {
    from: '03-leap',
    to: '04-transformation',
    kind: 'dive',
    duration: 3800,
    focus: [50, 78],
  },
  {
    from: '11-distant-castle',
    to: '12-castle-close',
    kind: 'approach',
    duration: 4000,
    focus: [88, 24],
  },
  {
    from: '12-castle-close',
    to: '13-entering',
    kind: 'entrance',
    duration: 4200,
    focus: [59, 46],
  },
  {
    from: '22-making-diamond-room',
    to: '23-diamond-room',
    kind: 'diamond',
    duration: 4600,
    focus: [80, 32],
  },
  {
    from: '32-magic-mirror',
    to: '33-pink-portal',
    kind: 'portal',
    duration: 3600,
    focus: [80, 48],
  },
  {
    from: '33-pink-portal',
    to: '34-swept-into-portal',
    kind: 'pull',
    duration: 3600,
    focus: [81, 57],
  },
  {
    from: '34-swept-into-portal',
    to: '35-sky-castle-arrival',
    kind: 'emerge',
    duration: 4400,
    focus: [81, 59],
  },
  {
    from: '51-princess-castle-door',
    to: '52-dark-castle-entry',
    kind: 'doors',
    duration: 4600,
    focus: [79, 50],
  },
  {
    from: '53-cloaked-visitor-on-table',
    to: '54-birthday-surprise',
    kind: 'birthday',
    duration: 4800,
    focus: [50, 18],
  },
]

/** Artwork stays intact: animate camera, light, masks and copies of the existing door image. */
export function storyTransitionFor(from: Panel, to: Panel) {
  return storyTransitions.find(
    (entry) => entry.from === from.id && entry.to === to.id
  )
}

/** Layout coordinates retain subpixels and ignore the phone canvas rotation. */
export function storyPageLayoutBounds(element: HTMLElement) {
  const style = getComputedStyle(element)
  const left = parseFloat(style.left) + parseFloat(style.marginLeft)
  const top = parseFloat(style.top) + parseFloat(style.marginTop)
  return new DOMRect(
    Number.isFinite(left) ? left : element.offsetLeft,
    Number.isFinite(top) ? top : element.offsetTop,
    parseFloat(style.width) || element.offsetWidth,
    parseFloat(style.height) || element.offsetHeight
  )
}

export function createStoryTransitions(
  book: HTMLElement,
  frame: HTMLElement,
  options: { localCoordinates?: boolean; previous?: HTMLElement } = {}
) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  let generation = 0
  let stage: HTMLDivElement | undefined
  let animations: Animation[] = []
  let audio: AudioContext | undefined
  const find = (from: Panel, to: Panel): Transition =>
    storyTransitionFor(from, to) ?? {
      from: from.id,
      to: to.id,
      kind: 'normal',
      duration: STORY_PAGE_TRANSITION_MS,
      focus: [50, 50],
    }

  function stop() {
    generation += 1
    animations.forEach((animation) => animation.cancel())
    animations = []
    stage?.remove()
    stage = undefined
    frame.style.visibility = ''
    if (options.previous) options.previous.style.visibility = ''
    frame.classList.remove('story-transition-frame')
    if (audio) void audio.close().catch(() => {})
    audio = undefined
  }

  const canPlay = (from: Panel, to: Panel) =>
    !reducedMotion.matches &&
    from.id !== to.id &&
    !(
      from.effect === 'underwater-meeting' && to.effect === 'underwater-meeting'
    )

  async function play(from: Panel, to: Panel, startBounds: DOMRect) {
    const spec = find(from, to)
    if (!canPlay(from, to)) return
    const run = generation
    const bookBounds = options.localCoordinates
      ? { left: 0, top: 0 }
      : book.getBoundingClientRect()
    const endBounds = options.localCoordinates
      ? storyPageLayoutBounds(frame)
      : frame.getBoundingClientRect()
    const layer = document.createElement('div')
    layer.className = `story-transition story-paper transition-${spec.kind}`
    layer.dataset.transition = spec.kind
    layer.dataset.destination = to.id
    layer.setAttribute('aria-hidden', 'true')
    const box = (bounds: DOMRect) => ({
      left: `${bounds.left - bookBounds.left}px`,
      top: `${bounds.top - bookBounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    })
    Object.assign(layer.style, box(startBounds))
    const source = storyImage(from.image, 'transition-source')
    const target = storyImage(to.image, 'transition-target')
    target.style.opacity = '0'
    const artwork = document.createElement('div')
    artwork.className = 'story-paper-illustration'
    artwork.append(source, target)
    layer.append(artwork)
    book.append(layer)
    stage = layer
    frame.classList.add('story-transition-frame')
    frame.style.visibility = 'hidden'
    // Only the doors have a quiet creak. Audio availability never gates navigation.
    if (spec.kind === 'doors') {
      try {
        audio = new AudioContext()
        void audio.resume().catch(() => {})
      } catch {
        /* Silent is fine. */
      }
    }
    try {
      await Promise.all([source.decode(), target.decode()])
    } catch {
      if (run === generation) stop()
      return
    }
    if (run !== generation) return
    if (options.previous) options.previous.style.visibility = 'hidden'
    const duration = spec.duration
    const animate = (
      element: Element,
      keys: Keyframe[],
      options: KeyframeAnimationOptions = {}
    ) => {
      const animation = element.animate(keys, {
        duration,
        fill: 'both',
        ...options,
      })
      animations.push(animation)
      return animation
    }
    if (spec.kind === 'normal') {
      target.remove()
      animateNormalStoryPage(
        layer,
        source,
        artwork,
        frame,
        startBounds,
        endBounds,
        box,
        animate
      )
    } else {
      // Contain the final image exactly; source cropping is confined to deliberate camera moves.
      animate(
        layer,
        [
          { ...box(startBounds), offset: 0 },
          { ...box(startBounds), offset: 0.12 },
          { ...box(endBounds), offset: 0.76 },
          { ...box(endBounds), offset: 1 },
        ],
        { easing: 'ease-in-out' }
      )
      animateStoryEffect(spec, source, target, artwork, animate, audio)
    }
    layer.dataset.ready = 'true'
    try {
      await Promise.all(animations.map((animation) => animation.finished))
      if (run === generation) stop()
    } catch {
      /* Navigation cancels every layer together. */
    }
  }

  const onMotionChange = () => {
    if (reducedMotion.matches) stop()
  }
  const onVisibilityChange = () =>
    animations.forEach((animation) => {
      if (animation.playState === 'finished') return
      if (document.hidden) animation.pause()
      else animation.play()
    })
  reducedMotion.addEventListener('change', onMotionChange)
  window.addEventListener('resize', stop)
  document.addEventListener('visibilitychange', onVisibilityChange)
  return {
    canPlay,
    play,
    stop,
    dispose() {
      stop()
      reducedMotion.removeEventListener('change', onMotionChange)
      window.removeEventListener('resize', stop)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    },
  }
}

type Animate = (
  element: Element,
  keys: Keyframe[],
  options?: KeyframeAnimationOptions
) => Animation

/** Effect recipes own their artwork; the player above owns loading and cancellation. */
function animateStoryEffect(
  spec: Transition,
  source: HTMLImageElement,
  target: HTMLImageElement,
  artwork: HTMLElement,
  animate: Animate,
  audio: AudioContext | undefined
) {
  const effect = (className: string) => {
    const node = document.createElement('div')
    node.className = className
    artwork.append(node)
    return node
  }
  const [x, y] = spec.focus
  const zoom = (scale: number) => {
    const limit = (scale - 1) * 50
    const offset = (focus: number) =>
      Math.max(-limit, Math.min(limit, scale * (50 - focus)))
    return `translate(${offset(x)}%, ${offset(y)}%) scale(${scale})`
  }
  const fadeSource = (start = 0.34, end = 0.68) =>
    animate(source, [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: start },
      { opacity: 0, offset: end },
      { opacity: 0, offset: 1 },
    ])
  const reveal = (start: string, end: string, at = 0.3, done = 0.75) => {
    target.style.opacity = '1'
    animate(
      target,
      [
        { clipPath: start, offset: 0 },
        { clipPath: start, offset: at },
        { clipPath: end, offset: done },
        { clipPath: end, offset: 1 },
      ],
      { easing: 'ease-in-out' }
    )
  }
  const glow = (className: string, peak = 0.5) => {
    const node = effect(className)
    node.style.setProperty('--focus-x', `${x}%`)
    node.style.setProperty('--focus-y', `${y}%`)
    animate(node, [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: 0.16 },
      { opacity: 0.9, offset: peak },
      { opacity: 0, offset: 0.85 },
      { opacity: 0, offset: 1 },
    ])
    return node
  }

  function dive() {
    animate(source, [
      { transform: 'none' },
      { transform: 'translateY(-18%) scale(1.18)' },
    ])
    reveal(
      'ellipse(80% 0% at 50% 100%)',
      'ellipse(180% 200% at 50% 100%)',
      0.18,
      0.55
    )
    animate(target, [
      { transform: 'translateY(10%) scale(1.1)', offset: 0 },
      { transform: 'none', offset: 1 },
    ])
    fadeSource(0.28, 0.46)
    const water = effect('transition-water')
    animate(water, [
      { transform: 'translateY(110%)', opacity: 0, offset: 0 },
      { transform: 'translateY(40%)', opacity: 1, offset: 0.26 },
      { transform: 'translateY(-30%)', opacity: 1, offset: 0.46 },
      { transform: 'translateY(-120%)', opacity: 0, offset: 0.82 },
      { opacity: 0, offset: 1 },
    ])
    for (let i = 0; i < 30; i += 1) {
      const bubble = effect('transition-bubble')
      bubble.style.left = `${((i * 37) % 103) - 3}%`
      bubble.style.width = `${2 + (i % 6) * 1.8}%`
      animate(
        bubble,
        [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { opacity: 0.85, offset: 0.18 },
          { opacity: 0.7, offset: 0.65 },
          {
            transform: `translate(${((i % 3) - 1) * 90}px, -1100px) scale(1.3)`,
            opacity: 0,
          },
        ],
        { duration: 2200, delay: 500 + (i % 9) * 105, easing: 'ease-out' }
      )
    }
  }
  function approach() {
    animate(
      source,
      [
        { transform: 'none', offset: 0 },
        {
          transform: zoom(spec.kind === 'approach' ? 3.5 : 5.5),
          offset: 0.45,
        },
        { transform: zoom(6), offset: 1 },
      ],
      { easing: 'ease-in-out' }
    )
    reveal(
      `circle(0% at ${x}% ${y}%)`,
      `circle(150% at ${x}% ${y}%)`,
      0.3,
      0.82
    )
    animate(target, [{ transform: 'scale(1.22)' }, { transform: 'none' }])
    fadeSource(0.4, 0.8)
    glow('transition-pearl-light')
  }
  function diamond() {
    animate(
      source,
      [
        { transform: 'none', offset: 0 },
        { transform: zoom(6), offset: 0.65 },
        { transform: zoom(7), offset: 1 },
      ],
      { easing: 'ease-in-out' }
    )
    reveal(
      'polygon(80% 26%, 85% 32%, 80% 40%, 75% 32%)',
      'polygon(50% -100%, 200% 50%, 50% 200%, -100% 50%)',
      0.15,
      0.78
    )
    animate(target, [
      { transform: 'scale(1.65)', filter: 'brightness(1.25)', offset: 0 },
      { transform: 'none', filter: 'none', offset: 1 },
    ])
    fadeSource(0.45, 0.78)
    const facets = glow('transition-diamond-facets', 0.48)
    animate(facets, [
      { clipPath: 'polygon(80% 26%, 85% 32%, 80% 40%, 75% 32%)' },
      { clipPath: 'polygon(50% -100%, 200% 50%, 50% 200%, -100% 50%)' },
    ])
  }
  function portal() {
    const entering = spec.kind === 'emerge'
    animate(
      source,
      [
        { transform: 'none', offset: 0 },
        { transform: entering ? zoom(4.8) : 'none', offset: 0.8 },
        { transform: entering ? zoom(5) : 'none', offset: 1 },
      ],
      { easing: 'ease-in-out' }
    )
    reveal(
      `ellipse(0% 0% at ${x}% ${y}%)`,
      `ellipse(140% 160% at ${x}% ${y}%)`,
      0.27,
      0.83
    )
    fadeSource(0.4, 0.8)
    const vortex = effect('transition-vortex')
    vortex.style.left = `${x}%`
    vortex.style.top = `${y}%`
    animate(
      vortex,
      [
        {
          transform: 'translate(-50%, -50%) scale(.05) rotate(0deg)',
          opacity: 0,
          offset: 0,
        },
        {
          transform: 'translate(-50%, -50%) scale(.8) rotate(75deg)',
          opacity: 0.8,
          offset: 0.3,
        },
        {
          transform: 'translate(-50%, -50%) scale(3.6) rotate(230deg)',
          opacity: 0.95,
          offset: 0.6,
        },
        {
          transform: 'translate(-50%, -50%) scale(6) rotate(330deg)',
          opacity: 0,
          offset: 0.88,
        },
        { opacity: 0, offset: 1 },
      ],
      { easing: 'ease-in-out' }
    )
    glow(entering ? 'transition-cloud-light' : 'transition-pink-light', 0.58)
    if (entering)
      animate(target, [
        { transform: 'scale(1.25)', filter: 'blur(3px)', offset: 0 },
        { transform: 'none', filter: 'none', offset: 1 },
      ])
  }
  function doors() {
    const fullZoom = zoom(3.8)
    animate(
      source,
      [
        { transform: 'none', offset: 0 },
        { transform: fullZoom, offset: 0.32 },
        { transform: fullZoom, offset: 1 },
      ],
      { easing: 'ease-in-out' }
    )
    fadeSource(0.33, 0.34)
    reveal('inset(0 50% 0 50%)', 'inset(0 0% 0 0%)', 0.34, 0.86)
    animate(target, [
      { filter: 'brightness(.5)', transform: 'scale(1.12)' },
      { filter: 'none', transform: 'none' },
    ])
    for (const side of ['left', 'right']) {
      const door = effect(`transition-door transition-door-${side}`)
      const image = storyImage(source.src, 'transition-door-art')
      image.style.transform = fullZoom
      door.append(image)
      animate(
        door,
        [
          {
            opacity: 0,
            transform: 'perspective(1200px) rotateY(0deg)',
            offset: 0,
          },
          {
            opacity: 0,
            transform: 'perspective(1200px) rotateY(0deg)',
            offset: 0.32,
          },
          {
            opacity: 1,
            transform: 'perspective(1200px) rotateY(0deg)',
            offset: 0.33,
          },
          {
            opacity: 1,
            transform: `perspective(1200px) rotateY(${side === 'left' ? 88 : -88}deg)`,
            offset: 0.8,
          },
          {
            opacity: 0,
            transform: `perspective(1200px) rotateY(${side === 'left' ? 90 : -90}deg)`,
            offset: 0.9,
          },
          { opacity: 0, offset: 1 },
        ],
        { easing: 'ease-in-out' }
      )
    }
    if (audio) {
      const start = audio.currentTime + (spec.duration * 0.34) / 1000
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(135, start)
      oscillator.frequency.exponentialRampToValueAtTime(65, start + 1.3)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.025, start + 0.15)
      gain.gain.linearRampToValueAtTime(0, start + 1.4)
      oscillator.connect(gain).connect(audio.destination)
      oscillator.start(start)
      oscillator.stop(start + 1.45)
    }
  }
  function birthday() {
    reveal('circle(0% at 50% 18%)', 'circle(140% at 50% 18%)', 0.2, 0.72)
    animate(target, [
      { filter: 'brightness(.3)', offset: 0 },
      { filter: 'brightness(.6)', offset: 0.3 },
      { filter: 'none', offset: 0.72 },
      { filter: 'none', offset: 1 },
    ])
    fadeSource(0.4, 0.72)
    glow('transition-party-light', 0.53)
    const colors = ['#fbb1dc', '#91e7ef', '#ffdb6e', '#bba6ef']
    for (let i = 0; i < 34; i += 1) {
      const confetti = effect('transition-confetti')
      confetti.style.left = `${(i * 29) % 100}%`
      confetti.style.background = colors[i % colors.length]!
      animate(
        confetti,
        [
          { transform: 'translateY(0) rotate(0deg)', opacity: 0 },
          { opacity: 0.9, offset: 0.12 },
          { opacity: 0.85, offset: 0.7 },
          {
            transform: `translate(${((i % 5) - 2) * 30}px, 1000px) rotate(${180 + i * 31}deg)`,
            opacity: 0,
          },
        ],
        { duration: 2100, delay: 1700 + (i % 7) * 120, easing: 'ease-in' }
      )
    }
  }
  const effects: Partial<Record<Kind, () => void>> = {
    dive,
    approach,
    entrance: approach,
    diamond,
    portal,
    pull: portal,
    emerge: portal,
    doors,
    birthday,
  }
  effects[spec.kind]?.()
}

/** Cover the destination with the old illustration before revealing any of it. */
function animateNormalStoryPage(
  layer: HTMLElement,
  source: HTMLImageElement,
  illustration: HTMLElement,
  frame: HTMLElement,
  start: DOMRect,
  end: DOMRect,
  box: (bounds: DOMRect) => Record<string, string>,
  animate: Animate
) {
  const inset = parseFloat(getComputedStyle(illustration).left)
  const width = Math.max(1, start.width - 2 * inset)
  const height = Math.max(1, start.height - 2 * inset)
  const scale = Math.max(
    1,
    (end.width - 2 * inset) / width,
    (end.height - 2 * inset) / height
  )
  const coverAt = 0.6
  const expansion = 'cubic-bezier(0.22, 0.68, 0.2, 1)'
  Object.assign(source.style, {
    inset: 'auto',
    left: '50%',
    top: '50%',
    width: `${width}px`,
    height: `${height}px`,
  })
  animate(layer, [
    { ...box(start), opacity: 1, offset: 0, easing: expansion },
    { ...box(end), opacity: 1, offset: coverAt },
    { ...box(end), opacity: 0, offset: 1 },
  ])
  const transform = (value: number) => `translate(-50%, -50%) scale(${value})`
  animate(source, [
    { transform: transform(1), offset: 0, easing: expansion },
    { transform: transform(scale), offset: coverAt },
    { transform: transform(scale), offset: 1 },
  ])
  // The live destination includes its own paper and any layered scene animation.
  // A step keeps it hidden for the entire expansion, including between frames.
  animate(frame, [
    { visibility: 'hidden', offset: 0, easing: 'steps(1, end)' },
    { visibility: 'visible', offset: coverAt },
    { visibility: 'visible', offset: 1 },
  ])
}
