import type { Location as RouterLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const LoginPage = () => {
  const { user, loading, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const redirectPathRef = useRef('/')
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
    if (loading) return

    if (user) {
      redirectPathRef.current =
        (location.state as { from?: RouterLocation } | undefined)?.from
          ?.pathname ?? '/'
      setLoginSuccess(true)
      return
    }

    if (isLoggingIn) {
      setIsLoggingIn(false)
    }
  }, [loading, user, location, isLoggingIn])

  useEffect(() => {
    if (!loginSuccess) return

    const timer = window.setTimeout(() => {
      navigate(redirectPathRef.current, { replace: true })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [loginSuccess, navigate])

  const isBusy = loading || isLoggingIn || loginSuccess

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-md space-y-6 rounded-xl bg-slate-900/70 p-8 shadow-lg shadow-slate-950/30">
        {loginSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <span className="text-5xl" role="img" aria-label="Checkmark">
              ✅
            </span>
            <h2 className="text-2xl font-semibold">Login Successful!</h2>
            <p className="text-slate-400">Redirecting you now...</p>
          </div>
        ) : (
          <>
            <header className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold">Sign in to MyStarQuest</h1>
              <p className="text-slate-400">
                Use your Google account to start awarding stars and track
                progress in real time.
              </p>
            </header>

            {/* 4. Conditionally render the error message */}
            {error && (
              <div
                className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-center text-red-300"
                role="alert"
              >
                <p className="font-medium">Error signing in</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-lg font-medium text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring focus-visible:ring-emerald-300"
              disabled={isBusy}
            >
              {isLoggingIn ? (
                <span>Signing in...</span>
              ) : loading ? (
                <span>Loading...</span>
              ) : (
                <span>Sign in with Google</span>
              )}
            </button>
          </>
        )}
      </section>
    </main>
  )
}

export default LoginPage
