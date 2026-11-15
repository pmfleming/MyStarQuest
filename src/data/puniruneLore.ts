export type PuniruneLoreLabel = 'ABOUT ME' | 'LIKES' | 'SPECIAL'
export type PuniruneLoreClue<
  Label extends PuniruneLoreLabel = PuniruneLoreLabel,
> = {
  label: Label
  text: string
  visual: string
  sourceUrl: string
  scope: 'character' | 'shared'
  episode?: { season: number; number: number }
}
export type PuniruneLore = readonly [
  PuniruneLoreClue<'ABOUT ME'>,
  PuniruneLoreClue<'LIKES'>,
  PuniruneLoreClue<'SPECIAL'>,
]
type Fact = Omit<PuniruneLoreClue, 'label'>
const catalog = 'https://www.takaratomy.co.jp/products/punirunes/character/'
const about = 'https://www.takaratomy.co.jp/products/punirunes/about/'
const anime2 = 'https://www.tv-tokyo.co.jp/anime/punirunes2/chara/'
const anime3 = 'https://www.tv-tokyo.co.jp/anime/punirunes3_kachikochi/chara/'
const fact = (
  sourceUrl: string,
  text: string,
  visual: string,
  scope: Fact['scope'] = 'character'
): Fact => ({ sourceUrl, text, visual, scope })
const card = (index: number, text: string, visual: string) =>
  fact(`${catalog}img/img_index${index}.png`, text, visual)
const ep = (
  season: number,
  number: number,
  text: string,
  visual: string
): Fact => ({
  ...fact(
    `https://www.tv-tokyo.co.jp/anime/punirunes/episodes/${season}_${String(number).padStart(2, '0')}.html`,
    text,
    visual
  ),
  episode: { season, number },
})
const lore = (identity: Fact, likes: Fact, special: Fact): PuniruneLore => [
  { ...identity, label: 'ABOUT ME' },
  { ...likes, label: 'LIKES' },
  { ...special, label: 'SPECIAL' },
]
const adult = fact(catalog, 'I am a grown-up Punirune', '🌳')
const child = fact(catalog, 'I am a child Punirune', '🌱')
const squishes = fact(about, 'I love gentle squishes', '🤗', 'shared')
const growth = fact(
  about,
  'I grow through baby, child and adult stages',
  '🌱',
  'shared'
)
const care = fact(about, 'Lots of care helps me grow', '💗', 'shared')
// The baby-care episode explicitly teaches feeding and cooking as Punirune care.
// This is a shared activity, not an invented favourite food.
const mealtimes: Fact = {
  ...ep(1, 2, 'My carer prepares meals for me', '🍽️'),
  scope: 'shared',
}

