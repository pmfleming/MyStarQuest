import { storyImage } from './storyLayerScene'
import sizes from '../assets/comic/layers/air/sizes.json'
import './storyAirScenes.css'

const assets = import.meta.glob<string>('../assets/comic/layers/air/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
const asset = (name: string) =>
  assets[`../assets/comic/layers/air/${name}.webp`]!
const dimensions = sizes as Record<string, { width: number; height: number }>
export const airSceneIds = [
  '37-playground-surprise',
  '38-rainbow-slide',
  '39-shell-swings',
  '40-rainbow-stepping-stones',
  '41-cloud-roundabout',
  '42-cloud-trampolines',
  '43-climbing-bridge',
]

type Pose = {
  x: number
  y: number
  scale?: number
  angle?: number
  opacity?: number
  offset?: number
  z?: number
}
type Motion = {
  element: HTMLElement
  frames: Keyframe[]
  duration: number
  phase: number
  once: boolean
}

/** Animate independent original cutouts over clean scenery, never the flattened picture. */
export function createAirScenes(host: HTMLElement) {
  const stage = document.createElement('div')
  stage.className = 'air-scene'
  stage.setAttribute('aria-hidden', 'true')
  host.append(stage)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let generation = 0
  let width = 1448,
    height = 1086
  let motions: Motion[] = []
  let animations: Animation[] = []

  function image(name: string, className: string) {
    return storyImage(asset(name), className)
  }

  function pose(p: Pose): Keyframe {
    return {
      left: `${(p.x / width) * 100}%`,
      top: `${(p.y / height) * 100}%`,
      transform: `translate(-50%, -100%) rotate(${p.angle ?? 0}deg) scale(${p.scale ?? 1})`,
      opacity: p.opacity ?? 1,
      ...(p.offset === undefined ? {} : { offset: p.offset }),
      ...(p.z === undefined ? {} : { zIndex: p.z }),
    }
  }
  function move(
    element: HTMLElement,
    frames: Keyframe[],
    duration: number,
    phase = 0,
    once = false
  ) {
    motions.push({ element, frames, duration, phase, once })
  }
  function actor(
    name: string,
    h: number,
    rest: Pose,
    parent: HTMLElement = stage
  ) {
    const box = document.createElement('div')
    box.className = 'air-actor'
    box.dataset.actor = name
    const size = dimensions[name]!
    box.style.width = `${((h * size.width) / size.height / width) * 100}%`
    box.style.aspectRatio = String(size.width / size.height)
    Object.assign(box.style, pose(rest))
    box.append(image(name, 'air-cutout'))
    parent.append(box)
    return box
  }
  function shadow(x: number, y: number, w: number) {
    const node = document.createElement('span')
    node.className = 'air-shadow'
    node.style.left = `${(x / width) * 100}%`
    node.style.top = `${(y / height) * 100}%`
    node.style.width = `${(w / width) * 100}%`
    stage.append(node)
    return node
  }
  function float(name: string, x: number, y: number, h: number, phase = 0) {
    const node = actor(name, h, { x, y })
    move(
      node,
      [
        pose({ x, y, angle: -3 }),
        pose({ x: x + 12, y: y - 26, angle: 3 }),
        pose({ x, y, angle: -3 }),
      ],
      4400,
      phase
    )
  }
  function playground() {
    const guests = [
      ['aurora', 330, 874, 315],
      ['green', 650, 830, 225],
      ['turtle', 910, 825, 200],
      ['hammer', 1160, 834, 235],
      ['dragon', 1430, 825, 265],
    ] as const
    for (const [name, x, y, h] of guests) {
      shadow(x, y, h * 0.65)
      const node = actor(name, h, { x, y })
      const start = x < 800 ? -h : width + h
      move(
        node,
        [
          pose({ x: start, y: y - 65, scale: 0.7, opacity: 0 }),
          pose({
            x: start + (x - start) * 0.4,
            y: y - 30,
            scale: 0.85,
            opacity: 1,
            offset: 0.25,
          }),
          pose({ x, y, offset: 0.85 }),
          pose({ x, y }),
        ],
        4600 + h * 2,
        0,
        true
      )
    }
  }
  function slide() {
    const track: Pose[] = [
      { x: 280, y: 368, scale: 0.78, angle: 8, opacity: 0, offset: 0 },
      { x: 320, y: 390, scale: 0.8, angle: 12, offset: 0.07 },
      { x: 490, y: 490, scale: 0.88, angle: 18, offset: 0.28 },
      { x: 705, y: 610, scale: 0.95, angle: 12, offset: 0.48 },
      { x: 940, y: 678, scale: 1, angle: 7, offset: 0.66 },
      { x: 1150, y: 786, scale: 1.07, angle: 15, offset: 0.8 },
      { x: 1400, y: 880, scale: 1.1, angle: 4, offset: 0.95 },
      { x: 1580, y: 896, scale: 1.1, angle: 0, opacity: 0, offset: 1 },
    ]
    for (const [name, h, phase, rest] of [
      ['aurora', 265, 0.18, { x: 490, y: 490, angle: 14 }],
      ['odette', 290, 0.62, { x: 990, y: 710, angle: 10 }],
    ] as const) {
      const node = actor(name, h, rest)
      move(node, track.map(pose), 9200, phase)
    }
    float('coral', 1120, 355, 150)
  }
  function swings() {
    const ns = 'http://www.w3.org/2000/svg'
    for (const [name, x, seat, phase] of [
      ['eclipse', 579, 'seat-left', 0],
      ['diana', 879, 'seat-right', 0.5],
    ] as const) {
      const group = document.createElement('div')
      group.className = 'air-swing'
      group.dataset.swing = name
      group.style.transformOrigin = `${(x / width) * 100}% ${(320 / height) * 100}%`
      stage.append(group)
      const chains = document.createElementNS(ns, 'svg')
      chains.setAttribute('viewBox', `0 0 ${width} ${height}`)
      chains.classList.add('air-chains')
      for (const side of [-1, 1])
        for (const [stroke, strokeWidth, dash] of [
          ['#8b4c18', '9', ''],
          ['#ffe49a', '5', '5 5'],
        ]) {
          const line = document.createElementNS(ns, 'line')
          line.setAttribute('x1', String(x + side * 34))
          line.setAttribute('y1', '320')
          line.setAttribute('x2', String(x + side * 100))
          line.setAttribute('y2', '682')
          line.setAttribute('stroke', stroke!)
          line.setAttribute('stroke-width', strokeWidth!)
          if (dash) line.setAttribute('stroke-dasharray', dash)
          chains.append(line)
        }
      group.append(chains)
      actor(seat, 190, { x, y: 780 }, group)
      actor(name, 340, { x, y: 741 }, group)
      move(
        group,
        [
          {
            transform:
              'perspective(1100px) rotateX(-13deg) rotateZ(-2deg) scale(.96)',
          },
          {
            transform:
              'perspective(1100px) rotateX(13deg) rotateZ(2deg) scale(1.035)',
          },
          {
            transform:
              'perspective(1100px) rotateX(-13deg) rotateZ(-2deg) scale(.96)',
          },
        ],
        4400,
        phase
      )
    }
    float('crystal', 1140, 410, 155, 0.3)
  }
  function stones() {
    const landings = [
      [-140, 950, 1.15],
      [270, 875, 1.1],
      [640, 755, 1],
      [900, 698, 0.85],
      [1090, 637, 0.72],
      [1240, 587, 0.61],
      [1380, 547, 0.51],
      [1570, 493, 0.42],
    ]
    for (const [name, h, phase] of [
      ['green', 300, 0.16],
      ['turtle', 265, 0.47],
    ] as const) {
      const points: Pose[] = []
      landings.forEach(([x, y, scale], i) => {
        points.push({
          x: x!,
          y: y!,
          scale,
          opacity: i === 0 || i === landings.length - 1 ? 0 : 1,
          offset: i / (landings.length - 1),
        })
        const next = landings[i + 1]
        if (next)
          points.push({
            x: (x! + next[0]!) / 2,
            y: (y! + next[1]!) / 2 - 95,
            scale: (scale! + next[2]!) / 2,
            angle: -5,
            offset: (i + 0.5) / (landings.length - 1),
          })
      })
      const rest =
        name === 'green' ? { x: 640, y: 755 } : { x: 1090, y: 637, scale: 0.72 }
      const node = actor(name, h, rest)
      move(node, points.map(pose), 12500, phase)
      const s = shadow(rest.x, rest.y, h * 0.55)
      move(
        s,
        points.map((p) => ({
          left: `${(p.x / width) * 100}%`,
          top: `${((p.y + (p.angle ? 95 : 0)) / height) * 100}%`,
          opacity: p.angle ? 0.1 : 0.24,
          transform: `translate(-50%,-50%) scale(${(p.scale ?? 1) * (p.angle ? 0.7 : 1)})`,
          offset: p.offset,
        })),
        12500,
        phase
      )
    }
  }
  function roundabout() {
    for (const [name, h, phase] of [
      ['hammer', 260, 0],
      ['dragon', 315, 0.5],
    ] as const) {
      const points: Pose[] = Array.from({ length: 33 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2
        return {
          x: 724 + 350 * Math.cos(angle),
          y: 650 + 96 * Math.sin(angle),
          scale: 0.84 + 0.15 * Math.sin(angle),
          angle: 3 * Math.cos(angle),
          z: Math.sin(angle) < 0 ? 1 : 3,
          offset: i / 32,
        }
      })
      const node = actor(name, h, { x: name === 'hammer' ? 430 : 1020, y: 715 })
      move(node, points.map(pose), 14000, phase)
      const s = shadow(724, 650, 145)
      move(
        s,
        points.map((p) => ({
          left: `${(p.x / width) * 100}%`,
          top: `${(p.y / height) * 100}%`,
          transform: `translate(-50%,-50%) scale(${p.scale})`,
          offset: p.offset,
        })),
        14000,
        phase
      )
    }
    // The original centre pillar remains in front of riders on the far side.
    const pillar = image('41-cloud-roundabout', 'air-pillar')
    stage.append(pillar)
  }
  function trampolines() {
    for (const [name, x, phase] of [
      ['yellow', 365, 0],
      ['curl', 1090, 0.5],
    ] as const) {
      const node = actor(name, 250, { x, y: 505 })
      move(
        node,
        [
          pose({ x, y: 679, angle: -3 }),
          pose({ x: x + 10, y: 425, angle: 7 }),
          pose({ x, y: 679, angle: -3 }),
        ],
        2800,
        phase
      )
      const s = shadow(x, 680, 145)
      move(
        s,
        [
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.32 },
          { transform: 'translate(-50%,-50%) scale(.55)', opacity: 0.1 },
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.32 },
        ],
        2800,
        phase
      )
    }
  }
  function bridge() {
    for (const [name, phase] of [
      ['lilac', 0.1],
      ['mint', 0.43],
      ['heart', 0.76],
    ] as const) {
      const points: Pose[] = Array.from({ length: 21 }, (_, i) => {
        const t = i / 20
        return {
          x: 210 + 1070 * t,
          y: 560 + 62 * Math.sin(t * Math.PI) - 9 * Math.sin(t * Math.PI * 12),
          scale: 0.92 + 0.08 * Math.sin(t * Math.PI),
          angle: 3 * Math.sin(t * Math.PI * 8),
          opacity: i === 0 || i === 20 ? 0 : 1,
          offset: t,
        }
      })
      const node = actor(name, 185, { x: 350 + phase * 850, y: 610 })
      move(node, points.map(pose), 15000, phase)
    }
    stage.append(image('bridge-foreground', 'air-foreground'))
  }
  function startMotion() {
    animations.forEach((animation) => animation.cancel())
    animations = []
    if (reduced.matches || !stage.classList.contains('ready')) return
    for (const motion of motions) {
      const animation = motion.element.animate(motion.frames, {
        duration: motion.duration,
        iterations: motion.once ? 1 : Infinity,
        easing: motion.frames.length === 3 ? 'ease-in-out' : 'linear',
        fill: 'both',
      })
      animation.currentTime = motion.phase * motion.duration
      if (document.hidden) animation.pause()
      animations.push(animation)
    }
  }
  function stop() {
    generation++
    animations.forEach((animation) => animation.cancel())
    animations = []
    motions = []
    stage.replaceChildren()
    stage.classList.remove('ready')
    delete stage.dataset.panelId
  }
  async function show(id: string) {
    stop()
    if (!airSceneIds.includes(id)) return
    const run = generation
    const size = dimensions[id]!
    width = size.width
    height = size.height
    stage.dataset.panelId = id
    stage.append(image(id, 'air-background'))
    const builders = [
      playground,
      slide,
      swings,
      stones,
      roundabout,
      trampolines,
      bridge,
    ]
    builders[airSceneIds.indexOf(id)]!()
    try {
      await Promise.all(
        [...stage.querySelectorAll('img')].map((image) => image.decode())
      )
    } catch {
      if (run === generation) stop()
      return
    }
    if (run !== generation) return
    stage.classList.add('ready')
    startMotion()
  }
  const visibility = () =>
    animations.forEach((animation) => {
      if (animation.playState === 'finished') return
      if (document.hidden) animation.pause()
      else animation.play()
    })
  reduced.addEventListener('change', startMotion)
  document.addEventListener('visibilitychange', visibility)
  return {
    show,
    stop,
    dispose() {
      stop()
      stage.remove()
      reduced.removeEventListener('change', startMotion)
      document.removeEventListener('visibilitychange', visibility)
    },
  }
}
