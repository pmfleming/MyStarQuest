import { useState, useEffect } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StarDisplay from './StarDisplay'
import StepperButton from './StepperButton'
import { uiTokens } from '../ui/tokens'

// ============================================================================
// UNIFIED EDITABLE STAR DISPLAY
// Replaces the split between StarDisplay (read-only) and StarCost (edit).
// Usage: pass editable=true to show +/- controls alongside the star field.
// ============================================================================

export type EditableStarDisplayProps = {
  /** Number of stars to show */
  count: number
  /** When true, renders +/- controls alongside the star field */
  editable?: boolean
  /** Called with the new value when +/- is pressed */
  onChange?: (value: number) => void
  /** Minimum value (inclusive). Defaults to 1. */
  min?: number
  /** Maximum value (inclusive). Defaults to 10. */
  max?: number
  theme: Theme
  /** Pass false to skip the pop-in animation (e.g. when updating during edit) */
  animate?: boolean
}

const CONTROLS_DELAY_MS = 550 // let stars animate before controls appear
const STEPPER_WIDTH = 46
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const STAR_GEOMETRY_OVERHANG = 6
const STAR_CONTROL_WIDTH =
  CONTROL_ROW_WIDTH - STEPPER_WIDTH + STAR_GEOMETRY_OVERHANG * 2
const STAR_CONTROL_LEFT = (CONTROL_ROW_WIDTH - STAR_CONTROL_WIDTH) / 2
const STEPPER_OFFSET = STAR_CONTROL_LEFT - STEPPER_WIDTH / 2

const EditableStarDisplay = ({
  count,
  editable = false,
  onChange,
  min = 1,
  max = 10,
  theme,
  animate = true,
}: EditableStarDisplayProps) => {
  // Controls fade in after the star pop-in animation finishes (spec AC #4)
  const [controlsVisible, setControlsVisible] = useState(false)

  useEffect(() => {
    if (!editable) {
      setControlsVisible(false)
      return
    }
    const timer = setTimeout(() => setControlsVisible(true), CONTROLS_DELAY_MS)
    return () => clearTimeout(timer)
  }, [editable])

  const handleDecrement = () => {
    if (onChange && count > min) onChange(count - 1)
  }

  const handleIncrement = () => {
    if (onChange && count < max) onChange(count + 1)
  }

  const showControls = editable && controlsVisible

  if (!editable) {
    return <StarDisplay count={count} animate={animate} />
  }

  return (
    <div
      style={{
        position: 'relative',
        width: `${CONTROL_ROW_WIDTH}px`,
        maxWidth: '100%',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Minus button — fades in after star animation */}
      <div
        style={{
          position: 'absolute',
          left: `${STEPPER_OFFSET}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: showControls ? 3 : 1,
        }}
      >
        <StepperButton
          theme={theme}
          direction="prev"
          onClick={handleDecrement}
          disabled={count <= min}
          ariaLabel="Decrease star value"
          style={{ position: 'relative', zIndex: 3 }}
        />
      </div>

      {/* Star field */}
      <div style={{ width: `${STAR_CONTROL_WIDTH}px`, minWidth: 0 }}>
        <StarDisplay
          count={count}
          animate={animate}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Plus button — fades in after star animation */}
      <div
        style={{
          position: 'absolute',
          right: `${STEPPER_OFFSET}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: showControls ? 3 : 1,
        }}
      >
        <StepperButton
          theme={theme}
          direction="next"
          onClick={handleIncrement}
          disabled={count >= max}
          ariaLabel="Increase star value"
          style={{ position: 'relative', zIndex: 3 }}
        />
      </div>
    </div>
  )
}

export default EditableStarDisplay
