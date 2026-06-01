import type { ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { princessExitIcon } from '../../assets/themes/princess/assets'
import { IconActionButton, IconChoiceButton } from './IconActionControls'
import {
  getStandardPrimaryActionStyle,
  getStandardUtilityActionStyle,
} from './standardActionStyles'

export type InlineChoice = {
  key: string
  label: ReactNode
  onSelect: () => void
  disabled?: boolean
  primary?: boolean
  icon?: string
}

type InlineChoiceListProps = {
  theme: Theme
  choices: InlineChoice[]
  onCancel: () => void
}

export const InlineChoiceList = ({
  theme,
  choices,
  onCancel,
}: InlineChoiceListProps) => (
  <div
    className={
      choices.every((choice) => choice.icon)
        ? 'grid grid-cols-3'
        : 'grid grid-cols-1'
    }
    style={{
      rowGap: `${uiTokens.controlRowGap}px`,
      columnGap: `${uiTokens.controlColumnGap}px`,
    }}
  >
    {choices.map((choice) =>
      choice.icon ? (
        <IconChoiceButton
          key={choice.key}
          theme={theme}
          icon={choice.icon}
          ariaLabel={String(choice.label)}
          onClick={choice.onSelect}
          disabled={choice.disabled}
          selected={choice.primary}
        />
      ) : (
        <button
          key={choice.key}
          type="button"
          className="whimsical-btn"
          onClick={choice.onSelect}
          disabled={choice.disabled}
          style={{
            ...getStandardPrimaryActionStyle(
              theme,
              choice.primary ? 'primary' : 'neutral'
            ),
            width: '100%',
            flex: 'initial',
            fontFamily: theme.fonts.heading,
          }}
        >
          {choice.label}
        </button>
      )
    )}
    <div
      className={choices.every((choice) => choice.icon) ? 'col-span-3' : ''}
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <IconActionButton
        theme={theme}
        icon={princessExitIcon}
        ariaLabel="Cancel"
        onClick={onCancel}
        style={getStandardUtilityActionStyle(theme, 'neutral')}
      />
    </div>
  </div>
)
