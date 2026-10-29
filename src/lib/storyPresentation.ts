// The dialog always fills the viewport, even where browser fullscreen is denied.
export async function enterStoryPresentation() {
  let ownsFullscreen = false
  let ownsOrientation = false
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (orientation: 'landscape') => Promise<void>
  }
  const fullscreen =
    !document.fullscreenElement && document.documentElement.requestFullscreen
      ? document.documentElement
          .requestFullscreen()
          .then(() => {
            ownsFullscreen = true
          })
          .catch(() => {})
      : Promise.resolve()
  const { Capacitor, registerPlugin } = await import('@capacitor/core')
  const native = Capacitor.isNativePlatform()
  const nativeReader = native
    ? registerPlugin<{ enter: () => Promise<void>; exit: () => Promise<void> }>(
        'StoryReader'
      )
    : null
  await fullscreen
  if (nativeReader) {
    await nativeReader.enter().catch(() => {})
  } else if (
    window.matchMedia?.('(max-width: 767px), (pointer: coarse)').matches
  ) {
    try {
      await orientation?.lock?.('landscape')
      ownsOrientation = Boolean(orientation?.lock)
    } catch {
      /* CSS keeps a landscape canvas where orientation lock is unavailable. */
    }
  }

  return async () => {
    if (nativeReader) await nativeReader.exit().catch(() => {})
    if (ownsOrientation) orientation.unlock()
    if (
      ownsFullscreen &&
      document.fullscreenElement === document.documentElement
    ) {
      await document.exitFullscreen().catch(() => {})
    }
  }
}
