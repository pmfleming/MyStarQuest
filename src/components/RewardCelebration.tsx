import { useEffect, useState, type CSSProperties } from 'react'
import { getRewardImage } from '../assets/rewards/assets'
import starSvgUrl from '../assets/global/star.svg'
import type { Theme } from '../contexts/ThemeContext'
import './RewardCelebration.css'

const CELEBRATION_PACE = 1.25

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
}

export default function RewardCelebration({
  reward,
  theme,
  onComplete,
}: Props) {
  const [reducedMotion] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  const [balance, setBalance] = useState(
    reducedMotion ? reward.starsAfter : reward.starsBefore
  )
  const image = getRewardImage(reward.imageKey)
  const starCount = Math.min(
    7,
    Math.ceil(reward.starsBefore - reward.starsAfter)
  )

  useEffect(() => {
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
  }, [reward, reducedMotion, onComplete])

  return (
    <div
      className="reward-celebration"
      role="status"
      aria-label={`${reward.title} purchased`}
      style={
        {
          '--reward-primary': theme.colors.primary,
          '--reward-pace': CELEBRATION_PACE,
          '--reward-accent': theme.colors.accent,
          color: theme.colors.text,
          background: theme.colors.surface,
        } as CSSProperties
      }
    >
      <span className="sr-only">
        {reward.starsBefore - reward.starsAfter} stars spent.{' '}
        {reward.starsAfter} stars remaining.
      </span>
      <div className="reward-celebration__balance" aria-hidden="true">
        <img src={starSvgUrl} alt="" />
        <strong style={{ fontFamily: theme.fonts.heading }}>{balance}</strong>
      </div>
      <div className="reward-celebration__stage" aria-hidden="true">
        <div className="reward-celebration__halo" />
        <div className="reward-celebration__art">
          {image ? (
            <img src={image} alt="" />
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
            style={
              {
                '--star-curve': `${(index % 2 === 0 ? 1 : -1) * (15 + index * 3)}px`,
                animationDelay: `${(150 + index * 80) * CELEBRATION_PACE}ms`,
              } as CSSProperties
            }
          />
        ))}
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className="reward-celebration__sparkle"
            style={
              {
                '--sparkle-x': `${Math.cos((index * Math.PI) / 4) * 48}px`,
                '--sparkle-y': `${Math.sin((index * Math.PI) / 4) * 40}px`,
                animationDelay: `${(1150 + index * 35) * CELEBRATION_PACE}ms`,
              } as CSSProperties
            }
          >
            ✦
          </span>
        ))}
      </div>
    </div>
  )
}
