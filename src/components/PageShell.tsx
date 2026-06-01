import {
  useRef,
  type ReactNode,
  type CSSProperties,
  type TouchEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../tokens'
import { getAdjacentTabPath, type AppTabId } from '../lib/tabNavigation'
import DragScrollRegion from './ui/DragScrollRegion'
import PageHeader from './PageHeader'
import BottomNav from './ui/BottomNav'
import { AppDeviceFrame } from './AppDeviceFrame'
import { useDeviceFrame } from '../hooks/useDeviceFrame'

interface PageShellProps {
  theme: Theme
  title?: string
  headerRight?: ReactNode
  bottomBar?: ReactNode
  activeTabId?: AppTabId
  scrollable?: boolean
  contentClassName?: string
  contentStyle?: CSSProperties
  children?: ReactNode
}

const SWIPE_THRESHOLD_PX = 56
const SWIPE_VERTICAL_TOLERANCE_PX = 48

const PageShell = ({
  theme,
  title,
  headerRight,
  bottomBar,
  activeTabId,
  scrollable = true,
  contentClassName,
  contentStyle,
  children,
}: PageShellProps) => {
  const navigate = useNavigate()
  const { isNativePlatform, browserFrameHeight } = useDeviceFrame()
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const effectiveBottomBar =
    bottomBar ||
    (activeTabId && <BottomNav theme={theme} activeTabId={activeTabId} />)

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    touchStartRef.current = null

    const touch = event.changedTouches[0]
    if (!start || !touch) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    if (Math.abs(deltaY) > SWIPE_VERTICAL_TOLERANCE_PX) return
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return

    const nextPath = getAdjacentTabPath(activeTabId!, deltaX < 0 ? 1 : -1)
    if (nextPath) {
      navigate(nextPath)
    }
  }

  return (
    <AppDeviceFrame
      theme={theme}
      isNativePlatform={isNativePlatform}
      browserFrameHeight={browserFrameHeight}
    >
      {title && (
        <PageHeader
          theme={theme}
          title={title}
          right={headerRight}
          fontFamily={theme.fonts.heading}
        />
      )}

      <div
        className={
          contentClassName || 'flex min-h-0 flex-1 flex-col overflow-hidden'
        }
        style={{
          paddingLeft: '0px',
          paddingRight: '0px',
          paddingTop: '0px',
          paddingBottom: `${uiTokens.pagePaddingBottom}px`,
          touchAction: activeTabId ? 'pan-y' : undefined,
          ...contentStyle,
        }}
        onTouchStart={activeTabId ? handleTouchStart : undefined}
        onTouchEnd={activeTabId ? handleTouchEnd : undefined}
      >
        {scrollable ? (
          <DragScrollRegion
            theme={theme}
            className="min-h-0 flex-1"
            topNavPadding={!!title}
            bottomNavPadding={!!activeTabId}
          >
            {children}
          </DragScrollRegion>
        ) : (
          children
        )}
      </div>

      {effectiveBottomBar}
    </AppDeviceFrame>
  )
}

export default PageShell
