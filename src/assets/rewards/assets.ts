import pikachuImage from './pikachu-english-cards.svg'
import japanesePikachuImage from './pikachu-japanese-cards.svg'
import legoPokemonImage from './lego-pokemon.png'
import yoshiEggImage from './YoshiEgg.webp'
import teeniepingImage from './teenieping.webp'

export type RewardImageKey =
  'yoshiEgg' | 'teenieping' | 'pikachu' | 'pikachuJapanese' | 'legoPokemon'

const rewardImages: Record<RewardImageKey, string> = {
  pikachu: pikachuImage,
  pikachuJapanese: japanesePikachuImage,
  legoPokemon: legoPokemonImage,
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
  { id: 'pikachu', label: 'English Pokémon cards', image: pikachuImage },
  {
    id: 'pikachuJapanese',
    label: 'Japanese Pokémon cards',
    image: japanesePikachuImage,
  },
  { id: 'legoPokemon', label: 'LEGO Pokémon', image: legoPokemonImage },
]

const isRewardImageKey = (imageKey: string): imageKey is RewardImageKey =>
  imageKey in rewardImages

export const getRewardImage = (imageKey?: string) => {
  if (!imageKey) return undefined
  if (imageKey === 'pinkPrincess') return teeniepingImage
  return isRewardImageKey(imageKey) ? rewardImages[imageKey] : undefined
}
