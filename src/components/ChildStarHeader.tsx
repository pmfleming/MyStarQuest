import { useContext } from 'react'
import type { ChildProfile } from '../data/types'
import type { Theme } from '../contexts/ThemeContext'
import { ActivityTabVisibleContext } from '../contexts/ActivityTabContext'
import { getSurfaceWidthConstraints } from '../tokens'
import AppMenu from './AppMenu'
import ChildAvatar from './ChildAvatar'
import StarInfoBox from './ui/StarInfoBox'

export const CHILD_STAR_HEADER_HEIGHT = 156

export default function ChildStarHeader({
  child,
  theme,
  onResetToday,
}: {
  child: ChildProfile | null
  theme: Theme
  onResetToday?: () => Promise<void>
}) {
  const isVisible = useContext(ActivityTabVisibleContext)
  return (
    <div style={{ ...getSurfaceWidthConstraints(), margin: '12px auto 0' }}>
      <StarInfoBox
        key={child?.id ?? 'no-child'}
        theme={theme}
        totalStars={child?.totalStars ?? 0}
        childName={child?.displayName || 'Explorer'}
        avatarControl={
          <AppMenu
            key={String(isVisible)}
            theme={theme}
            onResetToday={onResetToday}
            triggerClassName="star-info__avatar"
            trigger={
              <ChildAvatar
                child={child ?? { avatarToken: 'theme', themeId: theme.id }}
                size={128}
              />
            }
          />
        }
      />
    </div>
  )
}
