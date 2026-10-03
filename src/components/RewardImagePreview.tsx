import { useEffect, useRef } from 'react'
import ImageWithOverlay from './ui/ImageWithOverlay'

export default function RewardImagePreview({
  image,
  overlayImage,
  title,
  onClose,
}: {
  image: string
  overlayImage?: string
  title: string
  onClose: () => void
}) {
  const previewRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const trigger = document.activeElement
    const preview = previewRef.current
    preview?.focus({ preventScroll: true })
    return () => {
      if (
        (document.activeElement === preview ||
          document.activeElement === document.body) &&
        trigger instanceof HTMLElement &&
        trigger.isConnected
      ) {
        trigger.focus({ preventScroll: true })
      }
    }
  }, [])

  useEffect(() => {
    const closeOutside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !previewRef.current?.contains(event.target)
      ) {
        onClose()
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', closeOutside, true)
    document.addEventListener('click', closeOutside, true)
    document.addEventListener('focusin', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true)
      document.removeEventListener('click', closeOutside, true)
      document.removeEventListener('focusin', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <button
      ref={previewRef}
      type="button"
      aria-label={`Close enlarged ${title} reward`}
      aria-expanded="true"
      aria-description="Double-click or press Enter, Space, or Escape to close. Clicking outside also closes the image."
      onDoubleClick={onClose}
      onClick={(event) => {
        if (event.detail === 0) onClose()
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        padding: 12,
        border: 0,
        borderRadius: 'inherit',
        background: 'transparent',
        cursor: 'zoom-out',
        touchAction: 'manipulation',
        display: 'grid',
        placeItems: 'center',
        containerType: 'size',
        zIndex: 2,
      }}
    >
      <ImageWithOverlay
        src={image}
        overlayImage={overlayImage}
        alt={`${title} reward enlarged`}
        style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}
      />
    </button>
  )
}
