import { useState, type ReactNode } from 'react'
import { usePictureGestures } from './usePictureGestures'
import './TrainingPhotoPortrait.css'

export default function PicturePortrait({
  children,
  label,
  pressed,
  onActivate,
  creatureKey,
  description,
}: {
  children: ReactNode
  label: string
  pressed?: boolean
  onActivate?: () => void
  creatureKey: string
  description?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const gestures = usePictureGestures({
    expanded,
    onActivate,
    onToggleZoom: () => setExpanded((value) => !value),
    resetKey: creatureKey,
  })
  return (
    <button
      type="button"
      className="training-photo-trigger"
      {...gestures}
      aria-label={label}
      aria-description={[description, gestures['aria-description']]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={onActivate ? pressed : undefined}
    >
      {children}
    </button>
  )
}
