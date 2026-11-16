import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import starSvgUrl from '../../assets/global/star.svg'
import './StarInfoBox.css'

type StarInfoBoxProps = {
  theme: Theme
  totalStars: number
  childName?: string
  avatarControl?: ReactNode
}

// Animation timing constants
const PHASE_DURATION = 1800 // ms for both swarm out AND gather back
const PAUSE_DURATION = 500 // ms pause between swarm and gather

type StarState = 'hidden' | 'swarming' | 'swarmed' | 'gathering' | 'gathered'
type HeroState = 'hidden' | 'growing' | 'pulsing'
type StarTransition = {
  property: string
  duration: string
  timingFunction: string
  opacity: number
  hero: HeroState
  transform: string | null
}

const STAR_TRANSITIONS: Record<StarState, StarTransition> = {
  hidden: {
    opacity: 0,
    hero: 'hidden',
    transform: 'translate(0px, 0px) scale(0.1)',
    property: 'none',
    duration: '0s',
    timingFunction: 'ease',
  },
  swarming: {
    opacity: 1,
    hero: 'hidden',
    transform: null,
    property: 'transform',
    duration: `${PHASE_DURATION}ms`,
    timingFunction: 'cubic-bezier(0.55, 0, 1, 0.45)',
  },
  swarmed: {
    opacity: 1,
    hero: 'hidden',
    transform: null,
    property: 'none',
    duration: '0s',
    timingFunction: 'ease',
  },
  gathering: {
    opacity: 1,
    hero: 'growing',
    transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
    property: 'transform',
    duration: `${PHASE_DURATION}ms`,
    timingFunction: 'cubic-bezier(0.55, 0, 1, 0.45)',
  },
  gathered: {
    opacity: 0,
    hero: 'pulsing',
    transform: 'translate(0px, 0px) scale(0)',
    property: 'transform, opacity',
    duration: '0.05s, 0.05s',
    timingFunction: 'ease, ease',
  },
}

const MiniStar = ({
  targetPos,
  starState,
  index,
}: {
  targetPos: { x: number; y: number; rot: number }
  starState: StarState
  index: number
}) => {
  const transition = STAR_TRANSITIONS[starState]

  return (
    <span
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '14px',
        height: '14px',
        marginTop: '-7px',
        marginLeft: '-7px',
        transform:
          transition.transform ??
          `translate(${targetPos.x}px, ${targetPos.y}px) rotate(${targetPos.rot}deg) scale(1)`,
        transitionProperty: transition.property,
        transitionDuration: transition.duration,
        transitionTimingFunction: transition.timingFunction,
        opacity: transition.opacity,
        transitionDelay: starState === 'swarming' ? `${index * 12}ms` : '0ms',
        zIndex: 20,
      }}
    >
      <img
        src={starSvgUrl}
        alt=""
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      />
    </span>
  )
}

type Animation = { phase: StarState; spawned: number; count: number }

const starPositions = Array.from({ length: 50 }, (_, i) => {
  const goldenAngle = 137.508
  const angle = i * goldenAngle
  // Smaller radius to fit within the component frame
  const baseRadius = 30 + i * 1.2
  const radiusVariation = Math.sin(i * 0.7) * 8 + Math.cos(i * 1.3) * 5
  const radius = Math.min(baseRadius + radiusVariation, 48)
  const rot = (i * 47 + Math.sin(i * 2.1) * 180) % 360

  return {
    x: Math.cos((angle * Math.PI) / 180) * radius,
    y: Math.sin((angle * Math.PI) / 180) * radius,
    rot: rot,
  }
})

