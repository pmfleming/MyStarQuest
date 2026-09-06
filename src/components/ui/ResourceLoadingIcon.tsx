import { useLayoutEffect, useRef } from 'react'
import './ResourceLoadingIcon.css'

type Props = {
  src: string
  loading: boolean
  label: string
  size?: number
}

/** Clockwise opacity reveal. Pending imports don't expose download percentages. */
const ResourceLoadingIcon = ({ src, loading, label, size = 96 }: Props) => {
  const element = useRef<HTMLSpanElement>(null)
  const progress = useRef(loading ? 0 : 1)

  useLayoutEffect(() => {
    const node = element.current
    if (!node) return
    let frame = 0
    const setProgress = (value: number) => {
      progress.current = value
      node.style.setProperty('--resource-fill-angle', `${value * 360}deg`)
    }
    const reducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reducedMotion) {
      setProgress(loading ? 0 : 1)
      return
    }

    const from = loading ? 0 : progress.current
    setProgress(from)
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      // Hold short of complete until the resource actually resolves.
      const fraction = Math.min(elapsed / (loading ? 4000 : 180), 1)
      setProgress(loading ? 0.9 * fraction : from + (1 - from) * fraction)
      if (fraction < 1) frame = requestAnimationFrame(tick)
    }
    if (loading || from < 1) frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [loading, src])

  return (
    <span
      ref={element}
      className="resource-loading-icon"
      role={loading ? 'status' : undefined}
      aria-label={loading ? label : undefined}
      aria-busy={loading || undefined}
      style={{ width: size, height: size }}
    >
      <img className="resource-loading-icon-base" src={src} alt="" />
      <img className="resource-loading-icon-fill" src={src} alt="" />
    </span>
  )
}

export default ResourceLoadingIcon
