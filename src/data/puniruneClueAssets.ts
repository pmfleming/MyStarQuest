import { createAssetResolver } from './assetCatalog'

const files = import.meta.glob<string>('../assets/punirunes/hints/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
})
const image = createAssetResolver(
  files,
  '../assets/punirunes/hints/',
  'Missing Punirunes clue illustration',
  '.png'
)

// Legacy symbols identify clue concepts only; no emoji is rendered by this collection.
// These neutral illustrations share the Punirunes style across all app themes.
const concepts: Record<string, string> = {
  '💎': 'Jewerun-crystal-quest',
  '🌱': 'generic/growth',
  '🌳': 'generic/growth',
  '🤗': 'generic/gentle-squish',
  '😨': 'generic/frightened',
  '😟': 'generic/frightened',
  '👻': 'generic/surprise',
  '🍬': 'generic/sweets',
  '💭': 'generic/daydream',
  '👶': 'generic/baby-care',
  '🥰': 'generic/kindness',
  '🎀': 'generic/fashion',
  '💝': 'generic/kindness',
  '😌': 'generic/calm',
  '✨': 'generic/blossom',
  '👗': 'generic/fashion',
  '↔️': 'generic/opposites',
  '😈': 'generic/mischief',
  '🤸': 'generic/sports',
  '🛹': 'generic/sports',
  '⚽': 'generic/sports',
  '🎯': 'generic/missed-target',
  '🍃': 'generic/wandering',
  '📖': 'generic/storybook',
  '🚫': 'generic/personal-space',
  '🤫': 'generic/secret',
  '🌸': 'generic/blossom',
  '🧺': 'generic/picnic',
  '🫣': 'generic/shy',
  '🤝': 'generic/friendship',
  '🎁': 'generic/presents',
  '❓': 'generic/curiosity',
  '🔎': 'generic/curiosity',
  '🐈': 'generic/cat-agility',
  '🐾': 'generic/cat-agility',
  '🐣': 'generic/baby-care',
  '💗': 'generic/kindness',
  '💖': 'generic/kindness',
  '💪': 'generic/strength',
  '🎧': 'generic/music',
  '🎶': 'generic/music',
  '🎸': 'generic/music',
  '🎤': 'generic/music',
  '🥺': 'generic/lonely',
  '🙋': 'generic/attention',
  '🧐': 'generic/study',
  '📚': 'generic/study',
  '💬': 'generic/conversation',
  '🚶': 'generic/wandering',
  '🏃': 'generic/sports',
  '💔': 'generic/separate-ways',
  '🎭': 'generic/opposites',
  '💇': 'generic/fashion',
  '📣': 'generic/fan',
  '😊': 'generic/sunshine',
  '☀️': 'generic/sunshine',
  '🌟': 'generic/fan',
  '🔄': 'generic/sushi',
  '🍣': 'generic/sushi',
  '😜': 'generic/mischief',
  '2️⃣': 'generic/opposites',
  '🧭': 'generic/wandering',
  '🧪': 'generic/science',
  '😢': 'generic/tears',
  '🏆': 'generic/strength',
  '🥕': 'generic/carrots',
  '🤪': 'generic/silly',
  '🔮': 'generic/mystery-appearance',
  '🪽': 'generic/flight',
  '🛋️': 'generic/calm',
  '🛑': 'generic/missed-target',
  '🍽️': 'generic/picnic',
  '🏫': 'Pikarun-classroom',
  '🌕': 'Hikarun-full-moon',
  '🍀': 'Enjerun-lucky-arrow',
  '🏡': 'Kapurun-forest-bakery',
  '👨‍🍳': 'Kapurun-forest-bakery',
  '🎉': 'Otorun-music-festival',
  '🎨': 'Ururun-school-plans',
  '🎄': 'generic/presents',
}

export const getPuniruneClueImage = (symbol: string): string => {
  const concept = concepts[symbol]
  if (!concept) throw new Error(`Missing Punirunes clue concept: ${symbol}`)
  return image(concept)
}

export const getHiddenPuniruneAppearanceImage = () =>
  image('generic/mystery-appearance')
