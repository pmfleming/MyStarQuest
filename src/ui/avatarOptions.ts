import odette from '../assets/teenie/odette.webp'
import mermaid from '../assets/teenie/mermaid-odette-ping.webp'
import angel from '../assets/teenie/angel-odette-ping.webp'
import space from '../assets/teenie/spaceman-odette-ping-v2.webp'
import { THEME_ID_LOOKUP } from './themeOptions'
import type { ChildProfile } from '../data/types'

// Reuse the original portraits, rather than the duplicated comic scene layers.
export const avatarOptions = [
  { id: 'odette-ping', label: 'Odette Ping', image: odette },
  { id: 'mermaid-odette-ping', label: 'Mermaid Odette Ping', image: mermaid },
  { id: 'angel-odette-ping', label: 'Angel Odette Ping', image: angel },
  { id: 'space-odette-ping', label: 'Space Odette Ping', image: space },
] as const

export const DEFAULT_AVATAR_TOKEN = 'theme'

type AvatarProfile = Pick<ChildProfile, 'avatarToken' | 'themeId'>

export function getChildAvatar(child: AvatarProfile) {
  const avatar = avatarOptions.find((option) => option.id === child.avatarToken)
  if (avatar) return avatar
  // Existing emoji tokens and unknown IDs retain the child's theme artwork.
  const theme = THEME_ID_LOOKUP.get(child.themeId || 'princess')!
  return {
    id: DEFAULT_AVATAR_TOKEN,
    label: 'Theme character',
    image: theme.image,
  }
}
