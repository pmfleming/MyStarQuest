import { useState, useRef, useEffect, useCallback } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import starSvgUrl from '../../assets/global/star.svg'

type StarInfoBoxProps = {
  theme: Theme
  totalStars: number
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
    <div
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
    </div>
  )
}

type Animation = { phase: StarState; spawned: number; count: number }

const starPositions = Array.from({ length: 50 }, (_, i) => {
  const goldenAngle = 137.508
  const angle = i * goldenAngle
  // Smaller radius to fit within the component frame
  const baseRadius = 30 + i * 1.2
  const radiusVariation = Math.sin(i * 0.7) * 8 + Math.cos(i * 1.3) * 5
  const radius = Math.min(baseRadius + radiusVariation, 70) // Cap the radius
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
  const running = useRef(false)
  const spawnTimer = useRef<ReturnType<typeof setInterval>>(undefined)
  const phaseTimers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const cancel = useCallback(() => {
    clearInterval(spawnTimer.current)
    phaseTimers.current.forEach(clearTimeout)
    phaseTimers.current.clear()
    running.current = false
  }, [])

  const replay = useCallback(() => {
    if (running.current) return
    running.current = true
    const visualCount = Math.max(0, Math.min(totalStars, 50))
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
          running.current = phase !== 'gathered'
          setAnimation({ phase, spawned, count: totalStars })
        }, delay)
        phaseTimers.current.add(timer)
      }
    }, 35)
  }, [totalStars])

  useEffect(() => {
    if (totalStars !== 0) {
      replay()
      return cancel
    }
    const frame = requestAnimationFrame(() =>
      setAnimation({ phase: 'gathered', spawned: 0, count: 0 })
    )
    return () => {
      cancelAnimationFrame(frame)
      cancel()
    }
  }, [totalStars, replay, cancel])

  return { ...animation, replay }
}

const StarInfoBox = ({ theme, totalStars }: StarInfoBoxProps) => {
  const { phase, spawned, count, replay } = useStarAnimation(totalStars)
  const heroState = STAR_TRANSITIONS[phase].hero
  const visualCount = Math.max(0, Math.min(count, 50))

  return (
    <section
      className="relative z-10 transform text-center transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: theme.colors.surface,
        boxShadow: `0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40`,
        border: `5px solid ${theme.colors.primary}`,
        borderRadius: `${uiTokens.surfaceRadius}px`,
        height: '180px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      role="button"
      tabIndex={0}
      aria-label="Replay star animation"
      onClick={replay}
      onKeyDown={(event) => {
        if (!['Enter', ' '].includes(event.key)) return
        event.preventDefault()
        replay()
      }}
    >
      {/* Animation Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: `${uiTokens.actionRowGap}px`,
        }}
      >
        {/* Mini Stars */}
        {starPositions.slice(0, visualCount).map((position, i) => (
          <MiniStar
            key={i}
            index={i}
            targetPos={position}
            starState={i < spawned ? phase : 'hidden'}
          />
        ))}

        {/* Hero Star - grows during gathering */}
        <div
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            flexShrink: 0,
            zIndex: 10,
            opacity: heroState === 'hidden' ? 0 : 1,
            transform: heroState === 'hidden' ? 'scale(0)' : 'scale(1)',
            transition:
              heroState === 'growing'
                ? `opacity ${PHASE_DURATION * 0.3}ms ease-out, transform ${PHASE_DURATION}ms cubic-bezier(0.55, 0, 1, 0.45)`
                : 'none',
            animation:
              heroState === 'pulsing'
                ? 'pulse-soft 3s infinite ease-in-out'
                : 'none',
          }}
        >
          <img
            src={starSvgUrl}
            alt=""
            style={{ width: '100%', height: '100%', display: 'block' }}
            aria-hidden="true"
          />
        </div>

        {/* Result Number - to the right of the star */}
        {phase === 'gathered' && (
          <div
            style={{
              position: 'relative',
              zIndex: 20,
              fontSize: '52px',
              fontWeight: 900,
              color: theme.colors.primary,
              textShadow: `2px 2px 0px ${theme.colors.accent}`,
              animation:
                'reveal-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              fontFamily: theme.fonts.heading,
            }}
          >
            {count}
          </div>
        )}
      </div>

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes reveal-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-soft {
          0%, 100% { filter: drop-shadow(0 0 10px #fbbf2480); transform: scale(1); }
          50% { filter: drop-shadow(0 0 25px #fbbf24cc); transform: scale(1.05); }
        }
      `}</style>
    </section>
  )
}

export default StarInfoBox
