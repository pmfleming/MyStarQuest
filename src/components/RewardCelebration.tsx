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
  mode?: 'purchase' | 'earned'
  imageSrc?: string
  finished?: boolean
}

export default function RewardCelebration({
  reward,
  theme,
  onComplete,
  mode = 'purchase',
  imageSrc,
  finished = false,
}: Props) {
  const [reducedMotion] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  const [balance, setBalance] = useState(
    reducedMotion ? reward.starsAfter : reward.starsBefore
  )
  const image = imageSrc ?? getRewardImage(reward.imageKey)
  const earned = mode === 'earned'
  const starCount = Math.min(
    7,
    Math.ceil(Math.abs(reward.starsBefore - reward.starsAfter))
  )

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
      aria-label={
        finished
          ? 'All done!'
          : `${reward.title} ${earned ? 'completed' : 'purchased'}`
      }
      style={
        {
          '--reward-primary': theme.colors.primary,
          '--reward-pace': CELEBRATION_PACE,
          '--reward-accent': theme.colors.accent,
          color: theme.colors.text,
          background: earned ? 'transparent' : theme.colors.surface,
        } as CSSProperties
      }
    >
      <span className="sr-only">
        {Math.abs(reward.starsBefore - reward.starsAfter)} stars{' '}
        {earned ? 'earned' : 'spent'}. {reward.starsAfter} stars{' '}
        {earned ? 'total' : 'remaining'}.
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
                animationDelay: `${((earned ? 1850 : 1150) + index * 35) * CELEBRATION_PACE}ms`,
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
