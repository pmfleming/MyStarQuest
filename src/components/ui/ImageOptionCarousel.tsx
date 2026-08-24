import { useMemo } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import Carousel from './Carousel'

export type ImageOption = {
  id: string
  label: string
  image?: string
}

type ImageOptionCarouselProps = {
  theme: Theme
  title: string
  options: readonly ImageOption[]
  selectedId: string
  onChange: (id: string) => void
}

const ImageOptionCarousel = ({
  theme,
  title,
  options,
  selectedId,
  onChange,
}: ImageOptionCarouselProps) => {
  const items = useMemo(
    () =>
      options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.image ? (
          <img
            src={option.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
            aria-hidden="true"
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: `3px dashed ${theme.colors.primary}`,
              display: 'block',
              opacity: 0.55,
            }}
          />
        ),
      })),
    [options, theme.colors.primary]
  )

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === selectedId)
  )

  return (
    <Carousel
      key={selectedId}
      items={items}
      title={title}
      initialIndex={selectedIndex}
      onChange={(index) => {
        const nextId = options[index]?.id
        if (nextId !== undefined && nextId !== selectedId) onChange(nextId)
      }}
    />
  )
}

export default ImageOptionCarousel
