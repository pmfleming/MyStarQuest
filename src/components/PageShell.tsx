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
import { uiTokens } from '../ui/tokens'
import {
  appTabs,
  getAdjacentTabPath,
  type AppTabId,
} from '../lib/tabNavigation'
import {
  princessCalendarIcon,
  princessChoresIcon,
  princessRewardsIcon,
} from '../assets/themes/princess/assets'
import DragScrollRegion from './DragScrollRegion'
import PageHeader from './PageHeader'

interface PageShellProps {
  theme: Theme
  title?: string
  headerRight?: ReactNode
  topRight?: ReactNode
  bottomBar?: ReactNode
  activeTabId?: AppTabId
  scrollable?: boolean
  contentClassName?: string
  contentStyle?: CSSProperties
  children?: ReactNode
}

const SWIPE_THRESHOLD_PX = 56
const SWIPE_VERTICAL_TOLERANCE_PX = 48

const getTabIcon = (tabId: AppTabId) => {
  if (tabId === 'dashboard') return princessChoresIcon
  if (tabId === 'rewards') return princessRewardsIcon
  if (tabId === 'time-explorer') return princessCalendarIcon
  return princessCalendarIcon
}

const PageShell = ({
  theme,
  title,
  headerRight,
  topRight,
  bottomBar,
  activeTabId,
  scrollable = true,
  contentClassName,
  contentStyle,
  children,
}: PageShellProps) => {
  const navigate = useNavigate()
  const isNativePlatform = Capacitor.isNativePlatform()
  const [browserFrameHeight, setBrowserFrameHeight] = useState<number>(
    uiTokens.deviceMinHeight
  )
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (isNativePlatform || typeof window === 'undefined') return

    const updateBrowserFrameHeight = () => {
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
      const safeViewportHeight = Math.max(
        320,
        visibleViewportHeight - outerPadding
      )

      setBrowserFrameHeight(Math.min(fittedHeight, safeViewportHeight))
    }

    updateBrowserFrameHeight()
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

  const effectiveBottomBar =
    bottomBar ||
    (activeTabId && (
      <nav
        aria-label="Primary tabs"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '12px',
          padding: '14px 18px calc(14px + env(safe-area-inset-bottom, 0px))',
          background: `${theme.colors.surface}f2`,
          borderTop: `3px solid ${theme.colors.accent}`,
          boxShadow: `0 -10px 24px ${theme.colors.primary}22`,
        }}
      >
        {appTabs.map((tab) => {
          const isActive = tab.id === activeTabId

          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '72px',
                borderRadius: '24px',
                border: `3px solid ${isActive ? theme.colors.secondary : theme.colors.accent}`,
                background: isActive
                  ? `linear-gradient(180deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                  : `${theme.colors.bg}cc`,
                boxShadow: isActive
                  ? `0 10px 24px ${theme.colors.primary}44`
                  : `0 6px 16px ${theme.colors.accent}22`,
                cursor: 'pointer',
                transition:
                  'transform 160ms ease, box-shadow 160ms ease, background 160ms ease',
              }}
            >
              <img
                src={getTabIcon(tab.id)}
                alt=""
                aria-hidden="true"
                style={{
                  width: '72px',
                  height: '72px',
                  objectFit: 'contain',
                  opacity: isActive ? 1 : 0.72,
                  filter: isActive
                    ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.22))'
                    : 'none',
                }}
              />
            </button>
          )
        })}
      </nav>
    ))

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
        {topRight && (
          <div
            className="absolute z-50 flex justify-end gap-3"
            style={{
              top: `${uiTokens.pagePaddingTop}px`,
              right: `${uiTokens.pagePaddingX}px`,
            }}
          >
            {topRight}
          </div>
        )}

        <div
          className={
            contentClassName || 'flex min-h-0 flex-1 flex-col overflow-hidden'
          }
          style={{
            paddingLeft: `${uiTokens.pagePaddingX}px`,
            paddingRight: `${uiTokens.pagePaddingX}px`,
            paddingTop: `${uiTokens.pagePaddingTop}px`,
            paddingBottom: `${uiTokens.pagePaddingBottom}px`,
            touchAction: activeTabId ? 'pan-y' : undefined,
            ...contentStyle,
          }}
          onTouchStart={activeTabId ? handleTouchStart : undefined}
          onTouchEnd={activeTabId ? handleTouchEnd : undefined}
        >
          {title && (
            <PageHeader
              title={title}
              right={headerRight}
              fontFamily={theme.fonts.heading}
            />
          )}

          {scrollable ? (
            <DragScrollRegion theme={theme} className="min-h-0 flex-1">
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
