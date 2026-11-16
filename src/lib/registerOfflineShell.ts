import { Capacitor } from '@capacitor/core'
import { afterFirstPaint } from './afterFirstPaint'
import { setWaitingWorker } from './appUpdate'

// Native assets already ship in the APK. Do not let a web cache mask an APK update.
export function registerOfflineShell() {
  if (
    !import.meta.env.PROD ||
    Capacitor.isNativePlatform() ||
    !('serviceWorker' in navigator)
  )
    return
  let pending = false
  let registration: ServiceWorkerRegistration | undefined
  const cacheVisited = () =>
    navigator.serviceWorker.controller?.postMessage({
      type: 'CACHE_VISITED',
      urls: performance.getEntriesByType('resource').map((entry) => entry.name),
    })
  navigator.serviceWorker.addEventListener('controllerchange', cacheVisited)
  const register = async () => {
    if (pending || navigator.onLine === false) return
    pending = true
    try {
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none',
        })
        const refreshUpdate = () =>
          setWaitingWorker(registration?.waiting ?? null)
        refreshUpdate()
        const watchInstall = () => {
          registration?.installing?.addEventListener(
            'statechange',
            refreshUpdate
          )
        }
        watchInstall()
        registration.addEventListener('updatefound', watchInstall)
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          refreshUpdate
        )
        cacheVisited()
      }
      if (registration.active) await registration.update()
    } catch {
      // Unsupported storage or a dropped installation leaves normal online use intact.
    } finally {
      pending = false
    }
  }
  window.addEventListener('online', () => {
    void register()
  })
  let lastCheck = Date.now()
  document.addEventListener('visibilitychange', () => {
    // Returning to a long-lived tab should discover releases without polling.
    if (document.hidden || Date.now() - lastCheck < 60_000) return
    lastCheck = Date.now()
    void register()
  })
  afterFirstPaint(() => {
    void register()
  })
}
