import africaImage from '../assets/animal-locations/africa-detailed.webp'
import africaIranImage from '../assets/animal-locations/africa-iran-card-art.webp'
import andesImage from '../assets/animal-locations/andes-card-art.webp'
import northernContinentsImage from '../assets/animal-locations/north-america-europe-asia-card-art.webp'
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
  'Andes',
  'North America, Europe, and Asia',
  'Africa & Iran',
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
    Andes: andesImage,
    'North America, Europe, and Asia': northernContinentsImage,
    'Africa & Iran': africaIranImage,
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

export const ANIMAL_LOCATION_LABEL_BY_NAME: Partial<
  Record<AnimalLocationName, string>
> = {
  Andes: 'The Andes of South America',
  'North America, Europe, and Asia': 'North America, Europe, and Asia',
  'Africa & Iran': 'Africa & Iran',
}
