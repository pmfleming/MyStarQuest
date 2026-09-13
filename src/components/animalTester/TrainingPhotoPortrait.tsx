import { useState, type ReactNode } from 'react'
import { getCreaturePhoto, type CreaturePhoto } from '../../data/creaturePhotos'
import type { ActivityChoreProps } from '../ui/ActivityControls'
import './TrainingPhotoPortrait.css'

export default function TrainingPhotoPortrait({
  name,
  theme,
  children,
}: {
  name: string
  theme: ActivityChoreProps['theme']
  children: (
    photo: CreaturePhoto | undefined,
    onPhotoError: () => void
  ) => ReactNode
}) {
  const [showPhoto, setShowPhoto] = useState(false)
  const [failedName, setFailedName] = useState<string | null>(null)
  const failed = failedName === name
  const isPhotoShown = showPhoto && !failed
  const photo = getCreaturePhoto(name)
  const onPhotoError = () => {
    setFailedName(name)
  }
  if (!photo) return children(undefined, onPhotoError)
  const togglePhoto = () => {
    setFailedName(null)
    setShowPhoto((value) => failed || !value)
  }

  return (
    <div
      className="training-photo-portrait"
      style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}
    >
      <button
        type="button"
        className="training-photo-trigger"
        aria-label={`View ${isPhotoShown ? 'drawing' : 'real photo'} of ${photo.name.toLowerCase()}`}
        aria-pressed={isPhotoShown}
        aria-description="Double-click the picture, or press Enter or Space, to switch between the drawing and real photo."
        onDoubleClick={togglePhoto}
        onClick={(event) => {
          // Keyboard and assistive technology activation emit a click without a pointer count.
          if (event.detail === 0) togglePhoto()
        }}
      >
        {children(isPhotoShown ? photo : undefined, onPhotoError)}
      </button>
      {failed && (
        <p role="status" className="training-photo-error">
          This photo couldn’t load. Double-click the drawing to try again.
        </p>
      )}
    </div>
  )
}
