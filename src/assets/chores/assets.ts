import { getThemeAsset } from '../../ui/themeAssets'
import type { ThemeId } from '../../ui/themeOptions'
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

export const getChoreImage = (
  imageKey?: string,
  themeId: ThemeId = 'princess'
) => {
  if (!imageKey) return undefined
  if (!isChoreImageKey(imageKey)) return undefined
  const roles = {
    tidyingUp: 'tidyingUp',
    writing: 'writing',
    bravePrincess: 'brave',
    gettingDressedQuickly: 'gettingDressed',
  } as const
  return getThemeAsset(themeId, roles[imageKey])
}

export const getChoreImageOptions = (themeId: ThemeId) =>
  choreImageOptions.map((option) => ({
    ...option,
    label:
      themeId === 'teenie' && option.id === 'bravePrincess'
        ? 'Being brave'
        : option.label,
    image: getChoreImage(option.id, themeId),
  }))
