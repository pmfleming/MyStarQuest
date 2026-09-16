import { createAssetResolver } from './assetCatalog'
import { DINOSAUR_CLUES, type DinosaurClues } from './dinosaurClues'

type DinosaurProfile = {
  name: string
  assetId: keyof typeof DINOSAUR_CLUES
  displayName: string
  pronunciation: string
  character: string
  tentativeMatch?: boolean
  group: 'Dinosaur' | 'Pterosaur'
  feature: string
  food: string
  period: 'Late Jurassic' | 'Late Cretaceous'
  family: string
  compare: string
  source: string
}

const directory = 'https://www.nhm.ac.uk/discover/dino-directory/'

const profiles: DinosaurProfile[] = [
  {
    name: 'ankylosaurus',
    assetId: 'ankylosaurus',
    displayName: 'Ankylosaurus',
    pronunciation: 'ang-KY-loh-SORE-us',
    character: 'Roger',
    group: 'Dinosaur',
    feature: 'Bony armor on my back and a heavy club at the end of my tail.',
    food: 'Plants. I nibbled vegetation close to the ground.',
    period: 'Late Cretaceous',
    family: 'An armored dinosaur that walked on four legs.',
    compare:
      'Find the tail club in both pictures. It is different from a Stegosaurus’s tail spikes.',
    source: `${directory}ankylosaurus.html`,
  },
  {
    name: 'brontosaurus',
    assetId: 'brontosaurus',
    displayName: 'Brontosaurus',
    pronunciation: 'BRON-toh-SORE-us',
    character: 'Emily',
    tentativeMatch: true,
    group: 'Dinosaur',
    feature: 'A very long neck, a small head and four sturdy legs.',
    food: 'Plants. My huge body needed lots of vegetation.',
    period: 'Late Jurassic',
    family: 'A sauropod: a dinosaur with a long neck and tail.',
    compare:
      'The cartoon has a banana-shaped body. Find the long neck in the reconstruction.',
    source:
      'https://www.nhm.ac.uk/discover/brontosaurus-reinstating-a-prehistoric-icon.html',
  },
  {
    name: 'pachycephalosaurus',
    assetId: 'pachycephalosaurus',
    displayName: 'Pachycephalosaurus',
    pronunciation: 'pack-ee-KEF-ah-loh-SORE-us',
    character: 'Barry',
    group: 'Dinosaur',
    feature: 'A thick, rounded dome on top of my skull.',
    food: 'Probably plants. Scientists are still studying my diet.',
    period: 'Late Cretaceous',
    family: 'A dome-headed dinosaur that walked on two legs.',
    compare:
      'Spot the rounded skull. The real animal’s neck was much shorter than Barry’s.',
    source: `${directory}pachycephalosaurus.html`,
  },
  {
    name: 'parasaurolophus',
    assetId: 'parasaurolophus',
    displayName: 'Parasaurolophus',
    pronunciation: 'pa-ra-saw-ROL-off-us',
    character: 'The green hadrosaur',
    tentativeMatch: true,
    group: 'Dinosaur',
    feature: 'A duck-like bill and a long crest curving back from my head.',
    food: 'Plants. I used many teeth to grind up leaves.',
    period: 'Late Cretaceous',
    family: 'A hadrosaur: a duck-billed dinosaur.',
    compare:
      'Look for the curved head crest. It is different from Barry’s rounded dome.',
    source: `${directory}parasaurolophus.html`,
  },
  {
    name: 'pteranodon',
    assetId: 'pteranodon',
    displayName: 'Pteranodon',
    pronunciation: 'teh-RAN-oh-don',
    character: 'Charlotte',
    tentativeMatch: true,
    group: 'Pterosaur',
    feature:
      'A long toothless beak, wide wings and a backward-pointing head crest.',
    food: 'Fish. I searched for food over ancient seas.',
    period: 'Late Cretaceous',
    family: 'A pterosaur: a flying reptile, not a dinosaur.',
    compare:
      'The real animal had a toothless beak and skin-covered wings, not bird wings.',
    source:
      'https://www.amnh.org/explore/ology/ology-cards/358-pteranodon-longiceps',
  },
  {
    name: 'quetzalcoatlus',
    assetId: 'quetzalcoatlus',
    displayName: 'Quetzalcoatlus',
    pronunciation: 'ket-sal-koh-AT-lus',
    character: 'Quentin',
    group: 'Pterosaur',
    feature: 'An extremely long neck, a pointed beak and enormous wings.',
    food: 'Animals. Scientists are still working out exactly what I ate.',
    period: 'Late Cretaceous',
    family: 'A pterosaur: a flying reptile, not a dinosaur.',
    compare:
      'Compare its long neck with Pteranodon’s. It could also walk on the ground.',
    source:
      'https://news.utexas.edu/2021/12/08/worlds-largest-pterosaur-leaped-aloft-to-fly/',
  },
  {
    name: 'stegosaurus',
    assetId: 'stegosaurus',
    displayName: 'Stegosaurus',
    pronunciation: 'STEG-oh-SORE-us',
    character: 'The yellow Stegosaurus',
    group: 'Dinosaur',
    feature: 'Two rows of tall back plates and sharp spikes on my tail.',
    food: 'Plants. I browsed on low-growing vegetation.',
    period: 'Late Jurassic',
    family: 'A plated dinosaur that walked on four legs.',
    compare:
      'Find the back plates and tail spikes. Ankylosaurus has a tail club instead.',
    source: `${directory}stegosaurus.html`,
  },
  {
    name: 'triceratops',
    assetId: 'triceratops',
    displayName: 'Triceratops',
    pronunciation: 'try-SERR-ah-tops',
    character: 'The blue Triceratops',
    group: 'Dinosaur',
    feature: 'Three face horns and a wide bony frill behind my head.',
    food: 'Plants. My beak helped me snip vegetation.',
    period: 'Late Cretaceous',
    family: 'A horned dinosaur that walked on four legs.',
    compare: 'Count the horns: two above the eyes and one on the nose.',
    source: `${directory}triceratops.html`,
  },
  {
    name: 'tyrannosaurus-rex',
    assetId: 'tyrannosaurus',
    displayName: 'Tyrannosaurus rex',
    pronunciation: 'tie-RAN-oh-SORE-us reks',
    character: 'Janet and the T. rex family',
    group: 'Dinosaur',
    feature: 'Huge jaws, powerful back legs and tiny arms with two fingers.',
    food: 'Meat. My strong jaws could crush bone.',
    period: 'Late Cretaceous',
    family: 'A theropod: a dinosaur that walked on two legs.',
    compare:
      'T. rex is the short name. Find the tiny arms and the long balancing tail.',
    source: `${directory}tyrannosaurus.html`,
  },
  {
    name: 'velociraptor',
    assetId: 'velociraptor',
    displayName: 'Velociraptor',
    pronunciation: 'veh-LOSS-ee-RAP-tor',
    character: 'Bigby / Begbie',
    tentativeMatch: true,
    group: 'Dinosaur',
    feature: 'Feathers and a large curved claw on each back foot.',
    food: 'Meat. I ate other animals.',
    period: 'Late Cretaceous',
    family: 'A small feathered theropod that walked on two legs.',
    compare:
      'Real Velociraptor had feathers. Look for the large claw held above the ground.',
    source:
      'https://www.amnh.org/explore/news-blogs/velociraptor-feather-evidence',
  },
]

const images = import.meta.glob<string>('../assets/dinosaurs/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
})
const requiredImage = createAssetResolver(
  images,
  '../assets/dinosaurs/',
  'Missing dinosaur image',
  '.png'
)

export type DinosaurKnowledge = DinosaurProfile &
  DinosaurClues & {
    kind: 'prehistoric'
    image: string
    realisticImage: string
    foodImage: string
    habitatImage: string
    periodImage: string
    abilityImage: string
  }

export const DINOSAUR_KNOWLEDGE: DinosaurKnowledge[] = profiles.map(
  (profile) => {
    const clues = DINOSAUR_CLUES[profile.assetId]
    return {
      ...profile,
      ...clues,
      kind: 'prehistoric',
      image: requiredImage(`cartoon/${profile.assetId}`),
      realisticImage: requiredImage(`realistic/${profile.assetId}`),
      foodImage: requiredImage(`food/${clues.foodCategory}`),
      habitatImage: requiredImage(`habitat/${clues.habitatCategory}`),
      periodImage: requiredImage(
        `period/${profile.period.toLowerCase().replace(/ /g, '-')}`
      ),
      abilityImage: requiredImage(`abilities/${profile.assetId}`),
    }
  }
)
