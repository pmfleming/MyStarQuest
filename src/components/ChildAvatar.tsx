import type { ChildProfile } from '../data/types'
import { getChildAvatar } from '../ui/avatarOptions'

export default function ChildAvatar({
  child,
  size = 48,
}: {
  child: Pick<ChildProfile, 'avatarToken' | 'themeId'>
  size?: number
}) {
  return (
    <img
      src={getChildAvatar(child).image}
      alt=""
      width={size}
      height={size}
      decoding="async"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}
