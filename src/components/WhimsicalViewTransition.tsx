import {
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  useRef,
  type ReactNode,
} from 'react'
import { ActivityTabVisibleContext } from '../contexts/ActivityTabContext'
import './WhimsicalViewTransition.css'

export default function WhimsicalViewTransition({
  open,
  onExited,
  overlap = false,
  animateOnMount = false,
  revealOnOpen = false,
  children,
}: {
  open: boolean
  onExited?: () => void
  overlap?: boolean
  animateOnMount?: boolean
  revealOnOpen?: boolean
  children: ReactNode
}) {
  const tabVisible = useContext(ActivityTabVisibleContext)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open || !revealOnOpen || !tabVisible) return
    // Wait for the outgoing panel to collapse before measuring the new position.
    const timer = window.setTimeout(
      () => {
        const panel = root.current
        const scroller = panel?.closest<HTMLElement>('.app-scroll-region')
        if (!panel || !scroller) return
        const padding =
          parseFloat(
            getComputedStyle(scroller.firstElementChild!).paddingTop
          ) || 24
        scroller.scrollTo({
          top:
            scroller.scrollTop +
            panel.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top -
            padding,
          behavior: 'instant',
        })
      },
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 450
    )
    return () => window.clearTimeout(timer)
  }, [open, revealOnOpen, tabVisible])
  const [motion, setMotion] = useState({
    open,
    enter: animateOnMount,
    active: animateOnMount,
  })
  if (motion.open !== open || (!tabVisible && motion.active)) {
    setMotion({
      open,
      enter: tabVisible && open && motion.open !== open,
      active: tabVisible && motion.open !== open,
    })
  }
  const [hidden, setHidden] = useState(!open)
  if (open && hidden) setHidden(false)
  const finish = () => {
    if (open) return
    setHidden(true)
    onExited?.()
  }
  const finishExit = useEffectEvent(finish)
  useEffect(() => {
    if (!motion.active) return
    // Only arm starting-style for an explicit opening. Leaving it armed would
    // replay the poof whenever an ancestor tab becomes visible again.
    const timer = window.setTimeout(() => {
      setMotion((current) => ({ ...current, enter: false, active: false }))
    }, 450)
    return () => window.clearTimeout(timer)
  }, [motion.open, motion.active])
  useEffect(() => {
    if (open) return
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    // Also finish when the panel is offscreen or transitions are unavailable.
    const timer = window.setTimeout(
      () => finishExit(),
      motion?.matches || !tabVisible ? 0 : 450
    )
    const onMotionChange = () => {
      if (motion?.matches) finishExit()
    }
    motion?.addEventListener('change', onMotionChange)
    return () => {
      window.clearTimeout(timer)
      motion?.removeEventListener('change', onMotionChange)
    }
  }, [open, tabVisible])

  return (
    <div
      ref={root}
      className={
        overlap
          ? 'whimsical-view-transition whimsical-view-transition--overlap'
          : 'whimsical-view-transition'
      }
      hidden={hidden}
      data-open={open}
      data-enter={motion.enter && tabVisible}
      data-animate={motion.active && tabVisible}
      aria-hidden={!open}
      inert={!open}
      onTransitionEnd={(event) => {
        if (
          !open &&
          event.target === event.currentTarget &&
          event.propertyName === 'grid-template-rows'
        ) {
          finish()
        }
      }}
    >
      <div className="whimsical-view-transition__clip">
        <div className="whimsical-view-transition__surface">{children}</div>
      </div>
    </div>
  )
}
