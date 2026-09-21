import { createAssetResolver } from '../data/assetCatalog'
import type { SchoolEventArtwork } from '../../functions/src/schoolEventCatalog'

const files = import.meta.glob<string>(
  '../assets/themes/*/school-events/*.webp',
  { eager: true, query: '?url', import: 'default' }
)
const resolve = createAssetResolver(
  files,
  '../assets/themes/',
  'Missing school event artwork'
)
export const getSchoolEventImage = (
  theme: string,
  artwork: SchoolEventArtwork
) =>
  resolve(
    `${theme === 'teenie' ? 'teenie' : 'princess'}/school-events/${artwork}.webp`
  )
