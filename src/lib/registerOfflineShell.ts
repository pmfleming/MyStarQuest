import { Capacitor } from '@capacitor/core'
import { afterFirstPaint } from './afterFirstPaint'

// Native assets already ship in the APK. Do not let a web cache mask an APK update.
export function registerOfflineShell() {
  if (
    !import.meta.env.PROD ||
    Capacitor.isNativePlatform() ||
    !('serviceWorker' in navigator)
  )
    return
  let pending = false
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
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
      })
      cacheVisited()
      if (registration.active) void registration.update().catch(() => {})
    } catch {
      // Unsupported storage or a dropped installation leaves normal online use intact.
    } finally {
      pending = false
    }
  }
  window.addEventListener('online', () => {
    void register()
  })
  afterFirstPaint(() => {
    void register()
  })
}
