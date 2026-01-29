import { useState, useMemo, useRef, useEffect } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'
import starSvgUrl from '../assets/global/star.svg'

type StarInfoBoxProps = {
  theme: Theme
  totalStars: number
}

// Animation timing constants
const PHASE_DURATION = 1800 // ms for both swarm out AND gather back
const PAUSE_DURATION = 500 // ms pause between swarm and gather

type StarState = 'hidden' | 'swarming' | 'swarmed' | 'gathering' | 'gathered'
type HeroState = 'hidden' | 'growing' | 'pulsing'

// Mini star for the swarm animation - uses the global star.svg
const MiniStar = ({
  targetPos,
  starState,
  index,
}: {
  targetPos: { x: number; y: number; rot: number }
  starState: StarState
  index: number
}) => {
  const getTransform = () => {
    switch (starState) {
      case 'hidden':
        return 'translate(0px, 0px) scale(0.1)'
      case 'swarming':
      case 'swarmed':
        return `translate(${targetPos.x}px, ${targetPos.y}px) rotate(${targetPos.rot}deg) scale(1)`
      case 'gathering':
        // Keep scale at 1 during gathering - stars stay visible until they merge
        return 'translate(0px, 0px) rotate(0deg) scale(1)'
      case 'gathered':
        return 'translate(0px, 0px) scale(0)'
      default:
        return 'translate(0px, 0px) scale(0)'
    }
  }

  const getTransition = () => {
    switch (starState) {
      case 'hidden':
        return 'none'
      case 'swarming':
        return `transform ${PHASE_DURATION}ms cubic-bezier(0.55, 0, 1, 0.45)`
      case 'swarmed':
        return 'none'
      case 'gathering':
        return `transform ${PHASE_DURATION}ms cubic-bezier(0.55, 0, 1, 0.45)`
      case 'gathered':
        return 'transform 0.05s, opacity 0.05s'
      default:
        return 'none'
    }
  }

  const getOpacity = () => {
    if (starState === 'hidden') return 0
    if (starState === 'gathered') return 0
    return 1
  }

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
        transform: getTransform(),
        transition: getTransition(),
        opacity: getOpacity(),
        transitionDelay: starState === 'swarming' ? `${index * 12}ms` : '0ms',
        zIndex: 20, // Above the hero star so they're visible during gathering
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

const StarInfoBox = ({ theme, totalStars }: StarInfoBoxProps) => {
  const [starStates, setStarStates] = useState<StarState[]>([])
  const [heroState, setHeroState] = useState<HeroState>('hidden')
  const [showResult, setShowResult] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(totalStars)

  const starsSpawnedRef = useRef(0)
  const prevTotalStarsRef = useRef(totalStars)

  // Generate pseudo-random looking positions constrained to fit within the box
  const starPositions = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
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
  }, [])

  const runAnimation = (targetCount: number) => {
    if (isRunning) return

    setIsRunning(true)
    setShowResult(false)
    setHeroState('hidden')
    starsSpawnedRef.current = 0

    const visualCount = Math.min(targetCount, 50)

    // Initialize all stars as hidden
    setStarStates(Array(visualCount).fill('hidden'))

    // Phase 1: Spawn stars one by one (they swarm outward)
    const spawnInterval = setInterval(() => {
      starsSpawnedRef.current += 1
      const spawned = starsSpawnedRef.current

      setStarStates((prev) => {
        const next = [...prev]
        if (spawned <= visualCount) {
          next[spawned - 1] = 'swarming'
        }
        return next
      })

      if (spawned >= visualCount) {
        clearInterval(spawnInterval)

        // After swarm animation completes, mark as swarmed
        setTimeout(() => {
          setStarStates(Array(visualCount).fill('swarmed'))

          // Phase 2: After pause, start gathering
          setTimeout(() => {
            setHeroState('growing')
            setStarStates(Array(visualCount).fill('gathering'))

            // Phase 3: After gather completes, stars have merged
            setTimeout(() => {
              setStarStates(Array(visualCount).fill('gathered'))
              setHeroState('pulsing')
              setShowResult(true)
              setDisplayedCount(targetCount)
              setIsRunning(false)
            }, PHASE_DURATION + 100)
          }, PAUSE_DURATION)
        }, PHASE_DURATION)
      }
    }, 35)
  }

  // Trigger animation when totalStars changes OR on initial mount
  useEffect(() => {
    // Skip animation if totalStars is 0 (data not loaded yet)
    if (totalStars === 0) {
      setDisplayedCount(0)
      setHeroState('pulsing')
      setShowResult(true)
      return
    }

    if (totalStars !== prevTotalStarsRef.current) {
      prevTotalStarsRef.current = totalStars
      runAnimation(totalStars)
    } else if (!isRunning) {
      // Initial page visit with data ready - run animation
      runAnimation(totalStars)
    }
  }, [totalStars])

  const handleClick = () => {
    if (!isRunning) {
      runAnimation(totalStars)
    }
  }

  return (
    <section
      className="relative z-10 transform rounded-3xl text-center transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: theme.colors.surface,
        boxShadow: `0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40`,
        border: `5px solid ${theme.colors.primary}`,
        marginBottom: `${uiTokens.singleVerticalSpace}px`,
        height: '180px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={handleClick}
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
          gap: '12px',
        }}
      >
        {/* Mini Stars */}
        {starStates.map((state, i) => (
          <MiniStar
            key={i}
            index={i}
            targetPos={starPositions[i]}
            starState={state}
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
        {showResult && (
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
            {displayedCount}
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
