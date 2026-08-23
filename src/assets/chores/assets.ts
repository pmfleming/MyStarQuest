import tidyingUpImage from '../themes/princess/tidying-up.webp'
import writingImage from '../themes/princess/writing.svg'

export type ChoreImageKey = 'tidyingUp' | 'writing'

export const choreImages: Record<ChoreImageKey, string> = {
  tidyingUp: tidyingUpImage,
  writing: writingImage,
}

export type ChoreImageOption = {
  id: '' | ChoreImageKey
  label: string
  image?: string
}

export const choreImageOptions: ChoreImageOption[] = [
  { id: '', label: 'No image' },
  { id: 'tidyingUp', label: 'Tidying up', image: tidyingUpImage },
  { id: 'writing', label: 'Writing', image: writingImage },
]

export const isChoreImageKey = (imageKey: string): imageKey is ChoreImageKey =>
  imageKey in choreImages

export const getChoreImage = (imageKey?: string) => {
  if (!imageKey) return undefined
  return isChoreImageKey(imageKey) ? choreImages[imageKey] : undefined
}
