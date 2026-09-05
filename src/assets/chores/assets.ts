import tidyingUpImage from '../themes/princess/tidying-up.webp'
import writingImage from '../themes/princess/writing.svg'
import bravePrincessImage from '../themes/princess/brave-princess.png'
import gettingDressedQuicklyImage from '../themes/princess/getting-dressed-quickly.png'

export type ChoreImageKey =
  'tidyingUp' | 'writing' | 'bravePrincess' | 'gettingDressedQuickly'

export const choreImages: Record<ChoreImageKey, string> = {
  tidyingUp: tidyingUpImage,
  writing: writingImage,
  bravePrincess: bravePrincessImage,
  gettingDressedQuickly: gettingDressedQuicklyImage,
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
  { id: 'bravePrincess', label: 'Brave princess', image: bravePrincessImage },
  {
    id: 'gettingDressedQuickly',
    label: 'Getting dressed quickly',
    image: gettingDressedQuicklyImage,
  },
]

export const isChoreImageKey = (imageKey: string): imageKey is ChoreImageKey =>
  imageKey in choreImages

export const getChoreImage = (imageKey?: string) => {
  if (!imageKey) return undefined
  return isChoreImageKey(imageKey) ? choreImages[imageKey] : undefined
}
