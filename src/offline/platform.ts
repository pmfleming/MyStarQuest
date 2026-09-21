import { Capacitor } from '@capacitor/core'

// Use durable actions on the web too. Keep the existing server-only fallback
// for browsers without IndexedDB; never silently replace durable storage with RAM.
export const isOfflineEnabled = () =>
  Capacitor.getPlatform() === 'android' || typeof indexedDB !== 'undefined'
