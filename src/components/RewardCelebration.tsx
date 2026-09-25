import { useEffect, useState, type CSSProperties } from 'react'
import ImageWithOverlay from './ui/ImageWithOverlay'
import starSvgUrl from '../assets/global/star.svg'
import type { Theme } from '../contexts/ThemeContext'
import './RewardCelebration.css'

const CELEBRATION_PACE = 1.25
type CelebrationStyle = CSSProperties & Record<`--${string}`, string | number>
const celebrationStyle = (style: CelebrationStyle): CSSProperties => style
const modes = {
  earned: {
    action: 'completed',
    stars: 'earned',
    balance: 'total',
    sparkleDelay: 1850,
  },
  purchase: {
    action: 'purchased',
    stars: 'spent',
    balance: 'remaining',
    sparkleDelay: 1150,
  },
}

export interface RewardCelebrationDetails {
  title: string
  imageKey?: string
  starsBefore: number
  starsAfter: number
}

interface Props {
  reward: RewardCelebrationDetails
  theme: Theme
  onComplete: () => void
  mode?: 'purchase' | 'earned'
  imageSrc?: string
  overlayImage?: string
  finished?: boolean
}

export default function RewardCelebration({
  reward,
  theme,
  onComplete,
  mode = 'purchase',
  imageSrc,
  overlayImage,
  finished = false,
}: Props) {
  const [reducedMotion] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  const [balance, setBalance] = useState(
    reducedMotion ? reward.starsAfter : reward.starsBefore
  )
  const earned = mode === 'earned'
  const labels = modes[mode]
  const starDifference = Math.abs(reward.starsBefore - reward.starsAfter)
  const starCount = Math.min(7, Math.ceil(starDifference))

  useEffect(() => {
    if (finished) return
    let frame = 0
    let start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const progress = Math.max(
        0,
        Math.min(1, ((now - start) / CELEBRATION_PACE - 150) / 950)
      )
      setBalance(
        Math.round(
          reward.starsBefore +
            (reward.starsAfter - reward.starsBefore) * progress
        )
      )
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    if (!reducedMotion) frame = requestAnimationFrame(tick)
    const finishTimer = setTimeout(onComplete, 2800 * CELEBRATION_PACE)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(finishTimer)
    }
  }, [reward, reducedMotion, onComplete, finished])

  return (
    <div
      className={
        earned
          ? 'reward-celebration reward-celebration--earned'
          : 'reward-celebration'
      }
      role="status"
      aria-label={finished ? 'All done!' : `${reward.title} ${labels.action}`}
      style={celebrationStyle({
        '--reward-primary': theme.colors.primary,
        '--reward-pace': CELEBRATION_PACE,
        '--reward-accent': theme.colors.accent,
        color: theme.colors.text,
        background: earned ? 'transparent' : theme.colors.surface,
      })}
    >
      <span className="sr-only">
        {starDifference} stars {labels.stars}. {reward.starsAfter} stars{' '}
        {labels.balance}.
      </span>
      <div className="reward-celebration__balance" aria-hidden="true">
        <img src={starSvgUrl} alt="" />
        <strong style={{ fontFamily: theme.fonts.heading }}>{balance}</strong>
      </div>
      <div className="reward-celebration__stage" aria-hidden="true">
        <div className="reward-celebration__halo" />
        <div className="reward-celebration__art">
          {imageSrc ? (
            <ImageWithOverlay
              src={imageSrc}
              alt=""
              overlayImage={overlayImage}
            />
          ) : (
            <span className="reward-celebration__gift">🎁</span>
          )}
        </div>
        {Array.from({ length: starCount }, (_, index) => (
          <img
            key={index}
            src={starSvgUrl}
            alt=""
            className="reward-celebration__star"
            style={celebrationStyle({
              '--star-curve': `${(index % 2 === 0 ? 1 : -1) * (15 + index * 3)}px`,
              animationDelay: `${(150 + index * 80) * CELEBRATION_PACE}ms`,
            })}
          />
        ))}
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className="reward-celebration__sparkle"
            style={celebrationStyle({
              '--sparkle-x': `${Math.cos((index * Math.PI) / 4) * 48}px`,
              '--sparkle-y': `${Math.sin((index * Math.PI) / 4) * 40}px`,
              animationDelay: `${(labels.sparkleDelay + index * 35) * CELEBRATION_PACE}ms`,
            })}
          >
            ✦
          </span>
        ))}
      </div>
    </div>
  )
}
