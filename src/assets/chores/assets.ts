import { getThemeAsset, type ThemeAssetRole } from '../../ui/themeAssets'
import type { ThemeId } from '../../ui/themeOptions'

type ChoreArtwork = { id: string; label: string; role?: ThemeAssetRole }

const choreArtworks: ChoreArtwork[] = [
  { id: '', label: 'No image' },
  { id: 'tidyingUp', label: 'Tidying up', role: 'tidyingUp' },
  { id: 'writing', label: 'Writing', role: 'writing' },
  { id: 'bravePrincess', label: 'Brave princess', role: 'brave' },
  {
    id: 'gettingDressedQuickly',
    label: 'Getting dressed quickly',
    role: 'gettingDressed',
  },
]
const choreRoles = new Map(choreArtworks.map(({ id, role }) => [id, role]))

export const getChoreImage = (imageKey = '', themeId: ThemeId = 'princess') => {
  const role = choreRoles.get(imageKey)
  return role ? getThemeAsset(themeId, role) : undefined
}

export const getChoreImageOptions = (themeId: ThemeId) =>
  choreArtworks.map(({ id, label }) => ({
    id,
    label:
      themeId === 'teenie' && id === 'bravePrincess' ? 'Being brave' : label,
    image: getChoreImage(id, themeId),
  }))
