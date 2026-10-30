import poster from '../../assets/comic/sea-friends-poster.webp'
import scene1 from '../../assets/comic/opening/01-poffertjes.webp'
import scene2 from '../../assets/comic/opening/02-sea-calling.webp'
import scene3 from '../../assets/comic/opening/03-leap.webp'
import scene4 from '../../assets/comic/opening/04-transformation.webp'
import scene5 from '../../assets/comic/opening/05-rainbow.webp'
import scene6 from '../../assets/comic/opening/06-primarina-aqua.webp'
import scene7 from '../../assets/comic/opening/07-tangy-sweet.webp'
import scene8 from '../../assets/comic/opening/08-eclipse-diana.webp'
import scene9 from '../../assets/comic/opening/09-hop-doremi.webp'
import scene10 from '../../assets/comic/opening/10-playing.webp'
import scene11 from '../../assets/comic/opening/11-distant-castle.webp'
import scene12 from '../../assets/comic/opening/12-castle-close.webp'
import scene13 from '../../assets/comic/opening/13-entering.webp'
import scene14 from '../../assets/comic/opening/14-ice-creams.webp'
import scene15 from '../../assets/comic/opening/15-speed-cleaning.webp'
import scene16 from '../../assets/comic/opening/16-painting-decorations.webp'
import scene17 from '../../assets/comic/opening/17-tidying.webp'
import scene18 from '../../assets/comic/opening/18-hello-helpers.webp'
import scene19 from '../../assets/comic/opening/19-adventure-invitation.webp'
import scene20 from '../../assets/comic/opening/20-diamond-mine.webp'
import scene21 from '../../assets/comic/opening/21-gathering-diamonds.webp'
import scene22 from '../../assets/comic/opening/22-making-diamond-room.webp'
import scene23 from '../../assets/comic/opening/23-diamond-room.webp'
import scene24 from '../../assets/comic/opening/24-brushing-teeth.webp'
import scene25 from '../../assets/comic/opening/25-helpers-brushing.webp'
import scene26 from '../../assets/comic/opening/26-primarina-aquafox-bedtime.webp'
import scene27 from '../../assets/comic/opening/27-tangy-sweet-bedtime.webp'
import scene28 from '../../assets/comic/opening/28-eclipse-diana-bedtime.webp'
import scene29 from '../../assets/comic/opening/29-hopping-doremi-bedtime.webp'
import scene30 from '../../assets/comic/opening/30-helper-nursery.webp'
import scene31 from '../../assets/comic/opening/31-odette-rainbow-bedtime.webp'
import morningWake from '../../assets/comic/opening/31a-morning-wake-up.webp'
import morningBreakfast from '../../assets/comic/opening/31b-ice-cream-breakfast.webp'
import scene32 from '../../assets/comic/opening/32-magic-mirror.webp'
import scene33 from '../../assets/comic/opening/33-pink-portal.webp'
import scene34 from '../../assets/comic/opening/34-swept-into-portal.webp'
import scene35 from '../../assets/comic/opening/35-sky-castle-arrival.webp'
import scene36 from '../../assets/comic/opening/36-aururo-welcome.webp'
import scene37 from '../../assets/comic/opening/37-playground-surprise.webp'
import scene38 from '../../assets/comic/opening/38-rainbow-slide.webp'
import scene39 from '../../assets/comic/opening/39-shell-swings.webp'
import scene40 from '../../assets/comic/opening/40-rainbow-stepping-stones.webp'
import scene41 from '../../assets/comic/opening/41-cloud-roundabout.webp'
import scene42 from '../../assets/comic/opening/42-cloud-trampolines.webp'
import scene43 from '../../assets/comic/opening/43-climbing-bridge.webp'
import scene44 from '../../assets/comic/opening/44-dingdong-invitation-v2.webp'
import scene45 from '../../assets/comic/opening/45-ready-for-space-v2.webp'
import scene46 from '../../assets/comic/opening/46-star-planet.webp'
import scene47 from '../../assets/comic/opening/47-flight-to-star-planet.webp'
import scene48 from '../../assets/comic/opening/48-star-planet-friends.webp'
import scene49 from '../../assets/comic/opening/49-pop-star-system-v2.webp'
import scene50 from '../../assets/comic/opening/50-flight-to-princess-castle.webp'
import scene51 from '../../assets/comic/opening/51-princess-castle-door-v2.webp'
import scene52 from '../../assets/comic/opening/52-dark-castle-entry.webp'
import scene53 from '../../assets/comic/opening/53-cloaked-visitor-on-table.webp'
import scene54 from '../../assets/comic/opening/54-birthday-surprise-v2.webp'
import scene55 from '../../assets/comic/opening/55-birthday-cake-v2.webp'
import scene56 from '../../assets/comic/opening/56-birthday-dancing-v2.webp'
import scene57 from '../../assets/comic/opening/57-birthday-group-photo-v2.webp'
import scene58 from '../../assets/comic/opening/58-odette-polaroid.webp'
import scene59 from '../../assets/comic/opening/59-goodbye-space-friends.webp'
import scene60 from '../../assets/comic/opening/60-flying-home-to-earth.webp'
// Back on Earth: Odette, Eclipse and Diana in their original outfits.
import scene61 from '../../assets/comic/opening/61-fossil-dig.webp'

