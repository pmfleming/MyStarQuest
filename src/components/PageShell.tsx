import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type CSSProperties,
  type TouchEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../tokens'
import { getAdjacentTabPath, type AppTabId } from '../lib/tabNavigation'
import DragScrollRegion from './ui/DragScrollRegion'
import PageHeader from './PageHeader'
import BottomNav from './ui/BottomNav'

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

const getBrowserFrameHeight = (isNativePlatform: boolean) => {
  if (isNativePlatform || typeof window === 'undefined') {
    return uiTokens.deviceMinHeight
  }

  const outerPadding = 40
  const availableScreenHeight =
    window.screen?.availHeight ?? window.screen?.height
  const visibleViewportHeight =
    window.visualViewport?.height ?? window.innerHeight

  const preferredHeight = availableScreenHeight ?? visibleViewportHeight
  const fittedHeight = Math.max(
    320,
    Math.min(uiTokens.deviceMinHeight, preferredHeight - outerPadding)
  )
  const safeViewportHeight = Math.max(320, visibleViewportHeight - outerPadding)

  return Math.min(fittedHeight, safeViewportHeight)
}

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
  const isNativePlatform = Capacitor.isNativePlatform()
  const [browserFrameHeight, setBrowserFrameHeight] = useState<number>(() =>
    getBrowserFrameHeight(isNativePlatform)
  )
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const effectiveBottomBar =
    bottomBar ||
    (activeTabId && <BottomNav theme={theme} activeTabId={activeTabId} />)

  useEffect(() => {
    if (isNativePlatform || typeof window === 'undefined') return

    const updateBrowserFrameHeight = () => {
      setBrowserFrameHeight(getBrowserFrameHeight(false))
    }

    window.addEventListener('resize', updateBrowserFrameHeight)
    window.visualViewport?.addEventListener('resize', updateBrowserFrameHeight)

    return () => {
      window.removeEventListener('resize', updateBrowserFrameHeight)
      window.visualViewport?.removeEventListener(
        'resize',
        updateBrowserFrameHeight
      )
    }
  }, [isNativePlatform])

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
    <div
      className={`flex w-full overflow-hidden transition-colors duration-500 ${
        isNativePlatform
          ? 'items-stretch justify-start'
          : 'items-center justify-center'
      }`}
      style={{
        height: '100dvh',
        background: isNativePlatform ? theme.colors.bg : '#000',
        padding: isNativePlatform ? '0px' : '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="relative flex w-full flex-col overflow-hidden"
        style={{
          height: isNativePlatform ? '100dvh' : `${browserFrameHeight}px`,
          maxWidth: isNativePlatform ? '100%' : `${uiTokens.deviceMaxWidth}px`,
          borderRadius: isNativePlatform ? '0px' : '40px',
          boxShadow: isNativePlatform
            ? 'none'
            : '0 0 0 12px #1a1a2e, 0 0 0 14px #333',
          background: theme.colors.bg,
          backgroundImage: theme.bgPattern,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
          width: '100%',
        }}
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
            paddingLeft: `${uiTokens.pagePaddingX}px`,
            paddingRight: `${uiTokens.pagePaddingX}px`,
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
      </div>
    </div>
  )
}

export default PageShell
