import garden from '../assets/comic/layers/underwater/reef-garden.webp'
import palace from '../assets/comic/layers/underwater/reef-palace.webp'
import odetteUrl from '../assets/comic/layers/underwater/odette.webp'
import rainbow from '../assets/comic/layers/underwater/rainbow.webp'
import primarinaAqua from '../assets/comic/layers/underwater/primarina-aqua.webp'
import tangySweet from '../assets/comic/layers/underwater/tangy-sweet.webp'
import eclipseDiana from '../assets/comic/layers/underwater/eclipse-diana.webp'
import hopDoremi from '../assets/comic/layers/underwater/hop-doremi.webp'
import './storyUnderwater.css'

const scenes: Record<string, { background: string; friends: string }> = {
  '05-rainbow': { background: garden, friends: rainbow },
  '06-primarina-aqua': { background: garden, friends: primarinaAqua },
  '07-tangy-sweet': { background: garden, friends: tangySweet },
  '08-eclipse-diana': { background: palace, friends: eclipseDiana },
  '09-hop-doremi': { background: palace, friends: hopDoremi },
}

/** Keep one Odette node while the decoded scenery and companion layers change. */
export function createUnderwaterScene(host: HTMLElement) {
  const stage = document.createElement('div')
  stage.className = 'underwater-scene'
  stage.setAttribute('aria-hidden', 'true')
  const image = (src: string, className: string) => {
    const node = document.createElement('img')
    node.className = className
    node.alt = ''
    node.draggable = false
    node.decoding = 'async'
    if (src) node.src = src
    return node
  }
  const odette = image('', 'underwater-odette')
  stage.append(odette)
  for (let i = 0; i < 8; i += 1) {
    const bubble = document.createElement('span')
    bubble.className = 'underwater-bubble'
    bubble.style.left = `${8 + ((i * 17) % 88)}%`
    bubble.style.animationDelay = `${-i * 1.3}s`
    stage.append(bubble)
  }
  host.append(stage)
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let generation = 0
  let requested: string | undefined
  let currentBackground: HTMLImageElement | undefined
  let currentFriends: HTMLImageElement | undefined
  let cleanupTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  function stop(clearRequest = true) {
    if (clearRequest) requested = undefined
    generation += 1
    clearTimeout(cleanupTimer)
    stage.classList.remove('ready')
    stage
      .querySelectorAll('.underwater-background, .underwater-friends')
      .forEach((node) => node.remove())
    currentBackground = undefined
    currentFriends = undefined
    delete stage.dataset.panelId
  }

  async function show(panelId: string) {
    if (disposed) return
    requested = panelId
    const scene = scenes[panelId]
    if (!scene || motion.matches) {
      stop(false)
      return
    }
    const run = ++generation
    if (!odette.getAttribute('src')) odette.src = odetteUrl
    const background =
      currentBackground?.getAttribute('src') === scene.background
        ? currentBackground
        : image(scene.background, 'underwater-background')
    const friends = image(scene.friends, 'underwater-friends')
    try {
      await Promise.all([
        odette.complete && odette.naturalWidth > 0
          ? Promise.resolve()
          : odette.decode(),
        background.complete && background.naturalWidth > 0
          ? Promise.resolve()
          : background.decode(),
        friends.decode(),
      ])
    } catch {
      if (run === generation) stop()
      return
    }
    if (run !== generation) return
    clearTimeout(cleanupTimer)
    // A quick scrub can interrupt the previous fade; retain only the latest layers.
    stage.querySelectorAll('[data-outgoing]').forEach((node) => node.remove())
    const outgoing = [
      currentBackground === background ? undefined : currentBackground,
      currentFriends,
    ].filter((node) => node !== undefined)
    outgoing.forEach((node) => {
      node.style.transform = getComputedStyle(node).transform
      node.dataset.outgoing = 'true'
    })
    if (background !== currentBackground) stage.prepend(background)
    stage.append(friends)
    currentBackground = background
    currentFriends = friends
    stage.dataset.panelId = panelId
    stage.classList.add('ready')
    cleanupTimer = setTimeout(
      () => outgoing.forEach((node) => node.remove()),
      1600
    )
  }

  const onMotionChange = () => {
    if (motion.matches) stop(false)
    else if (requested) void show(requested)
  }
  motion.addEventListener('change', onMotionChange)
  const onVisibilityChange = () => {
    stage.classList.toggle('paused', document.hidden)
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  onVisibilityChange()
  return {
    show,
    stop,
    dispose() {
      disposed = true
      stop()
      motion.removeEventListener('change', onMotionChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stage.remove()
    },
  }
}
