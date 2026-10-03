import { useContext } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import StarDisplay from './StarDisplay'
import { ImageLoadingContext } from './ImageLoadingContext'
import ImageWithOverlay from './ImageWithOverlay'

type ImageStarFrameProps = {
  theme: Theme
  image?: string
  overlayImage?: string
  imageAlt: string
  starCount: number
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
  onExpandImage?: () => void
}

const ImageStarFrame = ({
  theme,
  image,
  overlayImage,
  imageAlt,
  starCount,
  loading,
  fetchPriority,
  onExpandImage,
}: ImageStarFrameProps) => {
  const defaultLoading = useContext(ImageLoadingContext)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        minHeight: 116,
        padding: 10,
        borderRadius: uiTokens.surfaceRadius,
        border: `3px dashed ${theme.colors.primary}55`,
        background: `${theme.colors.bg}88`,
        overflow: 'visible',
        boxSizing: 'border-box',
      }}
    >
      {image && (
        <div
          style={{
            flex: '0 0 38%',
            minWidth: 96,
            maxWidth: 152,
            marginRight: -26,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            role={onExpandImage ? 'button' : undefined}
            tabIndex={onExpandImage ? 0 : undefined}
            aria-label={onExpandImage ? `Enlarge ${imageAlt}` : undefined}
            aria-description={
              onExpandImage
                ? 'Double-click, Enter, or Space to enlarge. Double-click again, click away, or press Escape to close.'
                : undefined
            }
            onDoubleClick={
              onExpandImage
                ? (event) => {
                    event.currentTarget.focus()
                    onExpandImage()
                  }
                : undefined
            }
            onKeyDown={
              onExpandImage
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onExpandImage()
                    }
                  }
                : undefined
            }
            style={{
              cursor: onExpandImage ? 'zoom-in' : undefined,
              touchAction: onExpandImage ? 'manipulation' : undefined,
              width: '100%',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            }}
          >
            <ImageWithOverlay
              src={image}
              overlayImage={overlayImage}
              alt={imageAlt}
              loading={loading ?? defaultLoading}
              fetchPriority={fetchPriority}
              decoding="async"
              style={{
                width: '112%',
                height: '112%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{
          flex: '1 1 66%',
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <StarDisplay
          count={starCount}
          animate={false}
          style={{
            width: '100%',
            minHeight: 84,
            padding: image ? '10px 10px 10px 4px' : 10,
            background: 'transparent',
            border: 0,
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}

export default ImageStarFrame
