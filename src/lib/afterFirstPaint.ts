// Background work should not compete with the first visible frame.
export function afterFirstPaint(callback: () => void) {
  let cancelled = false
  let idle: number | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = () => {
    if (!cancelled) callback()
  }
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      if (typeof window.requestIdleCallback === 'function') {
        idle = window.requestIdleCallback(run, { timeout: 1500 })
      } else {
        timer = setTimeout(run, 0)
      }
    })
  })
  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
    if (idle !== undefined) window.cancelIdleCallback(idle)
    if (timer !== undefined) clearTimeout(timer)
  }
}
