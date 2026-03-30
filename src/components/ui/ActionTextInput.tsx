import type { ChangeEvent, KeyboardEvent } from 'react'
import type { CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { getActionButtonStyle, uiTokens } from '../../tokens'

type ActionTextInputProps = {
  theme: Theme
  label: string
  value: string
  onChange: (value: string) => void
  /** Called on blur and Enter key with the current value for auto-save */
  onCommit?: (value: string) => void
  placeholder?: string
  maxLength?: number
  baseColor: string
  inputAriaLabel?: string
  /** When true, the container uses a transparent background that
   *  inherits the card surface color instead of the themed baseColor. */
  transparent?: boolean
}

const ActionTextInput = ({
  theme,
  label,
  value,
  onChange,
  onCommit,
  placeholder,
  maxLength,
  baseColor,
  inputAriaLabel,
  transparent = false,
}: ActionTextInputProps) => {
  const actionStyle = getActionButtonStyle(theme, baseColor)

  const containerStyle: CSSProperties = transparent
    ? {
        ...actionStyle,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        color: theme.colors.text,
        gap: '12px',
        height: 'auto',
        justifyContent: 'flex-start',
        padding: 0,
      }
    : {
        ...actionStyle,
        gap: '12px',
        justifyContent: 'flex-start',
      }

  // Show label only when the value is empty (acts as inline placeholder)
  const showLabel = value.length === 0

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

  const handleBlur = () => {
    onCommit?.(value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }

  return (
    <div style={containerStyle}>
      {showLabel && <span style={labelStyle}>{label}</span>}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={inputAriaLabel || label}
        style={inputStyle}
      />
    </div>
  )
}

export default ActionTextInput