function useStarAnimation(totalStars: number) {
  const [animation, setAnimation] = useState<Animation>({
    phase: 'hidden',
    spawned: 0,
    count: totalStars,
  })
  const spawnTimer = useRef<ReturnType<typeof setInterval>>(undefined)
  const phaseTimers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const cancel = useCallback(() => {
    clearInterval(spawnTimer.current)
    phaseTimers.current.forEach(clearTimeout)
    phaseTimers.current.clear()
  }, [])

  const replay = useCallback(() => {
    cancel()
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAnimation({ phase: 'gathered', spawned: 0, count: totalStars })
      return
    }
    const visualCount = Math.max(1, Math.min(totalStars, 50))
    setAnimation({ phase: 'hidden', spawned: 0, count: totalStars })
    let spawned = 0
    spawnTimer.current = setInterval(() => {
      spawned += 1
      setAnimation({ phase: 'swarming', spawned, count: totalStars })
      if (spawned < visualCount) return
      clearInterval(spawnTimer.current)
      // All deadlines share the end of spawning; no nested phase callbacks.
      const phases: [StarState, number][] = [
        ['swarmed', PHASE_DURATION],
        ['gathering', PHASE_DURATION + PAUSE_DURATION],
        ['gathered', 2 * PHASE_DURATION + PAUSE_DURATION + 100],
      ]
      for (const [phase, delay] of phases) {
        const timer = setTimeout(() => {
          phaseTimers.current.delete(timer)
          setAnimation({ phase, spawned, count: totalStars })
        }, delay)
        phaseTimers.current.add(timer)
      }
    }, 35)
  }, [totalStars, cancel])

  useEffect(() => {
    const frame = requestAnimationFrame(replay)
    return () => {
      cancelAnimationFrame(frame)
      cancel()
    }
  }, [totalStars, replay, cancel])

  return { ...animation, replay }
}

const StarInfoBox = ({
  theme,
  totalStars,
  childName,
  avatarControl,
}: StarInfoBoxProps) => {
  const { phase, spawned, count, replay } = useStarAnimation(totalStars)
  const heroState = STAR_TRANSITIONS[phase].hero
  const visualCount = Math.max(1, Math.min(count, 50))
  const countReady = phase === 'gathered' && count === totalStars

  return (
    <header
      className="star-info"
      aria-label={childName ? `${childName}'s stars` : 'Stars'}
      style={
        {
          '--star-primary': theme.colors.primary,
          '--star-secondary': theme.colors.secondary,
          '--star-accent': theme.colors.accent,
          '--star-surface': theme.colors.surface,
          '--star-heading-font': theme.fonts.heading,
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
        } as CSSProperties
      }
    >
      {avatarControl}
      <div className="star-info__identity" data-visible={countReady}>
        {childName && (
          <h1
            className="star-info__name"
            title={childName}
            aria-hidden={!countReady}
          >
            {childName}
          </h1>
        )}
        <div
          className="star-info__total"
          role="status"
          aria-label={countReady ? `${totalStars} stars` : undefined}
        >
          <span
            className="star-info__count"
            data-visible={countReady}
            aria-hidden={!countReady}
          >
            {totalStars}
          </span>
        </div>
        <span className="star-info__text-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
        </span>
      </div>
      <button
        type="button"
        className="star-info__replay"
        aria-label="Replay star animation"
        onClick={replay}
        data-phase={phase}
      >
        <span className="star-info__constellation" aria-hidden="true">
          {starPositions.slice(0, visualCount).map((position, i) => (
            <MiniStar
              key={i}
              index={i}
              targetPos={position}
              starState={i < spawned ? phase : 'hidden'}
            />
          ))}
          <span
            className="star-info__hero"
            data-state={heroState}
            style={{
              opacity: heroState === 'hidden' ? 0 : 1,
              transform:
                heroState === 'hidden'
                  ? 'scale(0) rotate(-25deg)'
                  : 'scale(1) rotate(0deg)',
              transition:
                heroState === 'growing'
                  ? `opacity ${PHASE_DURATION * 0.3}ms ease-out, transform ${PHASE_DURATION}ms cubic-bezier(0.55, 0, 1, 0.45)`
                  : 'transform 180ms ease, opacity 180ms ease',
            }}
          >
            <img src={starSvgUrl} alt="" />
          </span>
          <span
            className="star-info__twinkles"
            data-active={phase === 'gathered'}
          >
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </span>
        </span>
      </button>
    </header>
  )
}

export default StarInfoBox
