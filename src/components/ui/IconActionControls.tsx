import type { CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { useAsyncAction } from './useAsyncAction'
import { ActionArtwork } from './ActionArtwork'
import {
  getStandardPrimaryActionStyle,
  getStandardUtilityActionStyle,
  type StandardActionVariant,
} from './standardActionStyles'

type IconFit = 'contain' | 'cover'

type StandardIconImageProps = {
  src: string
  fit?: IconFit
  width?: number | string
  height?: number | string
  opacity?: number
  className?: string
  style?: CSSProperties
}

export const StandardIconImage = ({
  src,
  fit = 'contain',
  width = 40,
  height = 40,
  opacity,
  className,
  style,
}: StandardIconImageProps) => (
  <img
    src={src}
    alt=""
    aria-hidden="true"
    className={className}
    style={{
      width,
      height,
      maxWidth: width,
      maxHeight: height,
      objectFit: fit,
      objectPosition: 'center',
      display: 'block',
      flex: '0 0 auto',
      opacity,
      ...style,
    }}
  />
)

type IconActionButtonProps = {
  theme: Theme
  icon: string
  ariaLabel: string
  onClick: () => void | Promise<void>
  disabled?: boolean
  variant?: StandardActionVariant
  shape?: 'primary' | 'utility'
  fit?: IconFit
  iconWidth?: number | string
  iconHeight?: number | string
  iconOpacity?: number
  className?: string
  style?: CSSProperties
}

export const IconActionButton = ({
  theme,
  icon,
  ariaLabel,
  onClick,
  disabled,
  variant,
  shape = 'utility',
  fit = 'contain',
  iconWidth = shape === 'primary' ? '100%' : 40,
  iconHeight = shape === 'primary' ? '100%' : 40,
  iconOpacity,
  className,
  style,
}: IconActionButtonProps) => {
  const image = (
    <StandardIconImage
      src={icon}
      fit={fit}
      width={iconWidth}
      height={iconHeight}
      opacity={iconOpacity}
    />
  )
  return (
    <button
      type="button"
      className={`whimsical-btn ${shape === 'utility' ? 'whimsical-btn-utility' : ''} ${className ?? ''}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        ...(shape === 'primary'
          ? getStandardPrimaryActionStyle(theme, variant ?? 'primary')
          : getStandardUtilityActionStyle(theme, variant ?? 'neutral')),
        ...style,
      }}
    >
      {shape === 'primary' ? <ActionArtwork>{image}</ActionArtwork> : image}
    </button>
  )
}

type IconActionRowProps = {
  theme: Theme
  primaryIcon: string
  primaryAriaLabel: string
  onPrimaryClick: () => void | Promise<void>
  primaryDisabled?: boolean
  primaryIconOpacity?: number
  utilityIcon: string
  utilityAriaLabel: string
  onUtilityClick: () => void | Promise<void>
  utilityDisabled?: boolean
  style?: CSSProperties
}

export const IconActionRow = ({
  theme,
  primaryIcon,
  primaryAriaLabel,
  onPrimaryClick,
  primaryDisabled,
  primaryIconOpacity,
  utilityIcon,
  utilityAriaLabel,
  onUtilityClick,
  utilityDisabled,
  style,
}: IconActionRowProps) => {
  const { pendingAction, actionError, runAction } = useAsyncAction<
    'primary' | 'utility'
  >()
  return (
    <>
      <div
        className="flex items-center"
        style={{
          height: `${uiTokens.listActionHeight}px`,
          minHeight: `${uiTokens.listActionHeight}px`,
          alignItems: 'stretch',
          gap: `${uiTokens.actionRowGap}px`,
          ...style,
        }}
      >
        <IconActionButton
          theme={theme}
          icon={primaryIcon}
          ariaLabel={primaryAriaLabel}
          onClick={() => {
            void runAction(primaryAriaLabel, 'primary', onPrimaryClick)
          }}
          disabled={primaryDisabled || pendingAction !== null}
          shape="primary"
          iconOpacity={primaryIconOpacity}
        />
        <IconActionButton
          theme={theme}
          icon={utilityIcon}
          ariaLabel={utilityAriaLabel}
          onClick={() => {
            void runAction(utilityAriaLabel, 'utility', onUtilityClick)
          }}
          disabled={utilityDisabled || pendingAction !== null}
          shape="utility"
        />
      </div>
      {actionError && <p role="alert">{actionError}</p>}
    </>
  )
}

type IconChoiceButtonProps = {
  theme: Theme
  icon: string
  ariaLabel: string
  onClick: () => void | Promise<void>
  disabled?: boolean
  selected?: boolean
}

export const IconChoiceButton = ({
  theme,
  icon,
  ariaLabel,
  onClick,
  disabled,
  selected,
}: IconChoiceButtonProps) => (
  <button
    type="button"
    className="whimsical-btn"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    style={{
      ...getStandardPrimaryActionStyle(theme, selected ? 'primary' : 'neutral'),
      width: '100%',
      flex: 'initial',
      borderWidth: '3px',
      padding: `${uiTokens.controlInset}px`,
    }}
  >
    <ActionArtwork>
      <StandardIconImage src={icon} width="100%" height="100%" />
    </ActionArtwork>
  </button>
)
