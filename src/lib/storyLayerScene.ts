/** Decorative images never replace the accessible, static page underneath. */
export function storyImage(src: string, className: string) {
  const image = document.createElement('img')
  image.src = src
  image.alt = ''
  image.draggable = false
  image.decoding = 'async'
  image.className = className
  return image
}

type LayerScene = {
  className: string
  panelIds: readonly string[]
  build: (stage: HTMLElement, id: string) => void
  entrance?: string
}

/** Own loading, cancellation and visibility once for CSS-animated story layers. */
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
      if (run === generation) stop()
      return
    }
    if (run !== generation) return
    stage.classList.add('ready')
    visibility()
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
