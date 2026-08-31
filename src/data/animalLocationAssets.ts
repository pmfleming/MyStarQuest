import africaImage from '../assets/animal-locations/africa-detailed.webp'
import americaImage from '../assets/animal-locations/america-detailed.webp'
import antarcticaImage from '../assets/animal-locations/antarctica-detailed.webp'
import arcticImage from '../assets/animal-locations/arctic-detailed.webp'
import asiaImage from '../assets/animal-locations/asia-detailed.webp'
import australiaImage from '../assets/animal-locations/australia-detailed.webp'
import earthImage from '../assets/animal-locations/earth-detailed.webp'
import europeImage from '../assets/animal-locations/europe-detailed.webp'
import oceanImage from '../assets/animal-locations/ocean-detailed.webp'
import worldwideImage from '../assets/animal-locations/worldwide-detailed.webp'

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
