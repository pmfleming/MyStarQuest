import { createAssetResolver } from './assetCatalog'
import { PUNIRUNE_LORE, type PuniruneLore } from './puniruneLore'

type AppearanceClue = {
  label: 'LOOKS'
  text: string
  visual: string
  sourceUrl?: never
}
export type PuniruneKnowledge = {
  kind: 'punirune'
  name: string
  image: string
  clues: readonly [...PuniruneLore, AppearanceClue]
}

const images = import.meta.glob<string>(
  ['../assets/punirunes/*.png', '!../assets/punirunes/Yuka.png'],
  { eager: true, import: 'default', query: '?url' }
)
const requiredImage = createAssetResolver(
  images,
  '../assets/punirunes/',
  'Missing Punirune image',
  '.png'
)
const p = (
  name: keyof typeof PUNIRUNE_LORE,
  text: string,
  visual: string
): PuniruneKnowledge => ({
  kind: 'punirune',
  name,
  image: requiredImage(name),
  clues: [...PUNIRUNE_LORE[name], { label: 'LOOKS', text, visual }],
})

// Four fixed categories: ABOUT ME, LIKES, SPECIAL, and one final LOOKS card.
// Individual lore is supplemented by sourced shared facts for short biographies.
// Appearance describes the saved portrait, not every possible toy colour variant.
// Sources and English-name/romanization notes: assets/punirunes/manifest.json.
// Yuka is a human supporting character and is not in this creature collection.
export const PUNIRUNE_KNOWLEDGE: PuniruneKnowledge[] = [
  p('Airun', 'I am pink with round ears and a dark face patch', '🐻'),
  p('Akarun', 'I am tiny and pale pink with two round ears', '🩷'),
  p('Aorun', 'I am light blue with a darker blue head top', '🩵'),
  p('Bakerun', 'I look like a blue ghost with my tongue out', '👻'),
  p('Bearun', 'I look like a pink bear with a big dark nose', '🐻'),
  p('Bebirun', 'I am tiny and round with rainbow colours', '🌈'),
  p('Berirun', 'I have cream and two strawberries on my head', '🍓'),
  p('Chokorun', 'I look like a chocolate cupcake with pink icing', '🧁'),
  p('Coorun', 'I am purple with dark side flaps and eye patches', '🟣'),
  p('Debirun', 'I am dark pink with two purple horns', '😈'),
  p('Enerun', 'I am yellow with a square head and golden side flaps', '🟨'),
  p('Enjerun', 'I have a halo, little wings and a heart arrow', '😇'),
  p('Fearun', 'I have pastel curls and little fairy wings', '🦋'),
  p('Gaorun', 'I look like a green dinosaur with yellow spikes', '🦖'),
  p('Happyrun', 'I am a rainbow star decorated with little stars', '⭐'),
  p('Harurun', 'I am pale pink with a blossom on my head', '🌸'),
  p('Hikarun', 'I look like a yellow moon on a blue cloud', '🌙'),
  p('Ikarun', 'I have an orange squid-shaped head and a moustache', '🦑'),
  p('Jewerun', 'I am pale purple with a jewel on my head', '💎'),
  p('Kapurun', 'I look like a pink cupcake with mint icing', '🧁'),
  p('Kiirun', 'I am yellow and pear-shaped with an orange tuft', '🍐'),
  p('Loverun', 'I am pink with a heart-shaped face patch', '💗'),
  p('Makirun', 'I am golden yellow with a tall swirly head', '🍦'),
  p('Minirun', 'We are three pink and cream friends in a little stack', '3️⃣'),
  p('Munyarun', 'I look sleepy, with a mint body and two head bubbles', '😴'),
  p('Nazorun', 'I am pale yellow with a blue question mark on top', '❓'),
  p('Nerurun', 'I lie low with a yellow body and a heart-shaped tuft', '💛'),
  p('Nyarurun', 'I look like a cream and brown cat with closed eyes', '🐱'),
  p('Onirun', 'I am red with a yellow horn and a little club', '🔺'),
  p('Oshirun', 'I am pale pink and wear a red Airun face accessory', '🎀'),
  p('Otorun', 'I am white and blue with zigzags on my head', '⚡'),
  p('Paferun', 'I look like a sundae with a cherry, wafers and a spoon', '🍨'),
  p('Pikarun', 'I am yellow with huge glasses and a blue book', '👓'),
  p('Piyorun', 'I look like a yellow bird with an orange beak', '🐤'),
  p('Poirun', 'I am light green with side flaps and an oval nose', '🟢'),
  p('Puirun', 'I am bright pink with three head bumps and angry eyes', '🩷'),
  p('Pukarun', 'I look like a blue jellyfish with a wavy edge', '🪼'),
  p('Purirun', 'I am yellow with curled bunches and pink eye marks', '➰'),
  p('Pururun', 'I am golden with floppy ears and a brown mouth patch', '🐶'),
  p('Ranrun', 'We are mint and yellow with matching head curls', '2️⃣'),
  p('Runrun', 'I am cream with floppy ears and a brown fringe', '🐶'),
  p('Sanrun', 'I look like an orange sun with wavy rays', '☀️'),
  p('Sushirun', 'I look like white sushi with a pale blue topping', '🍣'),
  p('Toggyrun', 'I am green with yellow-tipped head spikes', '🔺'),
  p('Tomorun', 'I am mint blue with two head bubbles and a dark curl', '🫧'),
  p('Tsukurun', 'I have fluffy pastel hair, goggles and science bottles', '🥽'),
  p('Ururun', 'I am light blue with a square head and large dark eyes', '🩵'),
  p('Usarun', 'I have long rabbit ears and carry a carrot', '🐰'),
  p('Utarun', 'I am pale yellow and wear a musical-note hat', '🎵'),
  p('Wafurun', 'I look like a grumpy pink dog with my tongue out', '🐶'),
  p('Yunirun', 'I look like a pastel unicorn with a curled mane', '🦄'),
  p('Zourun', 'I look like a light blue elephant with a tiny trunk', '🐘'),
].sort((a, b) => a.name.localeCompare(b.name))
