import type { ChildProfile } from '../data/types'
import {
  avatarOptions,
  DEFAULT_AVATAR_TOKEN,
  getChildAvatar,
} from '../ui/avatarOptions'
import Carousel from './ui/Carousel'

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

export function ChildAvatarPicker({
  child,
  onChange,
}: {
  child: ChildProfile
  onChange: (avatarToken: string) => void | Promise<void>
}) {
  const selected = getChildAvatar(child)
  const options = [
    getChildAvatar({ ...child, avatarToken: DEFAULT_AVATAR_TOKEN }),
    ...avatarOptions,
  ]
  return (
    <Carousel
      key={`${child.id}-${selected.id}`}
      title="Select Avatar"
      initialIndex={options.findIndex((option) => option.id === selected.id)}
      items={options}
      onChange={(index) => {
        const option = options[index]
        if (option) return onChange(option.id)
      }}
    />
  )
}
