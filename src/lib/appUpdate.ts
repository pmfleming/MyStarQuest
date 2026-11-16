let waitingWorker: ServiceWorker | null = null
const listeners = new Set<() => void>()

export const getWaitingWorker = () => waitingWorker
export const subscribeAppUpdate = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function setWaitingWorker(worker: ServiceWorker | null) {
  if (waitingWorker === worker) return
  waitingWorker = worker
  for (const listener of listeners) listener()
}

export function applyAppUpdate() {
  if (!waitingWorker) return
  // Reload only the tab whose user chose to update. Other tabs can finish their work.
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => window.location.reload(),
    { once: true }
  )
  waitingWorker.postMessage({ type: 'ACTIVATE_UPDATE' })
}
