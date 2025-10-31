import { useAuth } from '../auth/AuthContext'

const DashboardPage = () => {
  const { user, logout } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
        </h1>
        <p className="text-lg text-slate-400">
          You&apos;re authenticated with Google. This is a protected route that
          only signed-in users can access.
        </p>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-slate-100 px-4 py-2 text-slate-950 transition hover:bg-slate-300 focus:outline-none focus-visible:ring focus-visible:ring-slate-200"
        >
          Sign out
        </button>
      </section>
    </main>
  )
}

export default DashboardPage
