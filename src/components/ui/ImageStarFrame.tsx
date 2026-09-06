import { useContext } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import StarDisplay from './StarDisplay'
import { ImageLoadingContext } from './ImageLoadingContext'

type ImageStarFrameProps = {
  theme: Theme
  image?: string
  imageAlt: string
  starCount: number
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}

const ImageStarFrame = ({
  theme,
  image,
  imageAlt,
  starCount,
  loading,
  fetchPriority,
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
            style={{
              width: '100%',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            }}
          >
            <img
              src={image}
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
