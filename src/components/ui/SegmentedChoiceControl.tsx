import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { StandardIconImage } from './IconActionControls'
import ResourceLoadingIcon from './ResourceLoadingIcon'

export type SegmentedChoiceOption<TValue extends string> = {
  value: TValue
  label: string
  icon?: string
  symbol?: ReactNode
  disabled?: boolean
  loading?: boolean
}

type SegmentedChoiceControlProps<TValue extends string> = {
  theme: Theme
  value: TValue
  options: SegmentedChoiceOption<TValue>[]
  onChange: (value: TValue) => void
  ariaLabel: string
  className?: string
  style?: CSSProperties
}

const getInactiveBackground = (theme: Theme) =>
  theme.id === 'space' ? `${theme.colors.surface}00` : 'transparent'

const SegmentedChoiceControl = <TValue extends string>({
  theme,
  value,
  options,
  onChange,
  ariaLabel,
  className,
  style,
}: SegmentedChoiceControlProps<TValue>) => (
  <div
    className={className}
    role="radiogroup"
    aria-label={ariaLabel}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      width: '100%',
      height: uiTokens.listActionHeight,
      minHeight: uiTokens.listActionHeight,
      maxHeight: uiTokens.listActionHeight,
      background: theme.colors.surface,
      border: `2px solid ${theme.colors.accent}`,
      borderRadius: uiTokens.listActionRadius,
      padding: uiTokens.controlInset / 2,
      overflow: 'hidden',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {options.map((option) => {
      const isSelected = option.value === value

      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={isSelected}
          aria-label={option.label}
          aria-busy={option.loading || undefined}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          style={{
            height: '100%',
            minWidth: 0,
            borderRadius: uiTokens.listActionRadius - uiTokens.controlInset / 2,
            border: 'none',
            background: isSelected
              ? theme.colors.primary
              : getInactiveBackground(theme),
            color: isSelected
              ? theme.id === 'space'
                ? '#000'
                : '#fff'
              : theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: '1rem',
            fontWeight: 'bold',
            lineHeight: 1,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            cursor: option.disabled ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box',
            opacity: option.disabled ? 0.55 : undefined,
          }}
        >
          {option.icon && option.loading !== undefined ? (
            <ResourceLoadingIcon
              src={option.icon}
              loading={option.loading}
              label={`Loading ${option.label}`}
              size={uiTokens.listActionHeight - 24}
            />
          ) : option.icon ? (
            <StandardIconImage
              src={option.icon}
              fit="contain"
              width="100%"
              height="100%"
              style={{
                maxHeight: uiTokens.listActionHeight - 24,
              }}
            />
          ) : option.symbol ? (
            <span
              aria-hidden="true"
              style={{
                display: 'flex',
                minWidth: 0,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>
                {option.symbol}
              </span>
              <span
                style={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.7rem',
                  lineHeight: 1,
                }}
              >
                {option.label}
              </span>
            </span>
          ) : (
            option.label
          )}
        </button>
      )
    })}
  </div>
)

export default SegmentedChoiceControl
