import profiles from './teeniepingProfiles.json'

export const TEENIEPING_CLUE_CATEGORIES = [
  'looks',
  'prop',
  'theme',
  'magic',
] as const
export type TeeniepingClueCategory = (typeof TEENIEPING_CLUE_CATEGORIES)[number]

const images = import.meta.glob<string>('../assets/teenie/**/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
})

export const TEENIEPING_ART_COMPLETE = profiles.every((profile) =>
  TEENIEPING_CLUE_CATEGORIES.every((category) =>
    Boolean(images[`../assets/teenie/${category}/${profile.id}.webp`])
  )
)

const requiredImage = (path: string) => {
  const image = images[`../assets/teenie/${path}.webp`]
  if (!image) throw new Error(`Missing Teenieping image: ${path}`)
  return image
}

export type TeeniepingKnowledge = (typeof profiles)[number] & {
  kind: 'teenieping'
  image: string
  clueImages: Record<TeeniepingClueCategory, string>
}

// Every portrait and all four dedicated clue illustrations must exist.
// Alternate forms retain separate pictures but share an identity for distractors.
export const TEENIEPING_KNOWLEDGE: TeeniepingKnowledge[] = profiles.map(
  (profile) => ({
    ...profile,
    kind: 'teenieping',
    image: requiredImage(profile.portraitId ?? profile.id),
    get clueImages() {
      return {
        looks: requiredImage(`looks/${profile.id}`),
        prop: requiredImage(`prop/${profile.id}`),
        theme: requiredImage(`theme/${profile.id}`),
        magic: requiredImage(`magic/${profile.id}`),
      }
    },
  })
)
