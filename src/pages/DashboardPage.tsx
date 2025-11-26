import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'

// --- Types ---
type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
  themeId?: string
}

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const { activeChildId, setActiveChild } = useActiveChild()
  const { theme } = useTheme()
  const [children, setChildren] = useState<ChildProfile[]>([])

  // --- Data Fetching ---
  useEffect(() => {
    if (!user) {
      setChildren([])
      return
    }
    const childrenQuery = query(
      collection(db, 'users', user.uid, 'children'),
      orderBy('createdAt', 'asc')
    )
    const unsubscribe = onSnapshot(childrenQuery, (snapshot) => {
      const nextChildren: ChildProfile[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          displayName: data.displayName ?? 'Explorer',
          avatarToken: data.avatarToken ?? '⭐',
          totalStars: Number(data.totalStars ?? 0),
          themeId: data.themeId,
        }
      })
      setChildren(nextChildren)
    })
    return unsubscribe
  }, [user])

  // --- Auto-select child ---
  useEffect(() => {
    if (
      children.length > 0 &&
      (!activeChildId || !children.some((c) => c.id === activeChildId))
    ) {
      setActiveChild({
        id: children[0].id,
        themeId: children[0].themeId || 'space',
      })
    }
  }, [children, activeChildId, setActiveChild])

  const selectedChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  // Determine text color contrast
  const isDarkTheme = theme.id === 'space'

  // --- Main Render ---
  return (
    <div
      className="flex min-h-screen w-full items-start justify-center transition-colors duration-500"
      style={{
        background: theme.colors.bg,
        backgroundImage: theme.bgPattern,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        padding: '20px',
      }}
    >
      {/* Mobile Container - matches prototype max-width */}
      <div
        className="flex min-h-[calc(100vh-40px)] w-full max-w-[414px] flex-col rounded-[40px] p-6"
        style={{
          backgroundColor:
            theme.id === 'space' ? 'transparent' : theme.colors.surface,
          boxShadow:
            theme.id === 'space' ? 'none' : '0 25px 50px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header / Profile */}
        <header className="relative z-10 mb-8 flex items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-4xl"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.surface,
              boxShadow: `0 0 20px ${theme.colors.primary}40`,
            }}
          >
            {selectedChild?.avatarToken || theme.emoji}
          </div>
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: theme.fonts.heading }}
            >
              Hi, {selectedChild?.displayName || 'Explorer'}!
            </h1>
            <p className="opacity-80">Ready for your quest?</p>
          </div>
        </header>

        {/* Star Balance (Big & Fun) */}
        <section
          className="relative z-10 mb-8 transform rounded-3xl p-6 text-center transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: theme.colors.surface,
            boxShadow: `0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40`,
            border: `3px solid ${theme.colors.primary}`,
          }}
        >
          <h2 className="mb-2 text-lg font-bold tracking-widest uppercase opacity-70">
            Your Stars
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className="animate-bounce text-6xl">⭐</span>
            <span
              className="text-7xl font-black"
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fonts.heading,
                textShadow: `3px 3px 0px ${theme.colors.accent}`,
              }}
            >
              {selectedChild?.totalStars || 0}
            </span>
          </div>
        </section>

        {/* Main Actions (Big Buttons for Motor Skills - 88px height) */}
        <nav className="relative z-10 grid grid-cols-1 gap-5">
          <Link to="/settings/manage-tasks" className="group">
            <button
              type="button"
              className="flex h-[88px] w-full items-center justify-between px-8 text-xl font-bold transition-all"
              style={{
                backgroundColor: theme.colors.secondary,
                color: isDarkTheme ? '#000' : '#FFF',
                borderRadius: theme.id === 'space' ? '50px' : '24px',
                border:
                  theme.id === 'space'
                    ? `3px solid ${theme.colors.secondary}`
                    : `4px solid ${theme.colors.accent}`,
                boxShadow:
                  theme.id === 'space'
                    ? `0 0 20px ${theme.colors.secondary}40`
                    : `0 6px 0 ${theme.colors.accent}`,
              }}
            >
              <span className="flex items-center gap-4">
                <span className="text-4xl">📋</span>
                <span>My Tasks</span>
              </span>
              <span className="text-3xl opacity-50 transition-transform group-hover:translate-x-2">
                →
              </span>
            </button>
          </Link>

          <Link to="/settings/manage-rewards" className="group">
            <button
              type="button"
              className="flex h-[88px] w-full items-center justify-between px-8 text-xl font-bold transition-all"
              style={{
                backgroundColor: theme.colors.primary,
                color: isDarkTheme ? '#000' : '#FFF',
                borderRadius: theme.id === 'space' ? '50px' : '24px',
                border:
                  theme.id === 'space'
                    ? `3px solid ${theme.colors.primary}`
                    : `4px solid ${theme.colors.accent}`,
                boxShadow:
                  theme.id === 'space'
                    ? `0 0 20px ${theme.colors.primary}40`
                    : `0 6px 0 ${theme.colors.accent}`,
              }}
            >
              <span className="flex items-center gap-4">
                <span className="text-4xl">🎁</span>
                <span>Rewards</span>
              </span>
              <span className="text-3xl opacity-50 transition-transform group-hover:translate-x-2">
                →
              </span>
            </button>
          </Link>
        </nav>

        {/* Parent Corner (Discreet) */}
        <footer className="relative z-10 mt-auto pt-12 text-center">
          <div className="flex flex-col items-center gap-3 opacity-60">
            <Link
              to="/settings/manage-children"
              className="rounded-lg border border-current px-4 py-2 text-sm underline-offset-2 transition hover:bg-black/10 hover:opacity-100"
            >
              👨‍👩‍👧 Manage Children
            </Link>
            <button onClick={logout} className="text-xs underline opacity-70">
              Log Out
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardPage
