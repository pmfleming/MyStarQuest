import backdropUrl from '../assets/comic/references/birthday/58-odette-polaroid-base.webp'
import photoUrl from '../assets/comic/opening/57-birthday-group-photo-v2.webp'
import layout from '../assets/comic/references/birthday/polaroid-layout.json'
import './storyPhotoMoment.css'

/** A single camera exposure, then the unchanged photo settles into Odette's hands. */
export function createPhotoMoment(picture: HTMLElement) {
  picture.classList.add('photo-moment-panel')
  const stage = document.createElement('div')
  stage.className = 'photo-moment'
  stage.setAttribute('aria-hidden', 'true')
  const backdrop = document.createElement('img')
  backdrop.src = backdropUrl
  backdrop.alt = ''
  backdrop.draggable = false
  backdrop.className = 'photo-moment-backdrop'
  const print = document.createElement('div')
  print.className = 'instant-print'
  const paper = document.createElement('div')
  paper.className = 'instant-paper'
  const photo = document.createElement('img')
  photo.src = photoUrl
  photo.alt = ''
  photo.draggable = false
  const flash = document.createElement('div')
  flash.className = 'camera-flash'
  const { canvas, photo: bounds, paper: edge } = layout
  Object.assign(paper.style, {
    left: `${((edge.x - bounds.x) / bounds.width) * 100}%`,
    top: `${((edge.y - bounds.y) / bounds.height) * 100}%`,
    width: `${(edge.width / bounds.width) * 100}%`,
    height: `${(edge.height / bounds.height) * 100}%`,
  })
  print.append(paper, photo)
  stage.append(backdrop, print, flash)
  picture.append(stage)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let generation = 0
  let animations: Animation[] = []
  let audio: AudioContext | undefined

  function stop() {
    generation += 1
    animations.forEach((animation) => animation.cancel())
    animations = []
    stage.classList.remove('playing')
    if (audio) void audio.close().catch(() => {})
    audio = undefined
  }

  function shutter(context: AudioContext) {
    // Two quiet, short mechanical clicks; no downloaded sound asset required.
    const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * 0.045),
      context.sampleRate
    )
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < samples.length; i += 1)
      samples[i] = Math.random() * 2 - 1
    for (const delay of [0.38, 0.46]) {
      const source = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      source.buffer = buffer
      filter.type = 'bandpass'
      filter.frequency.value = 1800
      filter.Q.value = 0.7
      const start = context.currentTime + delay
      gain.gain.setValueAtTime(0.13, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.045)
      source.connect(filter).connect(gain).connect(context.destination)
      source.start(start)
    }
  }

  async function play() {
    stop()
    if (reducedMotion.matches) return
    const run = generation
    // Resume within the page-turn gesture; denied audio never blocks the artwork.
    try {
      audio = new AudioContext()
      void audio.resume().catch(() => {})
    } catch {
      /* Silent playback is supported. */
    }
    try {
      await Promise.all([photo.decode(), backdrop.decode()])
    } catch {
      if (run === generation) stop()
      return
    }
    if (run !== generation) return
    stage.classList.add('playing')
    if (audio) shutter(audio)
    const timing: KeyframeAnimationOptions = {
      duration: 5200,
      fill: 'forwards',
    }
    const destination = `translate(${(bounds.x / canvas.width) * 100}%, ${(bounds.y / canvas.height) * 100}%) scale(${bounds.width / canvas.width}, ${bounds.height / canvas.height})`
    animations = [
      print.animate(
        [
          { transform: 'none', offset: 0 },
          {
            transform: 'none',
            offset: 0.14,
            easing: 'cubic-bezier(.22,.68,.2,1)',
          },
          {
            transform: 'translate(15%, 14%) scale(.70) rotate(-3deg)',
            offset: 0.48,
            easing: 'cubic-bezier(.22,.68,.2,1)',
          },
          { transform: destination, offset: 0.94 },
          { transform: destination, offset: 1 },
        ],
        timing
      ),
      paper.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: 0.14 },
          { opacity: 1, offset: 0.24 },
          { opacity: 1, offset: 0.72 },
          { opacity: 0, offset: 0.94 },
          { opacity: 0, offset: 1 },
        ],
        timing
      ),
      photo.animate(
        [
          { filter: 'none', offset: 0 },
          { filter: 'none', offset: 0.08 },
          { filter: 'brightness(1.8) saturate(.2)', offset: 0.13 },
          { filter: 'none', offset: 0.48 },
          { filter: 'none', offset: 1 },
        ],
        timing
      ),
      backdrop.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: 0.34 },
          { opacity: 1, offset: 0.67 },
          { opacity: 1, offset: 1 },
        ],
        timing
      ),
      flash.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: 0.072 },
          { opacity: 0.92, offset: 0.086 },
          { opacity: 0, offset: 0.15 },
          { opacity: 0, offset: 1 },
        ],
        timing
      ),
    ]
    try {
      await Promise.all(animations.map((animation) => animation.finished))
      if (run === generation) stop()
    } catch {
      /* Leaving this panel cancels the sequence. */
    }
  }
  const onMotionChange = () => {
    if (reducedMotion.matches) stop()
  }
  reducedMotion.addEventListener('change', onMotionChange)
  const dispose = () => {
    stop()
    reducedMotion.removeEventListener('change', onMotionChange)
    stage.remove()
    picture.classList.remove('photo-moment-panel')
  }
  return { play, stop, dispose }
}
