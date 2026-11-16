import type { CSSProperties, ImgHTMLAttributes } from 'react'
import { artworkSrcSet } from '../../ui/responsiveArtwork'

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  overlayImage?: string
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
}

export default function ImageWithOverlay({
  overlayImage,
  style,
  alt,
  ...imageProps
}: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        flexShrink: 0,
        ...style,
        position: 'relative',
      }}
    >
      <img
        srcSet={artworkSrcSet(imageProps.src)}
        sizes="100vw"
        {...imageProps}
        alt={alt}
        style={imageStyle}
      />
      {overlayImage && (
        <img
          src={overlayImage}
          alt=""
          aria-hidden="true"
          decoding="async"
          loading={imageProps.loading}
          style={{
            ...imageStyle,
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '50%',
            height: '50%',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
