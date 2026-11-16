import { useRef, useState, type UIEvent } from 'react'

export function useScrollHeader(height: number, active = true) {
  const headerRef = useRef<HTMLDivElement>(null)
  const previousTop = useRef(0)
  const travel = height + 24
  const [visibility, setVisibility] = useState({ active, offset: 0 })
  // Retained tabs should reopen with their controls available, without resetting
  // their content or scroll position.
  if (visibility.active !== active) {
    setVisibility({ active, offset: 0 })
  }

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!active || event.target !== event.currentTarget) return
    const element = event.currentTarget
    const max = Math.max(0, element.scrollHeight - element.clientHeight)
    const top = Math.max(0, Math.min(element.scrollTop, max))
    const delta = top - previousTop.current
    previousTop.current = top
    // Keep keyboard-focused controls available while the page scrolls.
    const reveal =
      top === 0 || !!headerRef.current?.querySelector(':focus-visible')
    // Accumulate only the distance travelled since the previous event, clamped
    // to the bar's height. Reversing scroll reveals it immediately, even far
    // down the page. No time-based transition: the bar stays under the finger.
    setVisibility((current) => {
      const offset = reveal
        ? 0
        : Math.max(0, Math.min(travel, current.offset + delta))
      return current.offset === offset ? current : { active, offset }
    })
  }

  return {
    headerRef,
    progress:
      visibility.active === active
        ? Math.min(1, visibility.offset / travel)
        : 0,
    onScroll,
  }
}
