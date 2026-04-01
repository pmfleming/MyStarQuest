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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { z } from 'zod'
import { auth } from '../firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const nativeGoogleSignInResultSchema = z.object({
  credential: z.object({
    idToken: z.string().min(1),
  }),
})

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
      const result = nativeGoogleSignInResultSchema.parse(
        await FirebaseAuthentication.signInWithGoogle()
      )
      const idToken = result.credential.idToken
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
