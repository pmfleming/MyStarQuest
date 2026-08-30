import yoshiEggImage from './YoshiEgg.webp'
import teeniepingImage from './teenieping.webp'
import pikachuImage from '../pokemon/pikachu.png'

export type RewardImageKey = 'yoshiEgg' | 'teenieping' | 'pikachu'

export const rewardImages: Record<RewardImageKey, string> = {
  pikachu: pikachuImage,
  teenieping: teeniepingImage,
  yoshiEgg: yoshiEggImage,
}

export type RewardImageOption = {
  id: '' | RewardImageKey
  label: string
  image?: string
}

export const rewardImageOptions: RewardImageOption[] = [
  { id: '', label: 'No image' },
  { id: 'teenieping', label: 'Teenieping', image: teeniepingImage },
  { id: 'yoshiEgg', label: 'Hatchin Yoshi', image: yoshiEggImage },
  { id: 'pikachu', label: 'Pikachu', image: pikachuImage },
]

export const isRewardImageKey = (
  imageKey: string
): imageKey is RewardImageKey => imageKey in rewardImages

export const getRewardImage = (imageKey?: string) => {
  if (!imageKey) return undefined
  if (imageKey === 'pinkPrincess') return teeniepingImage
  return isRewardImageKey(imageKey) ? rewardImages[imageKey] : undefined
}
