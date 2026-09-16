import { useState, type ReactNode } from 'react'
import { getCreaturePhoto } from '../../data/creaturePhotos'
import type { CatalogAnimal } from '../../data/creatureCollections/types'
import PicturePortrait from './PicturePortrait'
import { creatureDisplayName } from './modeArtwork'

type LearningPicture = {
  src: string
  alt: string
  name: string
  realLabel: string
  cartoonLabel: string
  error: string
}

function learningPicture(animal: CatalogAnimal): LearningPicture | undefined {
  if (animal.kind === 'prehistoric')
    return {
      src: animal.realisticImage,
      alt: `${animal.displayName} reconstruction`,
      name: animal.displayName,
      realLabel: 'realistic reconstruction',
      cartoonLabel: 'cartoon',
      error: 'The reconstruction could not load.',
    }
  if (animal.kind === 'teenieping') return undefined
  const photo = getCreaturePhoto(animal.name)
  if (!photo) return undefined
  const name = photo.name.toLowerCase()
  return {
    src: photo.src,
    alt: `Real ${name}`,
    name,
    realLabel: 'real photo',
    cartoonLabel: 'drawing',
    error: 'This photo couldn’t load.',
  }
}

export default function TrainingPhotoPortrait({
  animal,
  children,
}: {
  animal: CatalogAnimal
  children: (photo?: {
    src: string
    alt: string
    onError: () => void
  }) => ReactNode
}) {
  const [showPhoto, setShowPhoto] = useState(false)
  const [failedName, setFailedName] = useState<string | null>(null)
  const failed = failedName === animal.name
  const isPhotoShown = showPhoto && !failed
  const photo = learningPicture(animal)
  const togglePhoto = () => {
    setFailedName(null)
    setShowPhoto((value) => failed || !value)
  }
  return (
    <div className="training-photo-portrait">
      <PicturePortrait
        label={
          photo
            ? `View ${isPhotoShown ? photo.cartoonLabel : photo.realLabel} of ${photo.name}`
            : `Enlarge ${creatureDisplayName(animal)} picture`
        }
        pressed={photo ? isPhotoShown : undefined}
        onActivate={photo ? togglePhoto : undefined}
        description={animal.kind === 'prehistoric' ? animal.family : undefined}
        creatureKey={animal.name}
      >
        {children(
          isPhotoShown && photo
            ? {
                src: photo.src,
                alt: photo.alt,
                onError: () => setFailedName(animal.name),
              }
            : undefined
        )}
      </PicturePortrait>
      {failed && (
        <p role="status" className="training-photo-error">
          {photo?.error} Tap the picture to try again.
        </p>
      )}
    </div>
  )
}
