import { afterEach, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({ initialize: vi.fn(() => ({ type: 'auth' })) }))
vi.mock('firebase/app', () => ({ initializeApp: () => ({ type: 'app' }) }))
vi.mock('firebase/auth', () => ({
  initializeAuth: sdk.initialize,
  indexedDBLocalPersistence: 'indexed-db',
  browserLocalPersistence: 'local',
  browserSessionPersistence: 'session',
}))
afterEach(() => vi.unstubAllEnvs())

it('preserves the existing persistence fallback order without a proactive popup resolver', async () => {
  for (const key of [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID',
  ]) {
    vi.stubEnv(`VITE_FIREBASE_${key}`, 'test')
  }
  const { auth } = await import('../../src/firebase')
  expect(auth).toEqual({ type: 'auth' })
  expect(sdk.initialize).toHaveBeenCalledExactlyOnceWith(
    { type: 'app' },
    {
      persistence: ['indexed-db', 'local', 'session'],
    }
  )
})
