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
      className="flex min-h-screen w-full items-center justify-center transition-colors duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      {/* Device Frame - simulates mobile device with border */}
      <div
        className="relative flex min-h-[896px] w-full max-w-[414px] flex-col overflow-hidden"
        style={{
          borderRadius: '40px',
          boxShadow:
            '0 0 0 12px #1a1a2e, 0 0 0 14px #333, 0 25px 50px rgba(0, 0, 0, 0.5)',
          background: theme.colors.bg,
          backgroundImage: theme.bgPattern,
        }}
      >
        {/* Top Navigation Bar */}
        <div className="absolute top-0 right-0 z-50 flex gap-2 p-4">
          <Link
            to="/settings/manage-children"
            className="rounded-full px-4 py-2 text-xs font-medium transition hover:opacity-80"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: theme.colors.text,
              backdropFilter: 'blur(10px)',
            }}
          >
            👨‍👩‍👧 Children
          </Link>
          <button
            onClick={logout}
            className="rounded-full px-4 py-2 text-xs font-medium transition hover:opacity-80"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: theme.colors.text,
              backdropFilter: 'blur(10px)',
            }}
          >
            Logout
          </button>
        </div>

        {/* Content Area */}
        <div
          className="flex flex-1 flex-col p-6 pt-20"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
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
            <h2 className="mb-2 text-sm font-semibold tracking-[3px] uppercase opacity-70">
              Your Stars
            </h2>
            <div className="flex items-center justify-center gap-3">
              <style>{`
              @keyframes starBounce {
                0%, 100% { transform: translateY(0) rotate(-5deg); }
                50% { transform: translateY(-10px) rotate(5deg); }
              }
              .star-bounce {
                animation: starBounce 2s ease-in-out infinite;
              }
            `}</style>
              <span className="star-bounce text-[56px]">⭐</span>
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.heading,
                  textShadow:
                    theme.id === 'cartoon'
                      ? `3px 3px 0px ${theme.colors.accent}`
                      : theme.id === 'space'
                        ? `0 0 20px ${theme.colors.primary}80`
                        : `2px 2px 0px ${theme.colors.accent}`,
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
                className="flex h-[88px] w-full items-center justify-between px-6 text-[28px] font-bold transition-all"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: isDarkTheme ? '#000' : '#FFF',
                  fontFamily: '"Fredoka", "Comic Sans MS", sans-serif',
                  fontWeight: 700,
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
                  <span className="text-[48px]">📋</span>
                  <span>My Tasks</span>
                </span>
                <span className="text-[32px] opacity-60 transition-transform group-hover:translate-x-2">
                  →
                </span>
              </button>
            </Link>

            <Link to="/settings/manage-rewards" className="group">
              <button
                type="button"
                className="flex h-[88px] w-full items-center justify-between px-6 text-[28px] font-bold transition-all"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: isDarkTheme ? '#000' : '#FFF',
                  fontFamily: '"Fredoka", "Comic Sans MS", sans-serif',
                  fontWeight: 700,
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
                  <span className="text-[48px]">🎁</span>
                  <span>Rewards</span>
                </span>
                <span className="text-[32px] opacity-60 transition-transform group-hover:translate-x-2">
                  →
                </span>
              </button>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
