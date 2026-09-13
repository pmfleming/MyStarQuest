import { createContext } from 'react'
import type { User } from 'firebase/auth'
import { useRequiredContext } from '../hooks/useRequiredContext'

type AuthContextValue = {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
)

export const useAuth = () => {
  return useRequiredContext(AuthContext, 'useAuth', 'AuthProvider')
}
