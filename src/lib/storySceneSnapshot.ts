/** Freeze the painted pose before React releases a live layered illustration. */
export function snapshotStoryScene(surface: HTMLElement) {
  const scene = surface.querySelector<HTMLElement>(
    '[data-story-scene].ready, .photo-moment.playing, .morning-rooms.ready, [data-snapshot="true"]'
  )
  if (!scene) return
  const snapshot = scene.cloneNode(true)
  if (!(snapshot instanceof HTMLElement)) return
  const originals = [scene, ...scene.querySelectorAll<HTMLElement>('*')]
  const copies = [snapshot, ...snapshot.querySelectorAll<HTMLElement>('*')]
  originals.forEach((element, index) => {
    const style = getComputedStyle(element)
    const copy = copies[index]!
    // Capture animated geometry as well as transforms (including a half-finished takeoff).
    for (const property of [
      'transform',
      'opacity',
      'left',
      'top',
      'bottom',
      'width',
      'height',
      'visibility',
      'z-index',
      'filter',
      'clip-path',
      'background-position',
    ]) {
      copy.style.setProperty(property, style.getPropertyValue(property))
    }
    copy.style.setProperty('animation', 'none', 'important')
  })
  snapshot.classList.remove('flying', 'ready', 'playing')
  snapshot.dataset.snapshot = 'true'
  snapshot.style.inset = '0'
  snapshot.style.width = '100%'
  snapshot.style.height = '100%'
  return snapshot
}
