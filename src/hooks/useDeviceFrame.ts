import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { uiTokens } from '../tokens'

export const getBrowserFrameHeight = (isNativePlatform: boolean) => {
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

export const useDeviceFrame = () => {
  const isNativePlatform = Capacitor.isNativePlatform()
  const [browserFrameHeight, setBrowserFrameHeight] = useState<number>(() =>
    getBrowserFrameHeight(isNativePlatform)
  )

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

  return { isNativePlatform, browserFrameHeight }
}