export type Chapter = { label: string; panelId: string; image?: string }

export type Panel = {
  id: string
  label: string
  image: string
  alt: string
  tone: 'ocean' | 'lavender' | 'turquoise' | 'blue'
  framing: 'poster' | 'character'
  aspectRatio: number
  maxWidth: number
  motion?: 'still' | 'slow-zoom'
  effect?:
    | 'photo-moment'
    | 'underwater-meeting'
    | 'morning-rooms'
    | 'air-scene'
    | 'cleaning-scene'
    | 'tidying-scene'
    | 'ice-cream-scene'
    | 'space-flight-scene'
    | 'star-system-scene'
    | 'dingdong-arrival-scene'
}

// Most pages share one layout; keep exceptions beside their artwork.
function comicPanels(
  panels: (Omit<Panel, 'framing' | 'maxWidth' | 'aspectRatio'> &
    Partial<Pick<Panel, 'framing' | 'maxWidth' | 'aspectRatio'>>)[]
): Panel[] {
  return panels.map((panel) => ({
    framing: 'poster',
    maxWidth: 1400,
    aspectRatio: 1672 / 941,
    ...panel,
  }))
}

// User-authored opening. Labels and alt text are accessible metadata only;
// no words or controls are drawn over the comic artwork.
export const story: { title: string; chapters: Chapter[]; panels: Panel[] } = {
  title: 'Sea friends',
  chapters: [
    { label: 'Land', panelId: '01-poffertjes' },
    { label: 'Sea', panelId: '03-leap', image: scene6 },
    { label: 'Air', panelId: '35-sky-castle-arrival' },
    { label: 'Space', panelId: '44-dingdong-invitation', image: scene47 },
    { label: 'Fossils', panelId: '61-fossil-dig' },
  ],
  panels: comicPanels([
    {
      id: 'cover',
      label: 'Cover',
      image: poster,
      alt: 'Odette, PrimarinaPing and Aquafox in a magical underwater adventure.',
      tone: 'ocean',
      aspectRatio: 2 / 3,
      maxWidth: 720,
    },
    {
      id: '01-poffertjes',
      label: 'Poffertjes by the sea',
      image: scene1,
      alt: 'Odette Ping walks along a sunny seaside path, eating little poffertjes dusted with sugar from a paper tray.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '02-sea-calling',
      label: 'A feeling from the sea',
      image: scene2,
      alt: 'Odette stops and looks out to the sparkling sea, one hand over her heart, with her poffertjes resting on a bench.',
      tone: 'ocean',
      aspectRatio: 1254 / 1254,
      maxWidth: 900,
      motion: 'slow-zoom',
    },
    {
      id: '03-leap',
      label: 'Into the sea',
      image: scene3,
      alt: 'Odette jumps from a low seaside rock into the sea as magical sparkles appear around her feet.',
      tone: 'ocean',
      aspectRatio: 1024 / 1536,
      maxWidth: 900,
      motion: 'still',
    },
    {
      id: '04-transformation',
      label: 'Mermaid Odette',
      image: scene4,
      alt: 'Underwater, Odette discovers her new lavender and aqua mermaid tail and pearly seashell bodice, surrounded by a swirl of magic.',
      tone: 'ocean',
      aspectRatio: 1086 / 1448,
      maxWidth: 900,
      motion: 'slow-zoom',
    },
    {
      id: '05-rainbow',
      effect: 'underwater-meeting',
      label: 'Meeting Rainbow Ping',
      image: scene5,
      alt: 'Mermaid Odette meets Rainbow Ping and they greet each other beside colourful coral.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '06-primarina-aqua',
      effect: 'underwater-meeting',
      label: 'Meeting Primarina and Aquafox',
      image: scene6,
      alt: 'Odette waves to PrimarinaPing, holding her gold trident, and Aquafox Ping.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '07-tangy-sweet',
      effect: 'underwater-meeting',
      label: 'Meeting Tangy and Sweet',
      image: scene7,
      alt: 'Odette meets yellow-haired Tangy Ping and cream-haired Sweet Ping under a coral arch.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '08-eclipse-diana',
      effect: 'underwater-meeting',
      label: 'Meeting Eclipse and Diana',
      image: scene8,
      alt: 'Odette greets Eclipse Ping in her dark purple crown and Diana Ping in her tall golden crown.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '09-hop-doremi',
      effect: 'underwater-meeting',
      label: 'Meeting Hopping and Doremi',
      image: scene9,
      alt: 'Odette meets bunny-eared Hopping and Doremi Ping, who sings and strums her pink guitar.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '10-playing',
      label: 'Playing together',
      image: scene10,
      alt: 'All ten friends play happily together underwater. Doremi sings and plays guitar, Hopping skips, and their friends swim, dance and play with bubbles.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '11-distant-castle',
      label: 'The castle in the distance',
      image: scene11,
      alt: 'The ten friends travel together along a coral-lined route toward a beautiful pearly castle in the distance.',
      tone: 'ocean',
      motion: 'slow-zoom',
    },
    {
      id: '12-castle-close',
      label: 'The beautiful castle',
      image: scene12,
      alt: 'The friends look up at the enormous castle, with pink towers, golden spires and a turquoise shell-shaped entrance.',
      tone: 'ocean',
      aspectRatio: 1086 / 1448,
      maxWidth: 900,
      motion: 'slow-zoom',
    },
    {
      id: '13-entering',
      label: 'Inside the castle',
      image: scene13,
      alt: 'All ten friends enter through the open shell-shaped doorway into a glowing pearl hall, led by Odette, PrimarinaPing and Aquafox.',
      tone: 'ocean',
      motion: 'slow-zoom',
    },
    {
      id: '14-ice-creams',
      effect: 'ice-cream-scene',
      label: 'Making ice creams',
      image: scene14,
      alt: 'In the pearl castle kitchen, the little coral helper floats while scooping strawberry ice cream into a cone. Beside it, the floating lavender crystal helper adds sprinkles to another ice cream.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '15-speed-cleaning',
      effect: 'cleaning-scene',
      label: 'Super-fast cleaning',
      image: scene15,
      alt: 'The yellow helper swoops through the castle dusting golden shell decorations while the mint helper with a teal forehead curl zooms above the floor with a mop. Sweeping trails and sparkles show their super-fast cleaning.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '16-painting-decorations',
      label: 'Pictures for the castle',
      image: scene16,
      alt: 'The aqua helper with navy eye patches and the pink heart-faced helper float happily beside easels, painting colourful fish, rainbows, hearts and seashells to decorate the castle. Finished pictures hang on the pearl walls.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '17-tidying',
      effect: 'tidying-scene',
      label: 'Tidying together',
      image: scene17,
      alt: 'The lilac helper with curled purple ears floats beside a shelf, tidying picture books and toys. In the background the other six helpers make ice creams, dust, mop and paint decorations in the pearl castle.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '18-hello-helpers',
      label: 'Hello, little helpers',
      image: scene18,
      alt: 'Mermaid Odette and Rainbow Ping smile and wave hello to their seven little floating helpers, who pause their chores and happily wave back.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '19-adventure-invitation',
      label: 'An invitation to adventure',
      image: scene19,
      alt: 'At the open castle doorway, mermaid Odette points toward a wondrous sea of colourful coral, shimmering fish and distant rock arches. Rainbow Ping opens her hand invitingly as their seven little helpers gather eagerly to join the adventure.',
      tone: 'ocean',
      motion: 'slow-zoom',
    },
    {
      id: '20-diamond-mine',
      label: 'A nearby diamond mine',
      image: scene20,
      alt: 'A short coral-lined path leads from the nearby castle to a sparkling diamond mine. Mermaid Odette, Rainbow Ping and their seven floating helpers arrive and marvel at the abundant diamonds.',
      tone: 'ocean',
      motion: 'slow-zoom',
    },
    {
      id: '21-gathering-diamonds',
      label: 'So many diamonds',
      image: scene21,
      alt: 'Inside the glittering mine, all seven helpers help Odette and Rainbow gather diamonds. They pick up gems, pass them to one another and carry baskets overflowing with sparkling diamonds, with the castle visible through the entrance.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '22-making-diamond-room',
      label: 'Making a diamond room',
      image: scene22,
      alt: 'Back in her castle, mermaid Odette fits the gathered diamonds into golden wall settings, transforming a pearl room with diamond columns, a sparkling chandelier and a jewelled floor.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '23-diamond-room',
      label: 'A room full of reflections',
      image: scene23,
      alt: 'Odette admires her completed diamond room, bright with rainbow light and sparkling facets. Many reflections of her appear in the diamond walls and polished floor beneath a glittering chandelier.',
      tone: 'ocean',
      motion: 'slow-zoom',
    },
    {
      id: '24-brushing-teeth',
      label: 'Brushing before bed',
      image: scene24,
      alt: 'At night, all ten friends brush their teeth at shell basins, wearing cosy pyjamas. Their crowns are put away and their daytime clothes are neatly folded.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '25-helpers-brushing',
      label: 'Little helpers brush too',
      image: scene25,
      alt: 'The seven little helpers brush their teeth with tiny colourful toothbrushes, wearing matching sleepsuits in the softly lit castle washroom.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '26-primarina-aquafox-bedtime',
      label: 'Sea dreams',
      image: scene26,
      alt: "Primarina Ping and Aquafox Ping sleep in separate shell beds under fish-and-shell quilts, with fish mobiles, coral nightlights and Primarina's gold trident stored on the wall.",
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '27-tangy-sweet-bedtime',
      label: 'Sweet dreams',
      image: scene27,
      alt: 'Tangy and Sweet sleep in separate beds, surrounded by citrus stars and pink hearts. Their wands and crowns rest on a shelf.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '28-eclipse-diana-bedtime',
      label: 'Stars and flowers',
      image: scene28,
      alt: 'Eclipse sleeps under an indigo star quilt while Diana rests beneath a daisy quilt in their shared room. Their crowns sit on cushions above the beds.',
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '29-hopping-doremi-bedtime',
      label: 'A quiet lullaby',
      image: scene29,
      alt: "Hopping and Doremi sleep in their own beds in a room decorated with bunnies, stars and music. A skipping rope and Doremi's pink guitar are neatly put away.",
      tone: 'ocean',
      aspectRatio: 1536 / 1024,
      motion: 'still',
    },
    {
      id: '30-helper-nursery',
      label: 'Seven sleepy helpers',
      image: scene30,
      alt: 'All seven little helpers sleep in seven colour-matched beds together in one cosy nursery, beneath a shell-and-star mobile.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '31-odette-rainbow-bedtime',
      label: 'Resting for a new day',
      image: scene31,
      alt: "Mermaid Odette and Rainbow Ping sleep peacefully in separate beds. Odette's tail curls beneath lavender bedding, while Rainbow rests under a rainbow quilt. Soft diamond lights glow as everyone rests before a new day.",
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '31a-morning-wake-up',
      effect: 'morning-rooms',
      label: 'Good morning, everyone',
      image: morningWake,
      alt: 'Morning sunlight fills the castle. Six little scenes show Odette and Rainbow, Primarina and Aquafox, Tangy and Sweet, Eclipse and Diana, Hopping and Doremi, and all seven helpers stretching and waking in their shared rooms.',
      tone: 'ocean',
      aspectRatio: 1.5,
      maxWidth: 1250,
      motion: 'still',
    },
    {
      id: '31b-ice-cream-breakfast',
      label: 'Ice cream for breakfast',
      image: morningBreakfast,
      alt: 'All ten friends enjoy colourful ice cream for breakfast around a curved pearl table in the sunny castle. Their seven little helpers float above them, each enjoying a tiny ice cream too.',
      tone: 'ocean',
      motion: 'still',
    },
    {
      id: '32-magic-mirror',
      label: 'The magic mirror',
      image: scene32,
      alt: 'Mermaid Odette, Diana and Eclipse gaze into an ornate golden magic mirror, where their reflections shimmer among pastel swirls. All seven little house helpers float around them in the pearl castle.',
      tone: 'ocean',
      motion: 'slow-zoom',
    },
    {
      id: '33-pink-portal',
      label: 'A pink portal opens',
      image: scene33,
      alt: 'The mirror swirls pink and opens into a sparkling magical portal. Mermaid Odette, Diana and Eclipse watch in wonder, with all seven little helpers floating around them.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '34-swept-into-portal',
      label: 'Swept into the portal',
      image: scene34,
      alt: 'A rushing pink magical current pulls mermaid Odette, Eclipse, Diana and all seven little helpers into the mirror portal. Their hair, skirts and tails stream behind them as sparkling trails spiral into the opening.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '35-sky-castle-arrival',
      label: 'Outside the sky castle',
      image: scene35,
      alt: 'The friends emerge outside the open front doors of a magnificent castle among the clouds, with the pink portal glowing behind them. Odette has become Angel Odette, with a lavender dress, legs and white feathered wings. Eclipse has purple starry wings and Diana has white and gold wings. All seven little helpers fly around them above the entrance steps.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '36-aururo-welcome',
      label: 'Aurora welcomes her visitors',
      image: scene36,
      alt: 'Aurora Ping greets the friends on the sky castle terrace and apologises for bringing them to the sky. Behind her stand four mysterious figures, their identities hidden in shadow.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '37-playground-surprise',
      effect: 'air-scene',
      label: 'A wonderful playground surprise',
      image: scene37,
      alt: 'Surprise! Nothing bad is happening. Aurora has finished an amazing new sky playground and could not wait to invite all her friends. She reveals a rainbow slide, shell swings, cloud trampolines, a roundabout and climbing bridges. The four mysterious visitors are now visible in full colour beside her.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '38-rainbow-slide',
      effect: 'air-scene',
      label: 'The rainbow slide',
      image: scene38,
      alt: 'Angel Odette and Aurora play along the rainbow slide while the little coral helper floats beside them.',
      tone: 'lavender',
      aspectRatio: 1448 / 1086,
      motion: 'still',
    },
    {
      id: '39-shell-swings',
      effect: 'air-scene',
      label: 'The shell swings',
      image: scene39,
      alt: 'Eclipse and Diana enjoy the two pink shell swings, with the crystal helper hovering nearby.',
      tone: 'lavender',
      aspectRatio: 1448 / 1086,
      motion: 'still',
    },
    {
      id: '40-rainbow-stepping-stones',
      effect: 'air-scene',
      label: 'Rainbow stepping stones',
      image: scene40,
      alt: 'The green masked visitor and the blue crystal-shelled visitor hop between colourful stepping stones.',
      tone: 'lavender',
      aspectRatio: 1448 / 1086,
      motion: 'still',
    },
    {
      id: '41-cloud-roundabout',
      effect: 'air-scene',
      label: 'A spin on the roundabout',
      image: scene41,
      alt: 'The pink hammer-carrying visitor and the blue violet visitor ride the rainbow roundabout together.',
      tone: 'lavender',
      aspectRatio: 1448 / 1086,
      motion: 'still',
    },
    {
      id: '42-cloud-trampolines',
      effect: 'air-scene',
      label: 'Bouncing on clouds',
      image: scene42,
      alt: 'The yellow helper and the mint helper with a teal forehead curl bounce above their cloud trampolines.',
      tone: 'lavender',
      aspectRatio: 1448 / 1086,
      motion: 'still',
    },
    {
      id: '43-climbing-bridge',
      effect: 'air-scene',
      label: 'Across the climbing bridge',
      image: scene43,
      alt: 'The lilac, cyan navy-mask and pink heart-faced helpers cross the rainbow rope bridge together.',
      tone: 'lavender',
      aspectRatio: 1448 / 1086,
      motion: 'still',
    },
    {
      id: '44-dingdong-invitation',
      effect: 'dingdong-arrival-scene',
      label: 'Dingdong invites her friends to space',
      image: scene44,
      alt: 'Dingdong Ping flies into the sky playground on her rocket pack, waving and inviting Odette, Aurora and Eclipse to space. The three friends greet her eagerly beneath a glowing view of a ringed planet, moon and stars.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '45-ready-for-space',
      label: 'Matching spacesuits',
      image: scene45,
      alt: 'Dingdong secures the shoulder strap of Aurora’s back-mounted rocket pack. Odette adjusts her cat-ear helmet while Eclipse checks a wrist control. All four wear matching yellow spacesuits with pink-and-yellow rocket packs attached to their backs.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '46-star-planet',
      label: 'The sparkling star planet',
      image: scene46,
      alt: 'A golden five-point star-shaped planet glows among purple and blue nebulae, encircled by two crossing rings of sparkling white stardust.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '47-flight-to-star-planet',
      effect: 'space-flight-scene',
      label: 'Flying to the star planet',
      image: scene47,
      alt: 'Dingdong leads blue-eyed Odette, pink-haired Aurora and lavender-haired Eclipse through space toward the golden star planet. Their matching yellow spacesuits have clear helmets and pink-and-yellow rockets strapped to their backs, leaving sparkling trails behind them.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '48-star-planet-friends',
      label: 'Two new friends on the star planet',
      image: scene48,
      alt: 'Dingdong, blue-eyed Odette, Aurora and Eclipse greet two new friends on the golden star planet: a round pink friend with red feet and a turquoise friend with enormous coral-lined ears and a flowing tail. All four travellers wear yellow spacesuits with rockets on their backs, beneath sparkling orbital rings.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '49-pop-star-system',
      effect: 'star-system-scene',
      label: 'Planet Pop Star at the centre',
      image: scene49,
      alt: 'Golden Planet Pop Star sits at the centre of sparkling orbital paths surrounded by colourful whimsical worlds. Far behind it, a pastel princess castle floats on a cloud-covered island with a rainbow waterfall.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '50-flight-to-princess-castle',
      effect: 'space-flight-scene',
      label: 'Five friends fly to the princess castle',
      image: scene50,
      alt: 'Odette, Aurora and Eclipse fly with rockets strapped to their backs beside their round pink and turquoise long-eared friends. The five approach the princess castle on a separate cloud-wrapped planet with a rainbow waterfall, leaving golden Pop Star far behind.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '51-princess-castle-door',
      label: 'At the princess castle doors',
      image: scene51,
      alt: 'Odette, Aurora, Eclipse and their pink round and turquoise long-eared friends stand together on the shining castle terrace. Odette raises a hand toward the enormous closed golden doors decorated with a star, while the others look up eagerly. The three Teenie Pings still wear their yellow spacesuits and back-mounted rocket packs.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '52-dark-castle-entry',
      label: 'Into the dark castle',
      image: scene52,
      alt: 'The golden doors open and Odette leads Aurora, Eclipse and their pink round and turquoise long-eared friends into a dark castle hall. Light from the entrance spills across the floor behind them, casting long shadows toward unlit columns as the five look ahead curiously.',
      tone: 'blue',
      motion: 'slow-zoom',
    },
    {
      id: '53-cloaked-visitor-on-table',
      label: 'A cloaked visitor on the table',
      image: scene53,
      alt: 'A small figure wrapped in a deep-blue cloak sits on a gold-trimmed table in the dark castle. Yellow eyes shine beneath his silver mask, with a mint crest and curved gold-edged ornaments above. Warm light from the doorway reaches across the shadowy hall.',
      tone: 'blue',
      motion: 'still',
    },
    {
      id: '54-birthday-surprise',
      label: 'Surprise birthday celebration',
      image: scene54,
      alt: 'The whole castle lights up for a surprise birthday party. Odette, Aurora, Eclipse and many Teenie Ping friends gather around a candle-lit cake while seven little helpers float among balloons and streamers. Two Waddle Dees, Magolor and the blue and pink round guests join the celebration.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '55-birthday-cake',
      label: 'Around the birthday cake',
      image: scene55,
      alt: 'Friends admire the glowing birthday candles on a pastel cake. Odette, Aurora, Eclipse, Rainbow, Diana, Hop, Doremi, Tangy and Sweet smile as the helpers carry ribbons and a little plate. The two Waddle Dees, Magolor and their blue and pink friends celebrate in front.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '56-birthday-dancing',
      label: 'Music and dancing in the castle',
      image: scene56,
      alt: 'Doremi plays her pink guitar while Hop, Rainbow, Diana, Tangy and Sweet dance, with Primarina and Aquafox floating nearby. Little castle helpers fly among balloons and streamers. The two Waddle Dees, Magolor and the blue and pink guests enjoy the party, with birthday candles shining behind them.',
      tone: 'lavender',
      motion: 'slow-zoom',
    },
    {
      id: '57-birthday-group-photo',
      label: 'Everyone poses for a birthday photograph',
      image: scene57,
      alt: 'Everyone smiles and waves toward the camera for a birthday group photo. Meta Knight strikes a dramatic pose at the front with his sword raised and cape sweeping behind him, looking very pleased with himself. The Teenie Pings, seven floating helpers, Kirby, the turquoise long-eared friend, two Waddle Dees, Magolor and the blue and pink round friends gather in the brightly decorated castle.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '58-odette-polaroid',
      effect: 'photo-moment',
      label: 'Odette holds the birthday photograph',
      image: scene58,
      alt: 'After a camera click and flash, the group photograph becomes a white-bordered instant print. Odette smiles in her yellow space suit, proudly holding the photo of all her friends with both hands.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '59-goodbye-space-friends',
      label: 'Goodbye to their space friends',
      image: scene59,
      alt: 'Outside the golden star doors of the princess castle, Odette, Aurora and Eclipse smile and wave goodbye in their yellow space suits. Their pink-and-white rockets are strapped to their backs. Kirby and their turquoise long-eared friend wave back from the sparkling castle terrace.',
      tone: 'lavender',
      motion: 'still',
    },
    {
      id: '60-flying-home-to-earth',
      label: 'Flying home to Earth',
      image: scene60,
      alt: 'Odette leads Aurora and Eclipse through a sparkling star-filled sky toward the blue Earth. Their back-mounted rockets leave golden trails, while the princess castle grows distant behind them. The three friends smile as oceans, continents and white clouds come into view.',
      tone: 'blue',
      motion: 'slow-zoom',
    },
    {
      id: '61-fossil-dig',
      label: 'An important job: digging for fossils',
      image: scene61,
      alt: 'Back on Earth, Odette is a normal girl again, wearing her lavender jumper and heart-patterned leggings. She carefully brushes sand from a spiral ammonite fossil. Eclipse, in her original purple outfit and dark crystal crown, digs beside her with a small trowel. Diana, in her pale blue dress and golden crown, examines their finds with a magnifying glass. The three work together at a sunny, shallow fossil dig.',
      tone: 'lavender',
      motion: 'still',
    },
  ]),
}
