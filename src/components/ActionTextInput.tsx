import type { ChangeEvent } from 'react'
import type { CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { getActionButtonStyle, uiTokens } from '../ui/tokens'

type ActionTextInputProps = {
  theme: Theme
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  baseColor: string
  inputAriaLabel?: string
}

const ActionTextInput = ({
  theme,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  baseColor,
  inputAriaLabel,
}: ActionTextInputProps) => {
  const containerStyle: CSSProperties = {
    ...getActionButtonStyle(theme, baseColor),
    gap: '12px',
    justifyContent: 'flex-start',
  }

  const labelStyle: CSSProperties = {
    fontFamily: theme.fonts.heading,
    fontSize: `${uiTokens.actionButtonFontSize}px`,
    fontWeight: 700,
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
  }

  const inputStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'inherit',
    fontFamily: theme.fonts.heading,
    fontSize: `${uiTokens.actionButtonFontSize}px`,
    fontWeight: 700,
    flex: 1,
    minWidth: 0,
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={inputAriaLabel || label}
        style={inputStyle}
      />
    </div>
  )
}

export default ActionTextInput
