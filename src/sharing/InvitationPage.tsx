import { useAsyncFeedback } from '../hooks/useAsyncFeedback'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { isThemeId } from '../ui/themeOptions'
import { sharingCall } from './api'
export default function InvitationPage() {
  const { inviteId } = useParams()
  const { user, loading, loginWithGoogle, logout } = useAuth()
  const { setActiveChild } = useActiveChild()
  const navigate = useNavigate()
  const location = useLocation()
  const token = location.hash.slice(1)
  const {
    busy,
    message: error,
    run,
  } = useAsyncFeedback('Could not accept the invitation.')
  return (
    <main className="flex min-h-dvh items-center justify-center bg-pink-50 p-6 text-purple-950">
      <section className="flex w-full max-w-lg flex-col gap-5 rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">You’re invited to MyStarQuest</h1>
        <p>
          Sign in with the Google email that received this invitation. Once
          accepted, you can manage this child’s chores, tests and rewards, with
          progress shared across parents.
        </p>
        <p>The admin parent manages children and resets progress.</p>
        {!token || !inviteId ? (
          <p role="alert">
            This invitation link is incomplete. Open the full link in your
            email.
          </p>
        ) : loading ? (
          <p role="status">Checking sign-in…</p>
        ) : user ? (
          <>
            <p>
              Signed in as <strong>{user.email}</strong>
            </p>
            <button
              disabled={busy}
              className="rounded-xl bg-purple-800 p-3 font-bold text-white"
              onClick={() =>
                void run(async () => {
                  const child = await sharingCall<{
                    ownerUid: string
                    childId: string
                    themeId: string
                  }>('acceptParentInvitation', { inviteId, token })
                  setActiveChild({
                    id: child.childId,
                    ownerUid: child.ownerUid,
                    themeId: isThemeId(child.themeId)
                      ? child.themeId
                      : 'princess',
                  })
                  await navigate('/tabs/chores', { replace: true })
                })
              }
            >
              Accept invitation
            </button>
            <button
              disabled={busy}
              className="underline"
              onClick={() => void run(logout)}
            >
              Use another Google account
            </button>
          </>
        ) : (
          <button
            disabled={busy}
            className="rounded-xl bg-purple-800 p-3 font-bold text-white"
            onClick={() => void run(loginWithGoogle)}
          >
            Sign in with Google
          </button>
        )}
        {busy && <p role="status">Please wait…</p>}
        {error && <p role="alert">{error}</p>}
        <button
          className="underline"
          onClick={() => void navigate('/tabs/chores')}
        >
          Back to MyStarQuest
        </button>
      </section>
    </main>
  )
}
