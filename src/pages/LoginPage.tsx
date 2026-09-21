import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import ActionButton from '../components/ui/ActionButton'
import { getSurfaceWidthConstraints } from '../tokens'
import googleIcon from '../assets/global/google.svg'
import { useConnectivity } from '../hooks/useConnectivity'

const getRedirectPath = (state: unknown) => {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/'
  const from = state.from
  return from && typeof from === 'object' && 'pathname' in from
    ? String(from.pathname)
    : '/'
}

const LoginPage = () => {
  const { user, loading, loginWithGoogle } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const online = useConnectivity()

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const loginSuccess = !loading && Boolean(user)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!online) return
    setIsLoggingIn(true)
    setError(null)
    try {
      await loginWithGoogle()
    } catch (err) {
      console.error('Login failed:', err)
      setError('Login failed. Please close the popup and try again.')
      setIsLoggingIn(false)
    }
  }

  if (loginSuccess)
    return <Navigate to={getRedirectPath(location.state)} replace />

  const isBusy = loading || isLoggingIn

  return (
    <PageShell
      theme={theme}
      contentClassName="flex flex-1 items-center justify-center"
    >
      <section
        className="w-full space-y-6 rounded-xl bg-black/30 p-8 shadow-lg"
        style={getSurfaceWidthConstraints()}
      >
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Sign in to MyStarQuest</h1>
          <p className="opacity-70">
            Use your Google account to start awarding stars and track progress
            in real time.
          </p>
        </header>

        {error && (
          <div
            className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-center text-red-200"
            role="alert"
          >
            <p className="font-medium">Error signing in</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!online && (
          <p role="status" className="text-center">
            Connect to sign in.
          </p>
        )}

        <ActionButton
          theme={theme}
          color={theme.colors.primary}
          label={
            isLoggingIn
              ? 'Signing in...'
              : loading
                ? 'Loading...'
                : 'Google Account'
          }
          icon={
            <img
              src={googleIcon}
              alt="Google"
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
              }}
            />
          }
          onClick={handleLogin}
          disabled={isBusy || !online}
        />
      </section>
    </PageShell>
  )
}

export default LoginPage
