import africaImage from '../assets/animal-locations/africa.webp'
import americaImage from '../assets/animal-locations/america.webp'
import antarcticaImage from '../assets/animal-locations/antarctica.webp'
import arcticImage from '../assets/animal-locations/arctic.webp'
import asiaImage from '../assets/animal-locations/asia.webp'
import australiaImage from '../assets/animal-locations/australia.webp'
import earthImage from '../assets/animal-locations/earth.webp'
import europeImage from '../assets/animal-locations/europe.webp'
import oceanImage from '../assets/animal-locations/ocean.webp'
import worldwideImage from '../assets/animal-locations/worldwide.webp'

export const ANIMAL_LOCATION_NAMES = [
  'Africa',
  'Asia',
  'Europe',
  'Australia',
  'Arctic',
  'Antarctica',
  'Ocean',
  'Worldwide',
  'America',
  'Earth',
] as const

export type AnimalLocationName = (typeof ANIMAL_LOCATION_NAMES)[number]

export const ANIMAL_LOCATION_IMAGE_BY_NAME: Record<AnimalLocationName, string> =
  {
    Africa: africaImage,
    Asia: asiaImage,
    Europe: europeImage,
    Australia: australiaImage,
    Arctic: arcticImage,
    Antarctica: antarcticaImage,
    Ocean: oceanImage,
    Worldwide: worldwideImage,
    America: americaImage,
    Earth: earthImage,
  }

const includesAny = (text: string, values: string[]) =>
  values.some((value) => text.includes(value))

export const getAnimalLocationName = (text: string): AnimalLocationName => {
  const value = text.toLowerCase()
  if (value.includes('antarctic')) return 'Antarctica'
  if (value.includes('arctic')) return 'Arctic'
  if (includesAny(value, ['ocean', 'sea'])) return 'Ocean'
  if (includesAny(value, ['world', 'earth', 'everywhere'])) return 'Worldwide'
  if (value.includes('africa')) return 'Africa'
  if (value.includes('asia') || value.includes('china')) return 'Asia'
  if (value.includes('europe')) return 'Europe'
  if (includesAny(value, ['australia', 'new zealand', 'new guinea', 'oceania']))
    return 'Australia'
  if (value.includes('america')) return 'America'
  return 'Earth'
}

export const getAnimalLocationImage = (text: string) =>
  ANIMAL_LOCATION_IMAGE_BY_NAME[getAnimalLocationName(text)]
