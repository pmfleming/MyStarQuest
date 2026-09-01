import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import ActionButton from '../components/ui/ActionButton'
import { getSurfaceWidthConstraints } from '../tokens'
import googleIcon from '../assets/global/google.svg'

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
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const loginSuccess = !loading && Boolean(user)
  // 1. Add state for login errors
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setIsLoggingIn(true)
    setError(null) // 2. Clear previous errors on a new attempt
    try {
      await loginWithGoogle()
      // Success will be handled by the useEffect when 'user' appears
    } catch (err) {
      console.error('Login failed:', err)
      // 3. Set a user-facing error message on failure
      setError('Login failed. Please close the popup and try again.')
      setIsLoggingIn(false) // Reset button on error
    }
  }

  useEffect(() => {
    if (!loginSuccess) return

    const redirectPath = getRedirectPath(location.state)
    const timer = window.setTimeout(() => {
      navigate(redirectPath, { replace: true })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [location.state, loginSuccess, navigate])

  const isBusy = loading || isLoggingIn || loginSuccess

  return (
    <PageShell
      theme={theme}
      contentClassName="flex flex-1 items-center justify-center"
    >
      <section
        className="w-full space-y-6 rounded-xl bg-black/30 p-8 shadow-lg"
        style={getSurfaceWidthConstraints()}
      >
        {loginSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <span className="text-5xl" role="img" aria-label="Checkmark">
              ✅
            </span>
            <h2 className="text-2xl font-semibold">Login Successful!</h2>
            <p className="opacity-70">Redirecting you now...</p>
          </div>
        ) : (
          <>
            <header className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold">Sign in to MyStarQuest</h1>
              <p className="opacity-70">
                Use your Google account to start awarding stars and track
                progress in real time.
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
              disabled={isBusy}
            />
          </>
        )}
      </section>
    </PageShell>
  )
}

export default LoginPage
