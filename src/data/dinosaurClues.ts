export type DinosaurClues = {
  foodCategory: 'plants' | 'meat' | 'fish' | 'plankton'
  foodWord: string
  habitatCategory:
    'woodland' | 'floodplain' | 'coast' | 'wetland' | 'desert' | 'ocean'
  habitatWord: string
  habitatText: string
  ability: string
  abilityText: string
  genericAbility: string
}

// Broad habitat reconstructions, not claims that an animal lived only here.
// "Ability" includes distinctive anatomy where behavior remains uncertain.
export const DINOSAUR_CLUES = {
  allosaurus: {
    foodCategory: 'meat',
    foodWord: 'Meat',
    habitatCategory: 'floodplain',
    habitatWord: 'River plains',
    habitatText:
      'I lived on ancient river plains with forests and seasonal dry spells.',
    ability: 'Gripping hands',
    abilityText:
      'Each hand had three curved claws that could help me hold prey.',
    genericAbility: 'grip',
  },
  baculites: {
    foodCategory: 'plankton',
    foodWord: 'Animal plankton',
    habitatCategory: 'ocean',
    habitatWord: 'Seas',
    habitatText: 'I lived in ancient seas. I was an ammonite, not a dinosaur.',
    ability: 'Protective shell',
    abilityText:
      'My hard shell sheltered my soft body. It was long and nearly straight.',
    genericAbility: 'shell',
  },
  dimetrodon: {
    foodCategory: 'meat',
    foodWord: 'Meat',
    habitatCategory: 'wetland',
    habitatWord: 'Wetlands',
    habitatText:
      'I lived in seasonally wet landscapes with rivers and swamps, before the dinosaurs.',
    ability: 'Two tooth sizes',
    abilityText:
      'Large and small teeth helped me grip and tear food. My name refers to these two tooth sizes.',
    genericAbility: 'bite',
  },
  megalodon: {
    foodCategory: 'meat',
    foodWord: 'Meat',
    habitatCategory: 'ocean',
    habitatWord: 'Seas',
    habitatText:
      'I swam in warm seas around the world. I was a shark, not a dinosaur.',
    ability: 'Serrated teeth',
    abilityText:
      'My huge triangular teeth had saw-like edges that could slice food.',
    genericAbility: 'bite',
  },
  tetrapodophis: {
    foodCategory: 'meat',
    foodWord: 'Small animals?',
    habitatCategory: 'coast',
    habitatWord: 'Coastal water?',
    habitatText:
      'Some researchers think I lived in shallow coastal water. My lifestyle is still debated.',
    ability: 'Flexible body',
    abilityText:
      'My long backbone could bend into curves. I also had four tiny limbs.',
    genericAbility: 'squeeze',
  },
  ankylosaurus: {
    foodCategory: 'plants',
    foodWord: 'Plants',
    habitatCategory: 'woodland',
    habitatWord: 'Woodlands',
    habitatText: 'I lived in warm, wooded landscapes in ancient North America.',
    ability: 'Body armor',
    abilityText: 'Bony armor covered my body. I also had a heavy tail club.',
    genericAbility: 'armour',
  },
  brontosaurus: {
    foodCategory: 'plants',
    foodWord: 'Plants',
    habitatCategory: 'floodplain',
    habitatWord: 'River plains',
    habitatText:
      'I lived on ancient river plains with trees, ferns and seasonal dry spells.',
    ability: 'Long reach',
    abilityText:
      'My long neck helped me reach plants while my body stayed in one place.',
    genericAbility: 'reach',
  },
  pachycephalosaurus: {
    foodCategory: 'plants',
    foodWord: 'Plants?',
    habitatCategory: 'woodland',
    habitatWord: 'Woodlands',
    habitatText:
      'I lived in warm, humid landscapes with many plants in ancient North America.',
    ability: 'Thick skull',
    abilityText:
      'I had a thick bony dome on my skull. Scientists still debate how I used it.',
    genericAbility: 'dome',
  },
  parasaurolophus: {
    foodCategory: 'plants',
    foodWord: 'Plants',
    habitatCategory: 'floodplain',
    habitatWord: 'River plains',
    habitatText:
      'I lived in ancient North American landscapes with rivers and wooded plains.',
    ability: 'Crest calls',
    abilityText:
      'My hollow head crest probably helped make deep, echoing calls.',
    genericAbility: 'roar',
  },
  pteranodon: {
    foodCategory: 'fish',
    foodWord: 'Fish',
    habitatCategory: 'coast',
    habitatWord: 'Seacoasts',
    habitatText:
      'I flew over an ancient inland sea and its coasts. I was a pterosaur, not a dinosaur.',
    ability: 'Soaring',
    abilityText: 'My long skin-covered wings helped me soar above the sea.',
    genericAbility: 'fly',
  },
  quetzalcoatlus: {
    foodCategory: 'meat',
    foodWord: 'Animals',
    habitatCategory: 'wetland',
    habitatWord: 'Wetlands',
    habitatText:
      'My home included evergreen forests and wetlands in ancient Texas. I was a pterosaur, not a dinosaur.',
    ability: 'Giant wings',
    abilityText: 'My enormous skin-covered wings carried me through the air.',
    genericAbility: 'fly',
  },
  stegosaurus: {
    foodCategory: 'plants',
    foodWord: 'Plants',
    habitatCategory: 'floodplain',
    habitatWord: 'River plains',
    habitatText:
      'I lived on ancient river plains with ferns and scattered trees.',
    ability: 'Tail spikes',
    abilityText: 'I could swing my spiked tail to help defend myself.',
    genericAbility: 'spikes',
  },
  triceratops: {
    foodCategory: 'plants',
    foodWord: 'Plants',
    habitatCategory: 'woodland',
    habitatWord: 'Woodlands',
    habitatText:
      'I lived in warm, wooded landscapes and plains in ancient North America.',
    ability: 'Three horns',
    abilityText: 'My three face horns could help me defend myself.',
    genericAbility: 'horn',
  },
  tyrannosaurus: {
    foodCategory: 'meat',
    foodWord: 'Meat',
    habitatCategory: 'woodland',
    habitatWord: 'Woodlands',
    habitatText: 'I lived in wooded river landscapes in ancient North America.',
    ability: 'Powerful bite',
    abilityText: 'My huge jaws and strong teeth could crush bone.',
    genericAbility: 'bite',
  },
  velociraptor: {
    foodCategory: 'meat',
    foodWord: 'Meat',
    habitatCategory: 'desert',
    habitatWord: 'Dry dunes',
    habitatText:
      'I lived among dry sand dunes and sparse plants in ancient Asia.',
    ability: 'Gripping claws',
    abilityText: 'My large curved foot claws probably helped me grip prey.',
    genericAbility: 'grip',
  },
} satisfies Record<string, DinosaurClues>
