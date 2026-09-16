export type DinosaurClues = {
  foodCategory: 'plants' | 'meat' | 'fish'
  foodWord: string
  habitatCategory: 'woodland' | 'floodplain' | 'coast' | 'wetland' | 'desert'
  habitatWord: string
  habitatText: string
  ability: string
  abilityText: string
  genericAbility: string
}

// Broad habitat reconstructions, not claims that an animal lived only here.
// "Ability" includes distinctive anatomy where behavior remains uncertain.
export const DINOSAUR_CLUES = {
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
