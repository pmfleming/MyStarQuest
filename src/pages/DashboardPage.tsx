import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import ActionButton from '../components/ActionButton'
import StarInfoBox from '../components/StarInfoBox'
import { uiTokens } from '../ui/tokens'

// --- Assets ---
import {
  princessActiveIcon,
  princessChildrenIcon,
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
    <PageShell theme={theme}>
      <div
        className="mx-auto w-full"
        style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
      >
        <PageHeader
          title={selectedChild?.displayName || 'Explorer'}
          fontFamily={theme.fonts.heading}
          marginBottom={uiTokens.doubleVerticalSpace}
          right={
            <>
              <TopIconButton
                theme={theme}
                to="/settings/manage-children"
                ariaLabel="Children"
                icon={
                  themeAssets.switchProfileIcon ? (
                    <img
                      src={themeAssets.switchProfileIcon}
                      alt="Children"
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">👥</span>
                  )
                }
              />
              <TopIconButton
                theme={theme}
                onClick={logout}
                ariaLabel="Exit"
                icon={
                  themeAssets.exitIcon ? (
                    <img
                      src={themeAssets.exitIcon}
                      alt="Exit"
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">🚪</span>
                  )
                }
              />
            </>
          }
        />

        {/* Star Balance */}
        <StarInfoBox
          theme={theme}
          totalStars={selectedChild?.totalStars || 0}
        />

        {/* Main Actions */}
        <nav
          className="relative z-10 grid grid-cols-1"
          style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
        >
          <ActionButton
            to="/today"
            label="Today"
            icon={
              theme.id === 'princess' ? (
                <img
                  src={princessActiveIcon}
                  alt="Today"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span>✅</span>
              )
            }
            theme={theme}
            color={theme.colors.primary}
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
            color={theme.colors.secondary}
          />
        </nav>
      </div>
    </PageShell>
  )
}

export default DashboardPage
