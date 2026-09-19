import { createAssetResolver } from './assetCatalog'
import { DINOSAUR_CLUES, type DinosaurClues } from './dinosaurClues'

type DinosaurProfile = {
  name: string
  assetId: keyof typeof DINOSAUR_CLUES
  displayName: string
  pronunciation: string
  character: string
  tentativeMatch?: boolean
  group:
    'Dinosaur' | 'Pterosaur' | 'Synapsid' | 'Ammonite' | 'Shark' | 'Squamate'
  feature: string
  food: string
  period:
    | 'Early Permian'
    | 'Late Jurassic'
    | 'Early Cretaceous'
    | 'Late Cretaceous'
    | 'Neogene'
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
    name: 'allosaurus',
    assetId: 'allosaurus',
    displayName: 'Allosaurus',
    pronunciation: 'AL-oh-SORE-us',
    character: 'Pilot creature-list entry',
    tentativeMatch: true,
    group: 'Dinosaur',
    feature:
      'Small crests above my eyes and three clawed fingers on each hand.',
    food: 'Meat. I ate other dinosaurs and animals.',
    period: 'Late Jurassic',
    family: 'A theropod: a dinosaur that walked on two legs.',
    compare: 'Count three fingers on each hand. T. rex had only two.',
    source: `${directory}allosaurus.html`,
  },
  {
    name: 'baculites',
    assetId: 'baculites',
    displayName: 'Baculites',
    pronunciation: 'BACK-yoo-LY-teez',
    character: 'Annabel, the shelled creature',
    tentativeMatch: true,
    group: 'Ammonite',
    feature: 'A long, nearly straight shell with chambers inside.',
    food: 'Animal plankton: tiny drifting animals, including small crustaceans.',
    period: 'Late Cretaceous',
    family: 'An ammonite: a sea animal related to squid, not a dinosaur.',
    compare:
      'The cartoon shell is twisted. Real Baculites had a nearly straight shell.',
    source: 'https://www.amnh.org/explore/news-blogs/ammonites-plankton-diet',
  },
  {
    name: 'brachiosaurus',
    assetId: 'brachiosaurus',
    displayName: 'Brachiosaurus',
    pronunciation: 'BRAK-ee-oh-SORE-us',
    character: 'Nellie and the PAW Patrol movie brachiosaurs',
    group: 'Dinosaur',
    feature: 'A long raised neck and front legs longer than my back legs.',
    food: 'Plants. I reached leaves high up in trees.',
    period: 'Late Jurassic',
    family: 'A sauropod: a large dinosaur with a long neck and tail.',
    compare:
      'Look for the high shoulders and longer front legs. Brontosaurus had a more level back.',
    source: `${directory}brachiosaurus.html`,
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
    name: 'dimetrodon',
    assetId: 'dimetrodon',
    displayName: 'Dimetrodon',
    pronunciation: 'dye-MET-roh-don',
    character: 'Dimitri',
    group: 'Synapsid',
    feature: 'A tall back sail and large and small teeth in the same jaws.',
    food: 'Meat. My prey included large amphibians.',
    period: 'Early Permian',
    family:
      'A non-mammalian synapsid, related more closely to mammals than to dinosaurs.',
    compare:
      'Find the sail in both pictures. Scientists still debate what it was used for.',
    source: 'https://whatsinaname.hmnh.harvard.edu/dimetrodon',
  },
  {
    name: 'mahakala',
    assetId: 'mahakala',
    displayName: 'Mahakala',
    pronunciation: 'mah-hah-KAH-lah',
    character: 'The small orange dinosaur in PAW Patrol: The Dino Movie',
    group: 'Dinosaur',
    feature: 'A tiny body, short arms, a long tail and curved foot claws.',
    food: 'Small animals were likely food, but my exact diet is uncertain.',
    period: 'Late Cretaceous',
    family: 'A tiny dromaeosaurid: a relative of Velociraptor.',
    compare:
      'The cartoon has smooth skin. The reconstruction has feathers inferred from close relatives.',
    source: 'https://doi.org/10.1206/3722.2',
  },
  {
    name: 'otodus-megalodon',
    assetId: 'megalodon',
    displayName: 'Otodus megalodon',
    pronunciation: 'OH-toh-dus MEG-ah-loh-don',
    character: 'Megan',
    tentativeMatch: true,
    group: 'Shark',
    feature: 'Huge triangular teeth with saw-like edges.',
    food: 'Meat. I ate marine animals, including whales and large fish.',
    period: 'Neogene',
    family: 'An extinct shark: a fish, not a dinosaur.',
    compare:
      'The cartoon has a round belly. The real shark may have been much more slender.',
    source:
      'https://www.nhm.ac.uk/discover/megalodon--the-truth-about-the-largest-shark-that-ever-lived.html',
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
    name: 'spinosaurus',
    assetId: 'spinosaurus',
    displayName: 'Spinosaurus',
    pronunciation: 'SPINE-oh-SORE-us',
    character: 'Janice, the PAW Patrol movie Spinosaurus',
    group: 'Dinosaur',
    feature: 'A tall back sail, long narrow jaws and a deep paddle-like tail.',
    food: 'Fish and possibly other animals. My cone-shaped teeth helped hold slippery food.',
    period: 'Late Cretaceous',
    family: 'A spinosaurid: a large meat-eating theropod dinosaur.',
    compare:
      'Find the long snout and sail. The reconstruction has shorter back legs and a deeper tail.',
    source: `${directory}spinosaurus.html`,
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
    name: 'tetrapodophis',
    assetId: 'tetrapodophis',
    displayName: 'Tetrapodophis',
    pronunciation: 'tet-ra-POD-oh-fiss',
    character: 'The limbed snake (tentative match)',
    tentativeMatch: true,
    group: 'Squamate',
    feature: 'A very long body with four tiny limbs.',
    food: 'Probably small animals. My exact diet is uncertain.',
    period: 'Early Cretaceous',
    family:
      'A snake-like squamate reptile, not a dinosaur. Its identification as a snake is disputed.',
    compare:
      'Look for four tiny limbs. The reconstruction follows a lizard-like interpretation.',
    source:
      'https://ssl.eas.ualberta.ca/cms/download/file/papers/paper_525.pdf',
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
