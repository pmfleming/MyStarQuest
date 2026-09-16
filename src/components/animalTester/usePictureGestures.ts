import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

const PICTURE_CLICK_DELAY_MS = 500

export function usePictureGestures({
  onActivate,
  onToggleZoom,
  expanded,
  resetKey,
}: {
  onActivate?: () => void
  onToggleZoom: () => void
  expanded: boolean
  resetKey?: string
}) {
  const pendingClick = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelClick = useCallback(() => {
    if (pendingClick.current !== null) clearTimeout(pendingClick.current)
    pendingClick.current = null
  }, [])

  // A delayed click must never act on the next creature or a departed screen.
  useEffect(() => cancelClick, [cancelClick, resetKey])

  return {
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      cancelClick()
      if (event.detail === 0) {
        // Keyboard/assistive activation has no competing pointer double-click.
        ;(onActivate ?? onToggleZoom)()
      } else if (event.detail === 1 && onActivate) {
        pendingClick.current = setTimeout(() => {
          pendingClick.current = null
          onActivate()
        }, PICTURE_CLICK_DELAY_MS)
      }
    },
    onDoubleClick: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      cancelClick()
      onToggleZoom()
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (
        (event.key === 'Escape' && expanded) ||
        event.key.toLowerCase() === 'z'
      ) {
        event.preventDefault()
        cancelClick()
        onToggleZoom()
      }
    },
    'aria-expanded': expanded,
    'aria-description': `${onActivate ? 'Click or tap to switch. Enter or Space also switches. ' : ''}Double-click or press Z to enlarge or restore this picture. Press Escape to restore.`,
  }
}
