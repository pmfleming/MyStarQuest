import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from 'firebase/auth'
import { AuthProvider } from '../../src/auth/AuthProvider'
import { useAuth } from '../../src/auth/AuthContext'
import {
  hasSessionPreloadHint,
  rememberSessionForPreload,
} from '../../src/auth/sessionPreloadHint'

const state = vi.hoisted(() => ({
  native: false,
  callback: null as null | ((user: User | null) => void),
  unsubscribe: vi.fn(),
  popup: vi.fn(async () => ({})),
  credential: vi.fn(async () => ({})),
  nativeSignIn: vi.fn(async () => ({
    credential: { idToken: 'native-test-token' },
  })),
  resolver: { type: 'popup-resolver' },
  auth: { type: 'test-auth' },
}))
vi.mock('../../src/firebase', () => ({ auth: state.auth }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => state.native },
}))
vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: { signInWithGoogle: state.nativeSignIn },
}))
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {
    static credential(token: string) {
      return { token }
    }
  },
  browserPopupRedirectResolver: state.resolver,
  onAuthStateChanged: (_auth: unknown, callback: typeof state.callback) => {
    state.callback = callback
    return state.unsubscribe
  },
  signInWithPopup: state.popup,
  signInWithCredential: state.credential,
  signOut: vi.fn(),
}))

let context: ReturnType<typeof useAuth>
function Consumer() {
  const auth = useAuth()
  useEffect(() => {
    context = auth
  }, [auth])
  return (
    <div>
      {auth.loading
        ? 'Restoring session'
        : auth.user
          ? 'Signed in'
          : 'Signed out'}
    </div>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  state.native = false
  rememberSessionForPreload(false)
})
afterEach(() => vi.restoreAllMocks())

describe('Auth startup and sign-in', () => {
  it('restores a session without starting sign-in and clears the preload hint on sign-out', () => {
    const { unmount } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    expect(screen.getByText('Restoring session')).toBeVisible()
    act(() => state.callback!({ uid: 'test' } as User))
    expect(screen.getByText('Signed in')).toBeVisible()
    expect(hasSessionPreloadHint()).toBe(true)
    expect(state.popup).not.toHaveBeenCalled()
    expect(state.nativeSignIn).not.toHaveBeenCalled()
    act(() => state.callback!(null))
    expect(hasSessionPreloadHint()).toBe(false)
    unmount()
    expect(state.unsubscribe).toHaveBeenCalledOnce()
  })

  it('passes the resolver only to requested web popup sign-in and propagates cancellation', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    await act(() => context.loginWithGoogle())
    expect(state.popup).toHaveBeenCalledWith(
      state.auth,
      expect.any(Object),
      state.resolver
    )
    expect(state.nativeSignIn).not.toHaveBeenCalled()
    state.popup.mockRejectedValueOnce(new Error('Popup cancelled'))
    await expect(context.loginWithGoogle()).rejects.toThrow('Popup cancelled')
  })

  it('retains native credential sign-in without a browser popup', async () => {
    state.native = true
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    await act(() => context.loginWithGoogle())
    expect(state.nativeSignIn).toHaveBeenCalledOnce()
    expect(state.credential).toHaveBeenCalledWith(state.auth, {
      token: 'native-test-token',
    })
    expect(state.popup).not.toHaveBeenCalled()
  })
})
