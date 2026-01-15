import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'

// --- Assets ---
import princessChildrenIcon from '../assets/themes/princess/Children.svg'
import princessExitIcon from '../assets/themes/princess/Exit.svg'
// Note: Import other theme assets here as needed

// --- Types ---
type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
  themeId?: string
}

// --- Helper: Theme Asset Mapping ---
const getThemeAssets = (themeId: string) => {
  switch (themeId) {
    case 'princess':
      return {
        switchProfileIcon: princessChildrenIcon,
        exitIcon: princessExitIcon,
      }
    case 'space':
    default:
      // Space theme and other themes use emoji fallbacks
      return {
        switchProfileIcon: null,
        exitIcon: null,
      }
  }
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

  // --- Auto-select child logic ---
  useEffect(() => {
    if (children.length > 0) {
      const isCurrentActiveValid =
        activeChildId && children.some((c) => c.id === activeChildId)

      if (!isCurrentActiveValid) {
        setActiveChild({
          id: children[0].id,
          themeId: children[0].themeId || 'space',
        })
      }
    }
  }, [children, activeChildId, setActiveChild])

  const selectedChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  const themeAssets = getThemeAssets(theme.id)
  const isDarkTheme = theme.id === 'space'

  // --- Styles ---
  // Shared style for the top circular buttons
  const topButtonStyle = {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text,
    backdropFilter: 'blur(10px)',
    height: '72px',
    width: '72px',
    borderRadius: '9999px',
    border: `4px solid ${theme.colors.accent}`,
    boxShadow: `0 0 20px ${theme.colors.primary}`,
    flexShrink: 0,
    boxSizing: 'border-box' as const, // CRITICAL FIX: Ensures padding/border doesn't expand size
  }

  // Shared style for the big action buttons
  const getBigButtonStyle = (baseColor: string) => ({
    backgroundColor: baseColor,
    color: isDarkTheme ? '#000' : '#FFF',
    fontFamily: '"Fredoka", "Comic Sans MS", sans-serif',
    fontWeight: 700,
    borderRadius: theme.id === 'space' ? '50px' : '24px',
    border:
      theme.id === 'space'
        ? `3px solid ${baseColor}`
        : `4px solid ${theme.colors.accent}`,
    boxShadow:
      theme.id === 'space'
        ? `0 0 20px ${baseColor}40`
        : `0 6px 0 ${theme.colors.accent}`,
    boxSizing: 'border-box' as const,
  })

  // --- Main Render ---
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center transition-colors duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      {/* Device Frame */}
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
        {/* FIX: w-full + justify-end guarantees right alignment */}
        <div className="absolute top-0 z-50 flex w-full justify-end gap-3 p-4">
          {/* Switch Profile Link */}
          <Link
            to="/settings/manage-children"
            className="flex items-center justify-center transition hover:opacity-80"
            style={topButtonStyle}
            aria-label="Switch Profile"
          >
            {themeAssets.switchProfileIcon ? (
              <img
                src={themeAssets.switchProfileIcon}
                alt="Switch Child"
                // FIX: h-9 balances visually against the Exit icon
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="text-2xl">👥</span>
            )}
          </Link>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center justify-center transition hover:opacity-80"
            style={topButtonStyle}
            aria-label="Logout"
          >
            {themeAssets.exitIcon ? (
              <img
                src={themeAssets.exitIcon}
                alt="Logout"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-2xl">🚪</span>
            )}
          </button>
        </div>

        {/* Content Area */}
        {/* Spec: 24px edge padding (prototype/style guide) */}
        <div
          className="flex flex-1 flex-col p-6 pt-28"
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

          {/* Star Balance */}
          <section
            className="relative z-10 mt-[50px] mb-[50px] transform rounded-3xl p-6 text-center transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: `0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40`,
              border: `5px solid ${theme.colors.primary}`,
            }}
          >
            <h2 className="mb-2 text-sm font-semibold tracking-[3px] uppercase opacity-70">
              Your Stars
            </h2>
            <div className="flex items-center justify-center gap-3">
              <span className="star-bounce text-[56px]">⭐</span>
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.heading,
                  textShadow:
                    theme.id === 'space'
                      ? `0 0 20px ${theme.colors.primary}80`
                      : `2px 2px 0px ${theme.colors.accent}`,
                }}
              >
                {selectedChild?.totalStars || 0}
              </span>
            </div>
          </section>

          {/* Main Actions */}
          <nav className="relative z-10 grid grid-cols-1 gap-6">
            {/* TASKS BUTTON */}
            <Link to="/settings/manage-tasks" className="group">
              <button
                type="button"
                className="flex h-[88px] w-full items-center justify-between px-6 text-[28px] font-bold transition-all"
                style={getBigButtonStyle(theme.colors.secondary)}
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

            {/* REWARDS BUTTON */}
            <Link to="/settings/manage-rewards" className="group">
              <button
                type="button"
                className="flex h-[88px] w-full items-center justify-between px-6 text-[28px] font-bold transition-all"
                style={getBigButtonStyle(theme.colors.primary)}
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
