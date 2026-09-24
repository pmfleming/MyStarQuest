import { createAssetResolver } from '../data/assetCatalog'

const files = import.meta.glob<string>('../assets/calendar/theatre/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
const resolve = createAssetResolver(
  files,
  '../assets/calendar/theatre/',
  'Missing theatre event artwork'
)

export const getTheatreEventImage = (id: string) => resolve(`${id}.webp`)
