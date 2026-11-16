import type { ChildProfile } from '../data/types'
import {
  avatarOptions,
  DEFAULT_AVATAR_TOKEN,
  getChildAvatar,
} from '../ui/avatarOptions'
import Carousel from './ui/Carousel'

export default function ChildAvatarPicker({
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
      items={options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: (
          <img
            src={option.image}
            alt={option.label}
            loading="lazy"
            decoding="async"
            style={{ width: '70px', height: '70px', objectFit: 'contain' }}
          />
        ),
      }))}
      onChange={(index) => {
        const option = options[index]
        if (option) return onChange(option.id)
      }}
    />
  )
}
