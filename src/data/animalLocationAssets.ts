import africaImage from '../assets/animal-locations/expanded/africa.webp'
import southAmericaImage from '../assets/animal-locations/expanded/south-america.webp'
import asiaImage from '../assets/animal-locations/expanded/asia.webp'
import europeAsiaImage from '../assets/animal-locations/expanded/europe-asia.svg'
import australiaImage from '../assets/animal-locations/expanded/australia.webp'
import northAmericaImage from '../assets/animal-locations/expanded/north-america.webp'
import americasImage from '../assets/animal-locations/expanded/americas.webp'
import africaAsiaImage from '../assets/animal-locations/expanded/africa-asia.webp'
import afroEurasiaImage from '../assets/animal-locations/expanded/afro-eurasia.webp'
import northernContinentsImage from '../assets/animal-locations/expanded/northern-continents.webp'
import fiveContinentsImage from '../assets/animal-locations/expanded/five-continents.webp'
import africaAsiaAmericasImage from '../assets/animal-locations/expanded/africa-asia-americas.webp'
import newGuineaAustraliaImage from '../assets/animal-locations/expanded/new-guinea-australia.webp'
import newZealandImage from '../assets/animal-locations/expanded/new-zealand.webp'
import arcticImage from '../assets/animal-locations/expanded/arctic.webp'
import oceansImage from '../assets/animal-locations/expanded/oceans.webp'
import worldwideImage from '../assets/animal-locations/expanded/worldwide.webp'
import warmRegionsImage from '../assets/animal-locations/expanded/warm-regions.webp'
import mildRegionsImage from '../assets/animal-locations/expanded/mild-regions.webp'
import coastsImage from '../assets/animal-locations/expanded/coasts.webp'
import southernHemisphereImage from '../assets/animal-locations/expanded/southern-hemisphere.webp'

// Broad teaching regions, not exact species ranges. Precise places remain in facts.
// Each category owns one caption and one expanded map; no subregion aliases.
export const ANIMAL_LOCATIONS = {
  Africa: { label: 'Africa', image: africaImage },
  'South America': { label: 'South America', image: southAmericaImage },
  Asia: { label: 'Asia', image: asiaImage },
  'Europe & Asia': { label: 'Europe & Asia', image: europeAsiaImage },
  Australia: { label: 'Australia', image: australiaImage },
  'North America': { label: 'North America', image: northAmericaImage },
  Americas: { label: 'Americas', image: americasImage },
  'Africa & Asia': { label: 'Africa & Asia', image: africaAsiaImage },
  'Afro-Eurasia': { label: 'Afro-Eurasia', image: afroEurasiaImage },
  'North America, Europe, and Asia': {
    label: 'N. Am. & Eurasia',
    image: northernContinentsImage,
  },
  'Five continents': { label: 'Five continents', image: fiveContinentsImage },
  'Africa, Asia & Americas': {
    label: 'Africa, Asia + Am.',
    image: africaAsiaAmericasImage,
  },
  'New Guinea & Australia': {
    label: 'Aus. & N. Guinea',
    image: newGuineaAustraliaImage,
  },
  'New Zealand': { label: 'New Zealand', image: newZealandImage },
  Arctic: { label: 'Arctic', image: arcticImage },
  Ocean: { label: 'Global oceans', image: oceansImage },
  Worldwide: { label: 'Worldwide', image: worldwideImage },
  'Warm regions': { label: 'Warm regions', image: warmRegionsImage },
  'Mild regions': { label: 'Temperate zones', image: mildRegionsImage },
  'Global coasts': { label: 'Global coasts', image: coastsImage },
  'Southern Hemisphere': {
    label: 'S. Hemisphere',
    image: southernHemisphereImage,
  },
} as const

export type AnimalLocationName = keyof typeof ANIMAL_LOCATIONS
