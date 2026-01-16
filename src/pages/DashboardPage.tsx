import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import TopIconButton from '../components/TopIconButton'
import ActionButton from '../components/ActionButton'
import { uiTokens } from '../ui/tokens'

// --- Assets ---
import {
  princessChildrenIcon,
  princessChoresIcon,
  princessExitIcon,
  princessRewardsIcon,
} from '../assets/themes/princess/assets'
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
  // --- Main Render ---
  return (
    <PageShell
      theme={theme}
      topRight={
        <>
          <TopIconButton
            theme={theme}
            to="/settings/manage-children"
            ariaLabel="Switch Profile"
            icon={
              themeAssets.switchProfileIcon ? (
                <img
                  src={themeAssets.switchProfileIcon}
                  alt="Switch Child"
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <span className="text-2xl">👥</span>
              )
            }
          />
          <TopIconButton
            theme={theme}
            onClick={logout}
            ariaLabel="Logout"
            icon={
              themeAssets.exitIcon ? (
                <img
                  src={themeAssets.exitIcon}
                  alt="Logout"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <span className="text-2xl">🚪</span>
              )
            }
          />
        </>
      }
      contentStyle={{ paddingTop: '112px' }}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
      >
        {/* Header / Profile */}
        <header
          className="relative z-10 flex items-center gap-4"
          style={{ marginBottom: `${uiTokens.sectionGap}px` }}
        >
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
          className="relative z-10 transform rounded-3xl p-6 text-center transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: theme.colors.surface,
            boxShadow: `0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40`,
            border: `5px solid ${theme.colors.primary}`,
            marginBottom: `${uiTokens.sectionGap}px`,
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
        <nav
          className="relative z-10 grid grid-cols-1"
          style={{ gap: `${uiTokens.sectionGap}px` }}
        >
          <ActionButton
            to="/settings/manage-tasks"
            label="Chores"
            icon={
              <img
                src={princessChoresIcon}
                alt="Chores"
                className="h-10 w-10 object-contain"
              />
            }
            theme={theme}
            color={theme.colors.secondary}
          />
          <ActionButton
            to="/settings/manage-rewards"
            label="Rewards"
            icon={
              theme.id === 'princess' ? (
                <img
                  src={princessRewardsIcon}
                  alt="Rewards"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span>🎁</span>
              )
            }
            theme={theme}
            color={theme.colors.primary}
          />
        </nav>
      </div>
    </PageShell>
  )
}

export default DashboardPage
