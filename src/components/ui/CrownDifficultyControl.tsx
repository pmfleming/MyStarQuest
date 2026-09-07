import { getThemeAsset } from '../../ui/themeAssets'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'

export type CrownDifficultyOption<T extends string> = {
  value: T
  label: string
  crowns: number
}

type CrownDifficultyControlProps<T extends string> = {
  theme: Theme
  value: T
  options: readonly CrownDifficultyOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  crownSize?: number
}

const CrownDifficultyControl = <T extends string>({
  theme,
  value,
  options,
  onChange,
  ariaLabel,
  crownSize = uiTokens.activityTokens.mathCounterSize,
}: CrownDifficultyControlProps<T>) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    style={{
      display: 'flex',
      minHeight: uiTokens.listActionHeight,
      background: theme.colors.surface,
      borderRadius: uiTokens.listActionRadius,
      padding: uiTokens.controlInset / 2,
      border: `2px solid ${theme.colors.accent}`,
      width: '100%',
      boxSizing: 'border-box',
    }}
  >
    {options.map((option) => {
      const isSelected = value === option.value

      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-label={option.label}
          aria-checked={isSelected}
          onClick={() => onChange(option.value)}
          style={{
            flex: 1,
            padding: 0,
            borderRadius: uiTokens.listActionRadius - uiTokens.controlInset / 2,
            border: 'none',
            cursor: 'pointer',
            background: isSelected ? theme.colors.primary : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: uiTokens.activityTokens.mathCounterGap,
              width: '100%',
            }}
          >
            {Array.from({ length: option.crowns }, (_, index) => (
              <img
                key={`${option.value}-${index}`}
                src={getThemeAsset(theme.id, 'mathsCounter')}
                alt=""
                decoding="async"
                style={{
                  width: crownSize,
                  height: crownSize,
                  objectFit: 'contain',
                }}
              />
            ))}
          </span>
        </button>
      )
    })}
  </div>
)

export default CrownDifficultyControl
