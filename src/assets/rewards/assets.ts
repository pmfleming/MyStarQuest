import pikachuImage from './pikachu-english-cards.svg'
import japanesePikachuImage from './pikachu-japanese-cards.svg'
import legoPokemonImage from './lego-pokemon.png'
import yoshiEggImage from './YoshiEgg.webp'
import teeniepingImage from './teenieping.webp'
import clawGameTeenieImage from './claw-game-teenie.png'
import clawGamePrincessImage from './claw-game-princess.png'
import { getSpellingImage } from '../../data/spellingAssets'
import type { ThemeId } from '../../ui/themeOptions'

const rewardImageOptions = [
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
  { id: 'clawGame', label: 'Claw game', image: clawGamePrincessImage },
]

const rewardImages = new Map(
  rewardImageOptions.map(({ id, image }) => [id, image])
)
rewardImages.set('pinkPrincess', teeniepingImage)

export const getRewardImage = (imageKey = '', themeId: ThemeId = 'princess') =>
  imageKey === 'clawGame'
    ? themeId === 'teenie'
      ? clawGameTeenieImage
      : clawGamePrincessImage
    : rewardImages.get(imageKey)

export const getRewardImageOptions = (themeId: ThemeId) =>
  rewardImageOptions.map((option) => ({
    ...option,
    image: getRewardImage(option.id, themeId),
  }))

export const getRewardOverlayImage = (title: string, imageKey?: string) =>
  imageKey === 'legoPokemon' ? getSpellingImage(title) : undefined
