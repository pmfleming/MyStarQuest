import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'
import type { User } from 'firebase/auth'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { auth } from '../firebase'

import { AuthContext } from './AuthContext'

const getNativeGoogleIdToken = (result: unknown) => {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('credential' in result) ||
    typeof result.credential !== 'object' ||
    result.credential === null ||
    !('idToken' in result.credential) ||
    typeof result.credential.idToken !== 'string' ||
    result.credential.idToken.length === 0
  ) {
    throw new Error('Google sign-in did not return an ID token.')
  }

  return result.credential.idToken
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      // Use the Capacitor plugin on Android/iOS — avoids WebView popup restrictions
      const idToken = getNativeGoogleIdToken(
        await FirebaseAuthentication.signInWithGoogle()
      )
      const credential = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(auth, credential)
    } else {
      // Standard web popup flow
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithGoogle,
      logout,
    }),
    [user, loading, loginWithGoogle, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
