import { useRef, useState } from 'react'
import { uiTokens } from '../../tokens'

const STYLES_ID = 'whimsical-action-list-styles'
const EXIT_DURATION_MS = 400

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const waitForExit = (card: HTMLElement | null) => {
  if (!card || prefersReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const finish = () => {
      card.removeEventListener('animationend', handleAnimationEnd)
      window.clearTimeout(fallbackTimer)
      resolve()
    }
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === card) finish()
    }

    card.addEventListener('animationend', handleAnimationEnd)
    const fallbackTimer = window.setTimeout(finish, EXIT_DURATION_MS + 100)
  })
}

export const injectStandardActionStyles = () => {
  if (document.getElementById(STYLES_ID)) return
  const style = document.createElement('style')
  style.id = STYLES_ID
  style.textContent = `
    @keyframes whimsical-poof {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0) rotate(45deg); opacity: 0; }
    }
    .whimsical-card-exiting {
      animation: whimsical-poof ${EXIT_DURATION_MS}ms ease-in forwards !important;
      pointer-events: none;
    }
    .whimsical-btn {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: pointer;
    }
    .whimsical-btn:hover:not(:disabled) {
      transform: translateY(-3px) scale(1.02);
    }
    .whimsical-btn:active:not(:disabled) {
      transform: scale(0.92) translateY(4px) !important;
    }
    .whimsical-btn-utility:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: #cbd5e1;
      color: #64748b;
    }
    .whimsical-btn-delete:hover:not(:disabled) {
      background: #fef2f2 !important;
      color: #ef4444 !important;
      border-color: #fecaca !important;
    }
    [data-action-theme="princess"] .whimsical-btn-delete:hover:not(:disabled) {
      background: #FCE7F3 !important;
      color: #831843 !important;
      border-color: #C76598 !important;
    }
    @keyframes standard-card-spin {
      to { transform: rotate(360deg); }
    }
    .standard-card-spinner {
      animation: standard-card-spin 0.8s linear infinite;
    }
    .standard-card-primary-hidden:has(.activity-inline-action, .activity-inline-action-row)
      :is(.activity-inline-action, .activity-inline-action-row) {
      width: calc(100% - var(--card-utility-width, ${uiTokens.listUtilityActionWidth}px) - ${uiTokens.actionRowGap}px) !important;
      align-self: flex-start;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
    .standard-card-primary-hidden:has(.activity-inline-action, .activity-inline-action-row)
      [data-card-region="footer"] {
      position: absolute !important;
      right: ${uiTokens.listItemPadding}px;
      bottom: ${uiTokens.listItemPadding}px;
      width: var(--card-utility-width, ${uiTokens.listUtilityActionWidth}px);
    }
    .standard-card-confirming-reset {
      --card-utility-width: ${uiTokens.listUtilityActionWidth * 2 + uiTokens.actionRowGap}px;
    }
    .standard-card-confirming-reset :is(.activity-inline-action, .activity-inline-action-row) {
      filter: grayscale(1);
      opacity: 0.6;
    }
    @media (prefers-reduced-motion: reduce) {
      .whimsical-card,
      .whimsical-card-exiting,
      .whimsical-btn,
      .standard-card-spinner {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

export const useCardExitAnimation = () => {
  const [isExiting, setIsExiting] = useState(false)
  const isExitingRef = useRef(false)
  const cardRef = useRef<HTMLElement>(null)

  const runWithExit = async (
    exits: boolean,
    action: () => Promise<boolean>
  ) => {
    if (isExitingRef.current) return false

    if (exits) {
      isExitingRef.current = true
      const exitFinished = waitForExit(cardRef.current)
      setIsExiting(true)
      await exitFinished
    }

    const succeeded = await action()
    if (!succeeded && exits) {
      isExitingRef.current = false
      setIsExiting(false)
    }
    return succeeded
  }

  return { cardRef, isExiting, runWithExit }
}
