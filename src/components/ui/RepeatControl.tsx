import type { CSSProperties } from 'react'
import './RepeatControl.css'
import { AsyncButton } from './AsyncButton'
import { ActionArtwork } from './ActionArtwork'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import repeatCharacter from '../../assets/themes/teenie/repeat-character.png'

type RepeatControlProps = {
  theme: Theme
  value: boolean
  onChange: (value: boolean) => void | Promise<void>
  label?: string
  helperText?: string
  className?: string
  showLabel?: boolean
  showFeedback?: boolean
}

const RepeatControl = ({
  theme,
  value,
  onChange,
  label = 'Repeat Chore?',
  helperText,
  className = '',
  showLabel = false,
  showFeedback = false,
}: RepeatControlProps) => {
  const character = theme.id === 'teenie'
  const style: CSSProperties & Record<`--repeat-${string}`, string> = {
    '--repeat-primary': theme.colors.primary,
    '--repeat-accent': theme.colors.accent,
    '--repeat-surface': theme.colors.surface,
    '--repeat-text': theme.colors.text,
    '--repeat-tint': `${theme.colors.primary}1a`,
    '--repeat-glow': `${theme.colors.primary}33`,
    '--repeat-height': `${uiTokens.actionButtonHeight}px`,
    '--repeat-width': `${uiTokens.surfaceMaxWidth}px`,
    '--repeat-heading': theme.fonts.heading,
  }
  return (
    <div
      className={`repeat-control ${className}`}
      data-character={character}
      style={style}
    >
      {showLabel && <div className="repeat-control-title">{label}</div>}
      <AsyncButton
        type="button"
        className={character ? 'repeat-toggle whimsical-btn' : 'repeat-toggle'}
        onClick={() => onChange(!value)}
        aria-label={label}
        aria-pressed={value}
      >
        {character ? (
          <ActionArtwork scale={2}>
            <img src={repeatCharacter} alt="" aria-hidden="true" />
          </ActionArtwork>
        ) : (
          <svg viewBox="0 0 24 24" className="repeat-icon" aria-hidden="true">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        )}
      </AsyncButton>
      {showFeedback && (
        <div className="repeat-feedback">
          {helperText ||
            (value ? 'Yes, repeat this chore' : 'No, one-time only')}
        </div>
      )}
    </div>
  )
}

export default RepeatControl
