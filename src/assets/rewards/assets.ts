import pikachuImage from './pikachu-english-cards.svg'
import japanesePikachuImage from './pikachu-japanese-cards.svg'
import legoPokemonImage from './lego-pokemon.png'
import yoshiEggImage from './YoshiEgg.webp'
import teeniepingImage from './teenieping.webp'
import { getSpellingImage } from '../../data/spellingAssets'

export const rewardImageOptions = [
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

const rewardImages = new Map(
  rewardImageOptions.map(({ id, image }) => [id, image])
)
rewardImages.set('pinkPrincess', teeniepingImage)

export const getRewardImage = (imageKey = '') => rewardImages.get(imageKey)

export const getRewardOverlayImage = (title: string, imageKey?: string) =>
  imageKey === 'legoPokemon' ? getSpellingImage(title) : undefined
