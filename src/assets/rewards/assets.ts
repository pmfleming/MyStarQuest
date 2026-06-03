import yoshiEggImage from './YoshiEgg.svg'
import teeniepingImage from './teenieping.svg'

export type RewardImageKey = 'yoshiEgg' | 'teenieping'

export const rewardImages: Record<RewardImageKey, string> = {
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
]

export const isRewardImageKey = (
  imageKey: string
): imageKey is RewardImageKey => imageKey in rewardImages

export const getRewardImage = (imageKey?: string) => {
  if (!imageKey) return undefined
  if (imageKey === 'pinkPrincess') return teeniepingImage
  return isRewardImageKey(imageKey) ? rewardImages[imageKey] : undefined
}
