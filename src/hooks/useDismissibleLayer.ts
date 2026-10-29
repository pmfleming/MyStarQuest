import { useEffect, useEffectEvent, type RefObject } from 'react'

/** Keep outside/Escape dismissal and optional focus ownership in one lifetime. */
export function useDismissibleLayer({
  ref,
  onDismiss,
  active = true,
  autoFocus = false,
  dismissOnClick = false,
}: {
  ref: RefObject<HTMLElement | null>
  onDismiss: () => void
  active?: boolean | string | null
  autoFocus?: boolean
  dismissOnClick?: boolean
}) {
  const dismiss = useEffectEvent(onDismiss)
  useEffect(() => {
    if (!active) return
    const layer = ref.current
    const trigger = document.activeElement
    if (autoFocus) layer?.focus({ preventScroll: true })
    const controller = new AbortController()
    const outside = (event: Event) => {
      if (event.target instanceof Node && !layer?.contains(event.target))
        dismiss()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    for (const type of [
      'pointerdown',
      'focusin',
      ...(dismissOnClick ? ['click'] : []),
    ])
      document.addEventListener(type, outside, {
        capture: type !== 'focusin',
        signal: controller.signal,
      })
    document.addEventListener('keydown', escape, { signal: controller.signal })
    return () => {
      controller.abort()
      if (
        autoFocus &&
        (document.activeElement === layer ||
          document.activeElement === document.body) &&
        trigger instanceof HTMLElement &&
        trigger.isConnected
      )
        trigger.focus({ preventScroll: true })
    }
  }, [active, autoFocus, dismissOnClick, ref])
}
