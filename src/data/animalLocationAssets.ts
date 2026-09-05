import africaImage from '../assets/animal-locations/scenic/africa.webp'
import andesImage from '../assets/animal-locations/scenic/andes.webp'
import northernContinentsImage from '../assets/animal-locations/scenic/northern-continents.webp'
import africaIranImage from '../assets/animal-locations/scenic/africa-iran.webp'
import asiaImage from '../assets/animal-locations/scenic/asia.webp'
import australiaImage from '../assets/animal-locations/scenic/australia.webp'
import arcticImage from '../assets/animal-locations/scenic/arctic.webp'
import oceansImage from '../assets/animal-locations/scenic/oceans.webp'
import worldwideImage from '../assets/animal-locations/scenic/worldwide.webp'
import warmRegionsImage from '../assets/animal-locations/scenic/warm-regions.webp'
import afroEurasiaImage from '../assets/animal-locations/scenic/afro-eurasia.webp'
import fiveContinentsImage from '../assets/animal-locations/scenic/five-continents.webp'
import africaAsiaAmericasImage from '../assets/animal-locations/scenic/africa-asia-americas.webp'
import coastsImage from '../assets/animal-locations/scenic/coasts.webp'
import mildRegionsImage from '../assets/animal-locations/scenic/mild-regions.webp'
import northAmericaImage from '../assets/animal-locations/scenic/north-america.webp'
import americasImage from '../assets/animal-locations/scenic/americas.webp'
import africaAsiaImage from '../assets/animal-locations/scenic/africa-asia.webp'
import centralWestAfricaImage from '../assets/animal-locations/scenic/central-west-africa.webp'
import centralAfricaImage from '../assets/animal-locations/scenic/central-africa.webp'
import newGuineaNorthAustraliaImage from '../assets/animal-locations/scenic/new-guinea-north-australia.webp'
import newZealandImage from '../assets/animal-locations/scenic/new-zealand.webp'
import easternAustraliaImage from '../assets/animal-locations/scenic/eastern-australia.webp'
import africaIndiaImage from '../assets/animal-locations/scenic/africa-india.webp'
import southernAfricaImage from '../assets/animal-locations/scenic/southern-africa.webp'
import centralSouthAmericaImage from '../assets/animal-locations/scenic/central-south-america.webp'
import centralChinaImage from '../assets/animal-locations/scenic/central-china.webp'
import southernHemisphereImage from '../assets/animal-locations/scenic/southern-hemisphere.webp'
import centralAsiaImage from '../assets/animal-locations/scenic/central-asia.webp'

// One location category owns one caption and one scenic map.
export const ANIMAL_LOCATIONS = {
  Africa: { label: 'Africa', image: africaImage },
  Andes: { label: 'Andes', image: andesImage },
  'North America, Europe, and Asia': {
    label: 'N. Am. & Eurasia',
    image: northernContinentsImage,
  },
  'Africa & Iran': { label: 'Africa & Iran', image: africaIranImage },
  Asia: { label: 'Asia', image: asiaImage },
  Australia: { label: 'Australia', image: australiaImage },
  Arctic: { label: 'Arctic', image: arcticImage },
  Ocean: { label: 'Global oceans', image: oceansImage },
  Worldwide: { label: 'Worldwide', image: worldwideImage },
  'Warm regions': { label: 'Warm regions', image: warmRegionsImage },
  'Afro-Eurasia': { label: 'Afro-Eurasia', image: afroEurasiaImage },
  'Five continents': { label: 'Five continents', image: fiveContinentsImage },
  'Africa, Asia & Americas': {
    label: 'Africa, Asia + Am.',
    image: africaAsiaAmericasImage,
  },
  'Global coasts': { label: 'Global coasts', image: coastsImage },
  'Mild regions': { label: 'Mild regions', image: mildRegionsImage },
  'North America': { label: 'North America', image: northAmericaImage },
  America: { label: 'Americas', image: americasImage },
  'Africa & Asia': { label: 'Africa & Asia', image: africaAsiaImage },
  'Central & West Africa': {
    label: 'C. & W. Africa',
    image: centralWestAfricaImage,
  },
  'Central Africa': { label: 'Central Africa', image: centralAfricaImage },
  'New Guinea & N. Australia': {
    label: 'N. Guinea & Aus.',
    image: newGuineaNorthAustraliaImage,
  },
  'New Zealand': { label: 'New Zealand', image: newZealandImage },
  'Eastern Australia': { label: 'E. Australia', image: easternAustraliaImage },
  'Africa & India': { label: 'Africa & India', image: africaIndiaImage },
  'Southern Africa': { label: 'Southern Africa', image: southernAfricaImage },
  'Central & South America': {
    label: 'C. & S. America',
    image: centralSouthAmericaImage,
  },
  'Central China': { label: 'Central China', image: centralChinaImage },
  'Southern Hemisphere': {
    label: 'S. Hemisphere',
    image: southernHemisphereImage,
  },
  'Central Asia': { label: 'Central Asia', image: centralAsiaImage },
} as const

export type AnimalLocationName = keyof typeof ANIMAL_LOCATIONS
export const ANIMAL_LOCATION_NAMES = Object.keys(
  ANIMAL_LOCATIONS
) as AnimalLocationName[]
export const ANIMAL_LOCATION_IMAGE_BY_NAME = Object.fromEntries(
  Object.entries(ANIMAL_LOCATIONS).map(([name, { image }]) => [name, image])
) as Record<AnimalLocationName, string>