// Reviewed 2026-11-15. Every character gets three sourced non-appearance hints
// in the same order, followed by LOOKS in puniruneKnowledge.ts. Episode facts
// describe only what the official synopsis states; a one-off event stays an
// event, not a new permanent power or personality. Shared facts are marked in
// metadata so gaps in individual profiles never become invented character lore.
export const PUNIRUNE_LORE = {
  Airun: lore(
    fact(anime2, 'I am curious and cheerful', '🔎'),
    fact(anime2, 'I love eating', '🍽️'),
    ep(4, 3, 'I started a school in Puni Land', '🏫')
  ),
  Akarun: lore(child, squishes, growth),
  Aorun: lore(child, squishes, growth),
  Bakerun: lore(
    card(56, 'I get scared easily', '😨'),
    card(56, 'Surprising my friends is fun', '👻'),
    ep(1, 5, "I took Ururun's Halloween sweets", '🍬')
  ),
  Bearun: lore(
    adult,
    card(102, 'A quiet day of daydreaming suits me', '💭'),
    care
  ),
  Bebirun: lore(
    fact(catalog, 'I am a baby Punirune', '👶'),
    card(70, 'I love being fussed over', '🥰'),
    ep(1, 2, 'Aoi cared for me as I grew into Kiirun', '🌱')
  ),
  Berirun: lore(adult, card(90, 'Dressing up is my favourite', '🎀'), growth),
  Chokorun: lore(
    card(84, 'I act prickly but have a sweet side', '💝'),
    mealtimes,
    adult
  ),
  Coorun: lore(
    fact(anime2, 'I stay calm and cool', '😌'),
    fact(anime2, 'I like fashion and being tidy', '🎀'),
    ep(3, 17, 'I put on a fashion show to cheer Airun up', '👗')
  ),
  Debirun: lore(
    card(94, 'I do the opposite of Enjerun', '↔️'),
    ep(4, 6, 'I want to annoy my rival Enjerun', '😈'),
    ep(4, 6, 'I stopped an arrow meant for Ururun', '🛑')
  ),
  Enerun: lore(
    fact(anime2, 'I am lively but a little clumsy', '🤸'),
    ep(3, 16, 'I played on a skateboard during an adventure', '🛹'),
    fact(anime2, 'I am good at sports', '⚽')
  ),
  Enjerun: lore(
    ep(2, 10, 'My aim is not very good', '🎯'),
    ep(2, 10, 'I chased Toggyrun to put things right', '🏃'),
    ep(2, 10, 'My arrows can bring good luck', '🍀')
  ),
  Fearun: lore(
    card(95, 'I go wherever the mood takes me', '🍃'),
    ep(3, 21, 'I appeared during a hunt for crystal pieces', '💎'),
    ep(3, 21, 'A storybook says happiness surrounds me', '📖')
  ),
  Gaorun: lore(
    card(97, 'I am easily frightened', '😟'),
    card(97, 'I prefer my tail to be left alone', '🚫'),
    ep(3, 18, 'My roar can make things squishy', '📣')
  ),
  Happyrun: lore(
    card(104, 'I secretly bring happiness', '🤫'),
    squishes,
    ep(1, 13, 'I helped Airun search for a missing tree star', '🎄')
  ),
  Harurun: lore(
    card(96, 'I am gentle and mysterious', '🌸'),
    card(96, 'I love picnics', '🧺'),
    fact(catalog, 'I am a rare Punirune', '✨')
  ),
  Hikarun: lore(
    card(106, 'I am very shy', '🫣'),
    ep(2, 6, 'Tomorun is one of my friends', '🤝'),
    ep(2, 6, 'I can transform into a full moon', '🌕')
  ),
  Ikarun: lore(
    card(47, 'I am shy around new friends', '🫣'),
    card(47, 'I want to get along with everyone', '🤝'),
    adult
  ),
  Jewerun: lore(
    fact(anime3, 'My friends can count on me', '🤝'),
    ep(3, 24, 'I looked forward to presents at my first Christmas', '🎁'),
    ep(3, 1, 'I search for Punistal fragments with Airun', '🧭')
  ),
  Kapurun: lore(
    ep(2, 17, 'I am a pastry chef in Puni Land', '👨‍🍳'),
    card(91, 'I love eating', '🍽️'),
    ep(3, 22, 'I opened a sweets shop deep in a forest', '🏡')
  ),
  Kiirun: lore(
    ep(1, 2, 'At first, I did not warm to Aoi', '🫣'),
    squishes,
    ep(1, 2, 'Aoi looked after me after I grew from Bebirun', '🌱')
  ),
  Loverun: lore(
    fact(anime2, 'Babies and animals warm to me', '🐣'),
    fact(anime2, 'I love cute things', '🎀'),
    ep(2, 9, 'I planned a surprise party for Yuka and Airun', '🎉')
  ),
  Makirun: lore(
    card(27, 'I take things very seriously', '🧐'),
    squishes,
    card(27, 'I always tell the truth', '💬')
  ),
  Minirun: lore(
    card(83, 'We always think alike', '💭'),
    fact(about, 'We love gentle squishes', '🤗', 'shared'),
    card(83, 'We make a great team', '🤝')
  ),
  // The official card gives only a sleepy appearance: keep it on LOOKS.
  Munyarun: lore(adult, mealtimes, care),
  Nazorun: lore(
    card(85, 'I am curious about everything', '❓'),
    ep(3, 8, 'I love mysteries', '🔎'),
    ep(3, 8, 'I asked why Komugi moves its tail', '🐈')
  ),
  Nerurun: lore(adult, card(64, 'Taking it easy makes me happy', '🛋️'), care),
  Nyarurun: lore(
    ep(2, 11, 'Komugi once felt jealous of me', '🥺'),
    card(92, 'I do things at my own pace', '🚶'),
    ep(2, 11, 'I am agile like a cat', '🐈')
  ),
  Onirun: lore(
    card(82, 'I have a kind heart', '💗'),
    card(82, 'I dream of becoming strong', '💪'),
    adult
  ),
  Oshirun: lore(
    card(81, 'I am a big fan of Airun', '💖'),
    card(81, 'My fan collection is precious to me', '🎁'),
    ep(3, 4, 'My friends once mistook me for Airun', '🎭')
  ),
  Otorun: lore(
    card(87, 'I am a DJ', '🎧'),
    card(87, 'I love music', '🎶'),
    ep(4, 4, 'Jewerun invited me to liven up a festival', '🎉')
  ),
  Paferun: lore(
    card(68, 'I get lonely easily', '🥺'),
    card(68, 'Please pay lots of attention to me', '🙋'),
    adult
  ),
  Pikarun: lore(
    card(99, 'I am serious and know a lot', '🧐'),
    card(99, 'I love studying', '📚'),
    ep(1, 17, 'I taught lessons, but singing was hard for me', '🏫')
  ),
  Piyorun: lore(
    adult,
    card(100, 'There is always time for a chat', '💬'),
    care
  ),
  Poirun: lore(card(65, 'Things often slip my mind', '💭'), mealtimes, adult),
  Puirun: lore(
    card(40, 'I get cross but am kind inside', '💗'),
    squishes,
    adult
  ),
  Pukarun: lore(
    card(86, 'Nobody can tell what I am thinking', '💭'),
    squishes,
    adult
  ),
  Purirun: lore(
    card(66, 'I go my own way', '🚶'),
    card(66, 'I love rock music', '🎸'),
    adult
  ),
  Pururun: lore(card(101, 'I am peaceful and quiet', '😌'), squishes, care),
  Ranrun: lore(
    ep(1, 23, 'One twin is bold; the other is shy', '🎭'),
    card(88, 'We like being together', '🤝'),
    ep(1, 23, 'We once quarrelled and went separate ways', '💔')
  ),
  Runrun: lore(
    adult,
    card(41, 'Cheering as a fan is my favourite', '📣'),
    card(41, 'My fringe is my pride and joy', '💇')
  ),
  Sanrun: lore(
    card(108, 'I have a sunny personality', '😊'),
    squishes,
    card(108, 'I glow when I am having fun', '☀️')
  ),
  Sushirun: lore(
    adult,
    ep(2, 14, 'I wanted to try being conveyor-belt sushi', '🔄'),
    card(89, 'I turn into sushi when happy', '🍣')
  ),
  Toggyrun: lore(
    card(105, 'I am a little prankster', '😜'),
    ep(1, 11, 'I enjoy playing tricks and running away', '🏃'),
    ep(2, 10, 'An arrow once split me into two', '2️⃣')
  ),
  Tomorun: lore(
    fact(anime2, 'I make new friends easily', '🤝'),
    fact(anime2, 'I look for exciting things to do', '🔎'),
    ep(2, 24, 'I travelled Puni Land making friends', '🧭')
  ),
  Tsukurun: lore(
    card(109, 'I can be shy with new people', '🫣'),
    card(109, 'I love experiments', '🧪'),
    adult
  ),
  Ururun: lore(
    fact(anime2, 'I cry when I get startled', '😢'),
    ep(4, 5, 'I taught my friends to draw', '📚'),
    ep(4, 3, 'I drew the plans for Puni School', '🎨')
  ),
  Usarun: lore(
    card(103, 'I really hate losing', '🏆'),
    card(103, 'Carrots are a favourite treat', '🥕'),
    adult
  ),
  Utarun: lore(
    ep(2, 21, 'I am a star with lots of fans', '🌟'),
    card(44, 'Singing makes me happy', '🎤'),
    ep(2, 21, 'Fans delayed my trip to a festival', '🎶')
  ),
  Wafurun: lore(card(63, 'I am a silly character', '🤪'), mealtimes, adult),
  Yunirun: lore(
    fact(anime2, 'I am known by name but rarely seen', '🔮'),
    ep(2, 23, 'Tomorun came looking for me in a forest', '🍃'),
    ep(2, 4, 'I can fly freely through the sky', '🪽')
  ),
  Zourun: lore(card(98, 'I am very kind', '💗'), squishes, adult),
} satisfies Record<string, PuniruneLore>
