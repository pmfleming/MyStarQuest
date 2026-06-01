import yoshiEggImage from './YoshiEgg.svg'

export type RewardImageKey = 'yoshiEgg'

export const rewardImages: Record<RewardImageKey, string> = {
  yoshiEgg: yoshiEggImage,
}

export const isRewardImageKey = (
  imageKey: string
): imageKey is RewardImageKey => imageKey in rewardImages

export const getRewardImage = (imageKey?: string) => {
  if (!imageKey) return undefined
  return isRewardImageKey(imageKey) ? rewardImages[imageKey] : undefined
}
