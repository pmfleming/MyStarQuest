import lolliping from '../assets/teenie/lolli.webp'
import giftping from '../assets/teenie/gift.webp'
import luckyping from '../assets/teenie/lucky.webp'
import balletping from '../assets/teenie/ballet.webp'
import fluffyping from '../assets/teenie/fluffy.webp'
import dareping from '../assets/teenie/dare.webp'
import trustping from '../assets/teenie/trust.webp'
import sweetping from '../assets/teenie/sweet.webp'
import rosa from '../assets/sharing/princess-rosa.png'
import lily from '../assets/sharing/princess-lily.png'
import amara from '../assets/sharing/princess-amara.png'
import ruby from '../assets/sharing/princess-ruby.png'
import pearl from '../assets/sharing/princess-pearl.png'
import violet from '../assets/sharing/princess-violet.png'
import cupcake from '../assets/sharing/princess-cupcake.png'
import sweet from '../assets/sharing/teenie-heart-sweet.png'
import giftToken from '../assets/teenie/prop/gift.webp'
import mirrorToken from '../assets/teenie/prop/heart.webp'
import pinwheelToken from '../assets/teenie/prop/lolli.webp'
import wandToken from '../assets/teenie/prop/sweet.webp'
import heartsping from '../assets/teenie/heart.webp'
import happying from '../assets/teenie/happy.webp'
import lalaping from '../assets/teenie/lala.webp'
import sparkleping from '../assets/teenie/sparkle.webp'
import { getThemeAsset } from '../ui/themeAssets'

export type SharingFriend = {
  kind: 'princess' | 'image'
  name: string
  src: string
}

export type SharingTreat = {
  id: string
  singular: string
  plural: string
  src: string
}

// Reference-based variants preserve the original princess design and pose.
// Only hair, iris and dress colours vary; see docs/assets/2026-11-15-sharing-princesses.json.
const PRINCESSES: SharingFriend[] = [
  { kind: 'princess', name: 'Rosa', src: rosa },
  { kind: 'princess', name: 'Lily', src: lily },
  { kind: 'princess', name: 'Amara', src: amara },
  { kind: 'princess', name: 'Ruby', src: ruby },
  { kind: 'princess', name: 'Pearl', src: pearl },
  { kind: 'princess', name: 'Violet', src: violet },
]

// Original Teenieping artwork retains each character's colours and accessories.
const TEENIEPINGS: SharingFriend[] = [
  { kind: 'image', name: 'Heartsping', src: heartsping },
  { kind: 'image', name: 'Happying', src: happying },
  { kind: 'image', name: 'Lalaping', src: lalaping },
  { kind: 'image', name: 'Sparkleping', src: sparkleping },
  { kind: 'image', name: 'Lolliping', src: lolliping },
  { kind: 'image', name: 'Giftping', src: giftping },
  { kind: 'image', name: 'Luckyping', src: luckyping },
  { kind: 'image', name: 'Balletping', src: balletping },
  { kind: 'image', name: 'Fluffyping', src: fluffyping },
  { kind: 'image', name: 'Dareping', src: dareping },
  { kind: 'image', name: 'Trustping', src: trustping },
  { kind: 'image', name: 'Sweetping', src: sweetping },
]

const princessTreats = (): SharingTreat[] => [
  {
    id: 'crowns',
    singular: 'crown',
    plural: 'crowns',
    src: getThemeAsset('princess', 'mathsCounter'),
  },
  { id: 'cupcakes', singular: 'cupcake', plural: 'cupcakes', src: cupcake },
]

const teenieTreats = (): SharingTreat[] => [
  {
    id: 'symbols',
    singular: 'symbol',
    plural: 'symbols',
    src: getThemeAsset('teenie', 'mathsCounter'),
  },
  { id: 'sweets', singular: 'sweet', plural: 'sweets', src: sweet },
  { id: 'gifts', singular: 'gift', plural: 'gifts', src: giftToken },
  { id: 'mirrors', singular: 'mirror', plural: 'mirrors', src: mirrorToken },
  {
    id: 'pinwheels',
    singular: 'pinwheel',
    plural: 'pinwheels',
    src: pinwheelToken,
  },
  { id: 'wands', singular: 'wand', plural: 'wands', src: wandToken },
]

const isTeenie = (themeId: string) => themeId === 'teenie'

export const getSharingFriends = (themeId: string) =>
  isTeenie(themeId) ? TEENIEPINGS : PRINCESSES

export const getSharingTreats = (themeId: string) =>
  isTeenie(themeId) ? teenieTreats() : princessTreats()

/** Pick a themed treat, never repeating the previous one back to back. */
export function pickSharingTreat(
  themeId: string,
  previousId?: string
): SharingTreat {
  const treats = getSharingTreats(themeId)
  const pool = treats.filter((treat) => treat.id !== previousId)
  return pool[Math.floor(Math.random() * pool.length)] ?? treats[0]!
}

/** Prefer friends who sat out the previous round; never duplicate a friend. */
export function pickSharingFriends(
  themeId: string,
  count: number,
  previous: readonly SharingFriend[] = []
): SharingFriend[] {
  const previousNames = new Set(previous.map((friend) => friend.name))
  const friends = getSharingFriends(themeId)
  const shuffle = (pool: SharingFriend[]) => {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
    }
    return pool
  }
  return [
    ...shuffle(friends.filter((friend) => !previousNames.has(friend.name))),
    ...shuffle(friends.filter((friend) => previousNames.has(friend.name))),
  ].slice(0, count)
}
