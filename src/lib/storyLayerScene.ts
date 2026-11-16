/** Decorative images never replace the accessible, static page underneath. */
export function storyImage(src: string, className: string) {
  const image = document.createElement('img')
  if (src) image.src = src
  image.alt = ''
  image.draggable = false
  image.decoding = 'async'
  image.className = className
  return image
}

export function syncStoryAnimationVisibility(animations: Animation[]) {
  for (const animation of animations) {
    if (animation.playState === 'finished') continue
    if (document.hidden) animation.pause()
    else animation.play()
  }
}

type LayerScene = {
  className: string
  panelIds: readonly string[]
  build: (stage: HTMLElement, id: string) => void
  entrance?: string
  onReady?: () => void
  onStop?: () => void
  onVisibilityChange?: () => void
}

/** Own loading, cancellation and visibility for CSS and WAAPI story layers. */
export function createStoryLayerScene(host: HTMLElement, scene: LayerScene) {
  const stage = document.createElement('div')
  stage.className = scene.className
  stage.setAttribute('aria-hidden', 'true')
  host.append(stage)
  let generation = 0
  let disposed = false
  let observer: MutationObserver | undefined
  const surface =
    host.closest<HTMLElement>('.story-page-sheet, .panel-frame') ?? host

  function stop() {
    generation++
    scene.onStop?.()
    observer?.disconnect()
    observer = undefined
    stage.className = scene.className
    stage.replaceChildren()
    delete stage.dataset.panelId
  }

  function startEntrance() {
    if (surface.classList.contains('story-transition-frame')) return
    if (scene.entrance) stage.classList.add(scene.entrance)
    observer?.disconnect()
    observer = undefined
  }

  function visibility() {
    stage.classList.toggle('paused', document.hidden)
    scene.onVisibilityChange?.()
  }

  async function show(id: string) {
    stop()
    if (disposed || !scene.panelIds.includes(id)) return
    const run = generation
    stage.dataset.panelId = id
    scene.build(stage, id)
    try {
      await Promise.all(
        [...stage.querySelectorAll('img')].map((image) => image.decode())
      )
    } catch {
      // A stale failure must not stop the replacement scene.
      if (run === generation) stop()
      return
    }
    if (run !== generation) return
    stage.classList.add('ready')
    visibility()
    scene.onReady?.()
    if (scene.entrance) {
      observer = new MutationObserver(startEntrance)
      observer.observe(surface, {
        attributes: true,
        attributeFilter: ['class'],
      })
      startEntrance()
    }
  }

  document.addEventListener('visibilitychange', visibility)
  return {
    stage,
    show,
    stop,
    dispose() {
      disposed = true
      stop()
      stage.remove()
      document.removeEventListener('visibilitychange', visibility)
    },
  }
}
