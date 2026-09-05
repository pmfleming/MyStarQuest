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
import worldwideMap from '../assets/animal-locations/worldwide-map.webp'
import warmRegionsMap from '../assets/animal-locations/warm-regions-map.webp'
import afroEurasiaMap from '../assets/animal-locations/afro-eurasia-map.webp'
import fiveContinentsMap from '../assets/animal-locations/five-continents-map.webp'
import africaAsiaAmericasMap from '../assets/animal-locations/africa-asia-americas-map.webp'
import globalCoastsMap from '../assets/animal-locations/global-coasts-map.webp'
import mildRegionsMap from '../assets/animal-locations/mild-regions-map.webp'
import northAmericaMap from '../assets/animal-locations/north-america-map.webp'

// Each reviewed category owns both its caption and its single custom map.
// Detailed animal ranges (including introductions) remain in the fact text.
export const REVIEWED_ANIMAL_LOCATIONS = {
  Worldwide: { label: 'Worldwide', image: worldwideMap },
  'Warm regions': { label: 'Warm regions', image: warmRegionsMap },
  'Afro-Eurasia': { label: 'Afro-Eurasia', image: afroEurasiaMap },
  'Five continents': { label: 'Five continents', image: fiveContinentsMap },
  'Africa, Asia & Americas': {
    label: 'Africa, Asia + Am.',
    image: africaAsiaAmericasMap,
  },
  'Global coasts': { label: 'Global coasts', image: globalCoastsMap },
  'Mild regions': { label: 'Mild regions', image: mildRegionsMap },
  'North America': { label: 'North America', image: northAmericaMap },
} as const

type ReviewedLocation = keyof typeof REVIEWED_ANIMAL_LOCATIONS
const reviewedImages = Object.fromEntries(
  Object.entries(REVIEWED_ANIMAL_LOCATIONS).map(([name, value]) => [
    name,
    value.image,
  ])
) as Record<ReviewedLocation, string>

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
  ...(Object.keys(REVIEWED_ANIMAL_LOCATIONS) as ReviewedLocation[]),
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
    ...reviewedImages,
    America: americaImage,
    Earth: earthImage,
  }

export const ANIMAL_LOCATION_LABEL_BY_NAME: Partial<
  Record<AnimalLocationName, string>
> = {
  ...Object.fromEntries(
    Object.entries(REVIEWED_ANIMAL_LOCATIONS).map(([name, value]) => [
      name,
      value.label,
    ])
  ),
  Andes: 'The Andes of South America',
  'North America, Europe, and Asia': 'North America, Europe, and Asia',
  'Africa & Iran': 'Africa & Iran',
}
