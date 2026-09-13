import credits from './creaturePhotoCredits.json'

const images = import.meta.glob('../assets/creaturePhotos/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export type CreaturePhoto = (typeof credits)[number] & { src: string }

const photos = new Map<string, CreaturePhoto>(
  credits.flatMap<[string, CreaturePhoto]>((credit) => {
    const src = images[`../assets/creaturePhotos/${credit.id}.webp`]
    return src ? [[credit.id, { ...credit, src }]] : []
  })
)

export function getCreaturePhoto(name: string) {
  const photo = photos.get(name)
  return photo?.src ? photo : undefined
}
