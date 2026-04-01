import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTheme } from '../contexts/ThemeContext'
import {
  appTabs,
  getTabIdForPath,
  getTabIndex,
  type AppTabId,
} from '../lib/tabNavigation'
import { uiTokens } from '../tokens'
import BottomNav from '../components/ui/BottomNav'

// Import tab pages directly to pre-render them
import DashboardPage from '../pages/DashboardPage'
import RewardsPage from '../pages/RewardsPage'
import TimeExplorerPage from '../pages/TimeExplorerPage'

const TAB_TRANSITION_MS = uiTokens.tabTransitionMs

type AnimationState = {
  isAnimating: boolean
  exitingTabId: string | null
  incomingTabId: string | null
  progress: number // 1.0 (start) to 0.0 (end/centered)
  direction: number // 1 for slide from right, -1 for slide from left
}

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

const AnimatedTabLayout = () => {
  const { theme } = useTheme()
  const location = useLocation()
  const isNativePlatform = Capacitor.isNativePlatform()

  const [browserFrameHeight, setBrowserFrameHeight] = useState<number>(() =>
    getBrowserFrameHeight(isNativePlatform)
  )

  const activeTabId = getTabIdForPath(location.pathname)
  // We use displayTabId to keep the UI showing the "current" tab
  // until the animation state is initialized in the useEffect.
  const [displayTabId, setDisplayTabId] = useState<AppTabId | null>(activeTabId)

  const [animState, setAnimState] = useState<AnimationState>({
    isAnimating: false,
    exitingTabId: null,
    incomingTabId: null,
    progress: 0,
    direction: 1,
  })

  // Resize handler
  useEffect(() => {
    if (isNativePlatform || typeof window === 'undefined') return
    const update = () => setBrowserFrameHeight(getBrowserFrameHeight(false))
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [isNativePlatform])

  // Handle URL navigation (Bottom Nav)
  useEffect(() => {
    const prevTabId = displayTabId
    const nextTabId = activeTabId

    if (prevTabId === nextTabId || !prevTabId || !nextTabId) {
      return
    }

    const prevIndex = getTabIndex(prevTabId as AppTabId)
    const nextIndex = getTabIndex(nextTabId as AppTabId)
    const direction = nextIndex >= prevIndex ? 1 : -1

    // Update both together to trigger a single re-render with animation state
    setDisplayTabId(nextTabId)
    setAnimState({
      isAnimating: true,
      exitingTabId: prevTabId,
      incomingTabId: nextTabId,
      progress: 1.0,
      direction,
    })

    const startTime = performance.now()

    const animate = (time: number) => {
      const elapsed = time - startTime
      const rawProgress = 1.0 - elapsed / TAB_TRANSITION_MS
      const currentProgress = Math.max(0, rawProgress)

      setAnimState((prev) => ({ ...prev, progress: currentProgress }))

      if (currentProgress > 0) {
        requestAnimationFrame(animate)
      } else {
        setAnimState({
          isAnimating: false,
          exitingTabId: null,
          incomingTabId: null,
          progress: 0,
          direction: 1,
        })
      }
    }

    requestAnimationFrame(animate)
  }, [activeTabId, displayTabId])

  // Pre-render pages
  const renderTab = (tabId: string) => {
    switch (tabId) {
      case 'dashboard':
        return <DashboardPage />
      case 'rewards':
        return <RewardsPage />
      case 'time-explorer':
        return <TimeExplorerPage />
      default:
        return null
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
        <div
          className="relative min-h-0 flex-1 overflow-hidden"
          style={{ touchAction: 'pan-y' }}
        >
          {appTabs.map((tab) => {
            const isActive = tab.id === displayTabId
            const isExiting = tab.id === animState.exitingTabId
            const isIncoming = tab.id === animState.incomingTabId

            // If not part of current or animation, hide
            if (!isActive && !isExiting && !isIncoming) {
              return null
            }

            let opacity = 1
            let transform = 'none'
            let zIndex = 1

            if (isExiting) {
              opacity = animState.progress // Tied fade
              zIndex = 1
            } else if (isIncoming) {
              opacity = 1
              transform = `translateX(${animState.progress * 100 * animState.direction}%)`
              zIndex = 2
            } else if (
              isActive &&
              !animState.incomingTabId &&
              !animState.exitingTabId
            ) {
              opacity = 1
              transform = 'none'
              zIndex = 1
            } else if (
              isActive &&
              (animState.incomingTabId || animState.exitingTabId)
            ) {
              // During transition, the active tab is handled via isExiting
              return null
            }

            return (
              <div
                key={tab.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity,
                  transform,
                  zIndex,
                  willChange: 'transform, opacity',
                  pointerEvents: isExiting || isIncoming ? 'none' : 'auto',
                }}
              >
                {renderTab(tab.id)}
              </div>
            )
          })}
        </div>

        {activeTabId && <BottomNav theme={theme} activeTabId={activeTabId} />}
      </div>
    </div>
  )
}

export default AnimatedTabLayout
