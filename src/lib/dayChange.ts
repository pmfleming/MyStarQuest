type Watcher = { read: () => string; day: string; changed: () => void }
const watchers = new Set<Watcher>()
let timer: ReturnType<typeof setInterval> | undefined
function checkDays() {
  if (document.hidden) return
  for (const watcher of watchers) {
    const day = watcher.read()
    if (day === watcher.day) continue
    watcher.day = day
    watcher.changed()
  }
}

// One minute clock for all day-scoped views; unchanged days publish nothing.
export function subscribeDayChange(read: () => string, changed: () => void) {
  const watcher = { read, day: read(), changed }
  watchers.add(watcher)
  if (!timer) {
    timer = setInterval(checkDays, 60_000)
    document.addEventListener('visibilitychange', checkDays)
  }
  return () => {
    watchers.delete(watcher)
    if (watchers.size) return
    clearInterval(timer)
    timer = undefined
    document.removeEventListener('visibilitychange', checkDays)
  }
}
