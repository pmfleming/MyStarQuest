import type { AnimalFoodName } from './animalFoodAssets'
import type { AnimalHabitatName } from './animalHabitatAssets'
import type { AnimalLocationName } from './animalLocationAssets'

export type AnimalFact = {
  label: string
  visual: string
  text: string
}

export type AnimalKnowledge = {
  name: string
  locationCategory: AnimalLocationName
  habitatCategory: AnimalHabitatName
  foodCategory: AnimalFoodName
  habitat: AnimalFact[]
  food: AnimalFact[]
  abilities: AnimalFact[]
}

type FactSeed = readonly [label: string, visual: string, text: string]

type AnimalKnowledgeSeed = {
  habitat: readonly FactSeed[]
  food: readonly FactSeed[]
  abilities: readonly FactSeed[]
}

type AnimalDisplayCategories = {
  location: AnimalLocationName
  habitat: AnimalHabitatName
  food: AnimalFoodName
}

const makeFacts = (facts: readonly FactSeed[]): AnimalFact[] =>
  facts.map(([label, visual, text]) => ({ label, visual, text }))

const KNOWLEDGE_SEEDS = {
  ant: {
    habitat: [
      ['PLACE', '🌍', 'Ant species live on every continent except Antarctica'],
      ['HOME', '🕳️', 'Nests in soil, wood, or plants'],
      ['CLIMATE', '🌤️', 'Many different climates'],
      ['COLONY', '🐜🐜', 'Lives with many other ants'],
    ],
    food: [
      ['DIET', '🌿🐛', 'Omnivore: plants and tiny animals'],
      ['FOOD', '🌱', 'Seeds, fruit, and small insects'],
      ['HOW', '🐜', 'Carries food back to the nest'],
      ['SHARES', '🤝', 'Shares food with the colony'],
    ],
    abilities: [
      ['STRONG', '💪', 'Can carry many times its own weight'],
      ['TRAILS', '〰️', 'Leaves scent trails for other ants'],
      ['DIG', '🕳️', 'Builds tunnels and chambers'],
      ['TEAMWORK', '🐜🐜', 'Works together as a colony'],
    ],
  },
  bat: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Bat species live on every continent except Antarctica; most avoid polar regions',
      ],
      ['HOME', '🦇', 'Caves, trees, roofs, and hollows'],
      ['CLIMATE', '🌦️', 'Warm and cool places'],
      ['WHEN', '🌙', 'Comes out mostly at night'],
    ],
    food: [
      ['DIET', '🐛', 'Mostly an insect eater'],
      ['FOOD', '🦟', 'Moths, mosquitoes, and beetles'],
      ['HOW', '🪽', 'Catches insects while flying'],
      ['WHEN', '🌙', 'Hunts after sunset'],
    ],
    abilities: [
      ['ECHOES', '🔊', 'Uses echoes to find its way'],
      ['FLY', '🪽', 'The only mammal that truly flies'],
      ['HANG', '🙃', 'Rests upside down'],
      ['HEAR', '👂', 'Hears very high sounds'],
    ],
  },
  bear: {
    habitat: [
      ['PLACE', '🌎', 'North America, Europe, and Asia'],
      ['HOME', '🌲', 'Forests, mountains, and tundra'],
      ['CLIMATE', '❄️', 'Mostly cool and cold places'],
      ['WINTER', '🛌', 'Shelters through the coldest months'],
    ],
    food: [
      ['DIET', '🍓🐟', 'Omnivore: plants and animals'],
      ['FOOD', '🫐', 'Berries, roots, fish, and insects'],
      ['HOW', '🐾', 'Forages with paws and a strong nose'],
      ['AUTUMN', '🍂', 'Eats extra food before winter'],
    ],
    abilities: [
      ['SMELL', '👃', 'Has an excellent sense of smell'],
      ['CLIMB', '🌲', 'Many bears can climb trees'],
      ['SWIM', '🌊', 'Is a strong swimmer'],
      ['REST', '😴', 'Can slow down greatly in winter'],
    ],
  },
  bee: {
    habitat: [
      ['PLACE', '🌍', 'Bee species live on every continent except Antarctica'],
      ['HOME', '🏡', 'Hives, tree holes, or ground nests'],
      ['CLIMATE', '☀️', 'Most active in warm weather'],
      ['FLOWERS', '🌼', 'Needs places with many flowers'],
    ],
    food: [
      ['DIET', '🌸', 'Herbivore: food from flowers'],
      ['FOOD', '🍯', 'Nectar and pollen'],
      ['HOW', '🥤', 'Sips nectar with a long tongue'],
      ['STORES', '🍯', 'Some bees turn nectar into honey'],
    ],
    abilities: [
      ['POLLINATE', '🌼', 'Carries pollen between flowers'],
      ['DANCE', '💃', 'Dances to show where food is'],
      ['FLY', '🪽', 'Flies quickly from flower to flower'],
      ['TEAMWORK', '🐝🐝', 'Works together in a colony'],
    ],
  },
  bluebird: {
    habitat: [
      ['PLACE', '🌎', 'North America'],
      ['HOME', '🌳', 'Open woods, meadows, and gardens'],
      ['CLIMATE', '🌦️', 'Warm summers and cool winters'],
      ['NEST', '🪺', 'Nests in tree holes and nest boxes'],
    ],
    food: [
      ['DIET', '🐛🍓', 'Omnivore: animals and plants'],
      ['FOOD', '🐛', 'Insects, berries, and small fruit'],
      ['HOW', '⬇️', 'Drops from a perch to catch insects'],
      ['CHICKS', '🪱', 'Carries insects to its chicks'],
    ],
    abilities: [
      ['FLY', '🪽', 'Flies quickly between low perches'],
      ['SING', '🎵', 'Uses a soft, musical song'],
      ['SEE', '👀', 'Spots insects moving on the ground'],
      ['NEST', '🪺', 'Builds a grass nest inside a hollow'],
    ],
  },
  butterfly: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Butterfly species live on every continent except Antarctica, including cool regions',
      ],
      ['HOME', '🌼', 'Meadows, gardens, and forests'],
      ['CLIMATE', '☀️', 'Likes warm, sunny weather'],
      ['FLOWERS', '🌸', 'Needs flowers and food plants'],
    ],
    food: [
      ['DIET', '🌸', 'Herbivore: food from plants'],
      ['FOOD', '🌺', 'Mostly flower nectar'],
      ['HOW', '🥤', 'Unrolls a straw-like tongue'],
      ['CATERPILLAR', '🐛', 'Caterpillars chew leaves'],
    ],
    abilities: [
      ['CHANGE', '🐛🦋', 'Changes from caterpillar to butterfly'],
      ['POLLINATE', '🌼', 'Carries pollen between flowers'],
      ['TASTE', '🦶', 'Tastes plants with its feet'],
      ['FLY', '🪽', 'Flies on four colourful wings'],
    ],
  },
  camel: {
    habitat: [
      ['PLACE', '🌍', 'Africa and Asia'],
      ['HOME', '🏜️', 'Deserts and dry grasslands'],
      ['TEMPERATURE', '☀️❄️', 'Hot days and cold nights'],
      ['RAIN', '🌵', 'Very little rain'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌵', 'Dry grass and thorny plants'],
      ['HOW', '👄', 'Tough lips handle prickly food'],
      ['DRINKS', '💧', 'Can drink a lot of water at once'],
    ],
    abilities: [
      ['HUMP', '🐪', 'Stores energy as fat in its hump'],
      ['WALK', '🐾', 'Wide feet spread on soft sand'],
      ['SAND', '👃', 'Closes its nostrils in blowing sand'],
      ['TRAVEL', '🏜️', 'Travels far with little water'],
    ],
  },
  cat: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Domestic cats live with people on every inhabited continent',
      ],
      ['HOME', '🏠', 'Lives close to people'],
      ['CLIMATE', '🌤️', 'Many different climates'],
      ['SHELTER', '🧺', 'Likes warm, safe resting places'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animal food'],
      ['FOOD', '🐟', 'Meat and fish-based food'],
      ['HOW', '👅', 'Rough tongue helps clean and eat'],
      ['DRINKS', '💧', 'Laps water with its tongue'],
    ],
    abilities: [
      ['NIGHT', '🌙', 'Sees well in low light'],
      ['BALANCE', '⚖️', 'Balances with help from its tail'],
      ['HEAR', '👂', 'Hears very soft sounds'],
      ['CLIMB', '🐾', 'Climbs using sharp claws'],
    ],
  },
  chicken: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Domestic chickens are kept on farms on every inhabited continent',
      ],
      ['HOME', '🏡', 'Coops, yards, and farms'],
      ['CLIMATE', '🌤️', 'Many mild climates'],
      ['SHELTER', '🪹', 'Roosts safely at night'],
    ],
    food: [
      ['DIET', '🌾🐛', 'Omnivore: plants and tiny animals'],
      ['FOOD', '🌽', 'Seeds, grain, greens, and insects'],
      ['HOW', '🐔', 'Pecks and scratches for food'],
      ['GRIT', '🪨', 'Swallows tiny stones to grind food'],
    ],
    abilities: [
      ['SCRATCH', '🐾', 'Scratches soil to uncover food'],
      ['CALL', '📣', 'Uses many different calls'],
      ['EGGS', '🥚', 'Hens lay eggs'],
      ['RUN', '🏃', 'Runs quickly on strong legs'],
    ],
  },
  cow: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Domestic cattle are kept on farms on every inhabited continent',
      ],
      ['HOME', '🌾', 'Pastures, barns, and grasslands'],
      ['CLIMATE', '🌤️', 'Many mild climates'],
      ['WATER', '💧', 'Needs plenty of fresh water'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, hay, and other plants'],
      ['HOW', '👅', 'Wraps its tongue around grass'],
      ['CUD', '🔄', 'Chews food again to digest it'],
    ],
    abilities: [
      ['SMELL', '👃', 'Has a strong sense of smell'],
      ['HERD', '🐄🐄', 'Feels safer with its herd'],
      ['STRONG', '💪', 'Has a large, powerful body'],
      ['TAIL', '〰️', 'Swishes its tail to shoo flies'],
    ],
  },
  crab: {
    habitat: [
      ['PLACE', '🌍', 'Coasts and oceans worldwide'],
      ['HOME', '🏖️', 'Shores, rock pools, and seabeds'],
      ['TEMPERATURE', '🌡️', 'Warm and cool water'],
      ['TIDES', '🌊', 'Many live where tides rise and fall'],
    ],
    food: [
      ['DIET', '🌿🐟', 'Omnivore: plants and animals'],
      ['FOOD', '🪸', 'Algae, scraps, and small animals'],
      ['HOW', '🦀', 'Uses claws to hold and tear food'],
      ['FINDS', '🔎', 'Searches the shore and seabed'],
    ],
    abilities: [
      ['SIDEWAYS', '↔️', 'Usually walks sideways'],
      ['ARMOUR', '🛡️', 'Has a hard outer shell'],
      ['CLAWS', '✂️', 'Uses claws to feed and defend'],
      ['REGROW', '✨', 'Can regrow a lost leg over time'],
    ],
  },
  crocodile: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Crocodiles live in warm parts of Africa, southern Asia, the Americas and northern Australia',
      ],
      ['HOME', '🏞️', 'Rivers, lakes, and wetlands'],
      ['TEMPERATURE', '☀️', 'Warm and tropical'],
      ['WATER', '🌊', 'Spends much of its time in water'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🐟', 'Fish, birds, and other animals'],
      ['HOW', '👀', 'Waits quietly before a fast attack'],
      ['TEETH', '🦷', 'Grips food with many strong teeth'],
    ],
    abilities: [
      ['BITE', '🦷', 'Has an extremely strong bite'],
      ['SWIM', '🌊', 'Pushes through water with its tail'],
      ['HIDE', '👀', 'Keeps eyes and nose above water'],
      ['ARMOUR', '🛡️', 'Has tough, scaly skin'],
    ],
  },
  deer: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Native deer live in the Americas, Europe, Asia and northern Africa; introduced deer also live in Australia and New Zealand',
      ],
      ['HOME', '🌲', 'Forests, meadows, and mountains'],
      ['CLIMATE', '🍂', 'Cool and mild seasons'],
      ['COVER', '🌳', 'Uses trees and tall plants for shelter'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🍃', 'Grass, leaves, shoots, and fruit'],
      ['HOW', '🦌', 'Browses plants with its lips'],
      ['WHEN', '🌅', 'Often feeds near dawn and dusk'],
    ],
    abilities: [
      ['RUN', '🏃', 'Runs quickly away from danger'],
      ['JUMP', '⬆️', 'Leaps over logs and bushes'],
      ['HEAR', '👂', 'Large ears turn toward sounds'],
      ['ANTLERS', '🫎', 'Many males grow antlers'],
    ],
  },
  dog: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Domestic dogs live with people on every inhabited continent',
      ],
      ['HOME', '🏠', 'Homes, farms, and working places'],
      ['CLIMATE', '🌦️', 'Many different climates'],
      ['PEOPLE', '👨‍👩‍👧', 'Depends on people for care'],
    ],
    food: [
      ['DIET', '🥩🌾', 'Omnivore: animal and plant foods'],
      ['FOOD', '🥣', 'Balanced dog food and safe treats'],
      ['HOW', '👃', 'Uses its nose to find food'],
      ['DRINKS', '💧', 'Laps water with its tongue'],
    ],
    abilities: [
      ['SMELL', '👃', 'Has an amazing sense of smell'],
      ['HEAR', '👂', 'Hears sounds people cannot'],
      ['LEARN', '🧠', 'Learns signals and routines'],
      ['TEAMWORK', '🤝', 'Works closely with people'],
    ],
  },
  dolphin: {
    habitat: [
      ['PLACE', '🌍', 'Oceans around the world'],
      ['HOME', '🌊', 'Coasts and open sea'],
      ['TEMPERATURE', '🌡️', 'Warm and cool ocean water'],
      ['WATER', '🧂', 'Lives in salt water'],
    ],
    food: [
      ['DIET', '🐟', 'Carnivore: animals'],
      ['FOOD', '🐟', 'Fish and squid'],
      ['HOW', '🐬🐬', 'Often hunts together in a pod'],
      ['EATS', '😮', 'Swallows fish without chewing'],
    ],
    abilities: [
      ['ECHOES', '🔊', 'Uses echoes to find objects and food'],
      ['SWIM', '🌊', 'Swims fast with a powerful tail'],
      ['BREATHE', '💨', 'Breathes air through a blowhole'],
      ['TALK', '🎵', 'Uses clicks and whistles'],
    ],
  },
  duck: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Duck species live in wetlands on every continent except Antarctica',
      ],
      ['HOME', '🏞️', 'Ponds, lakes, rivers, and marshes'],
      ['CLIMATE', '🌦️', 'Warm and cool places'],
      ['WATER', '💧', 'Lives close to fresh or salt water'],
    ],
    food: [
      ['DIET', '🌿🐛', 'Omnivore: plants and tiny animals'],
      ['FOOD', '🌱', 'Water plants, seeds, insects, and snails'],
      ['HOW', '🙃', 'Tips forward to reach underwater food'],
      ['BEAK', '🦆', 'Filters food with the edges of its bill'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Paddles with webbed feet'],
      ['WATERPROOF', '☔', 'Oily feathers help keep it dry'],
      ['FLY', '🪽', 'Many ducks migrate long distances'],
      ['FLOAT', '🛟', 'Its body floats easily'],
    ],
  },
  eagle: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Eagle species live on every continent except Antarctica',
      ],
      ['HOME', '🏔️', 'Mountains, forests, coasts, and plains'],
      ['CLIMATE', '🌤️', 'Many different climates'],
      ['NEST', '🪺', 'Builds a large nest high up'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🐟', 'Fish, birds, and small mammals'],
      ['HOW', '🦅', 'Grabs food with powerful talons'],
      ['BEAK', '🪶', 'Tears food with a hooked beak'],
    ],
    abilities: [
      ['VISION', '👀', 'Spots small animals from far away'],
      ['SOAR', '🪽', 'Rides rising air with wide wings'],
      ['TALONS', '🐾', 'Has strong, sharp talons'],
      ['DIVE', '⬇️', 'Dives quickly toward food'],
    ],
  },
  elephant: {
    habitat: [
      ['PLACE', '🌍', 'Africa and Asia'],
      ['HOME', '🌳', 'Savannas, forests, and grasslands'],
      ['TEMPERATURE', '☀️', 'Warm and hot places'],
      ['WATER', '💧', 'Travels to rivers and waterholes'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🍃', 'Grass, leaves, bark, and fruit'],
      ['HOW', '🐘', 'Uses its trunk to pick up food'],
      ['DRINKS', '💧', 'Draws up water with its trunk'],
    ],
    abilities: [
      ['TRUNK', '🐘', 'Uses its trunk to smell, touch, and lift'],
      ['MEMORY', '🧠', 'Remembers places and other elephants'],
      ['COOL', '👂', 'Large ears help release body heat'],
      ['STRONG', '💪', 'Can push and lift heavy things'],
    ],
  },
  fox: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Fox species live in the Americas, Europe, Asia and Africa; red foxes were introduced to Australia',
      ],
      ['HOME', '🌲', 'Forests, grasslands, deserts, and towns'],
      ['CLIMATE', '🌦️', 'Cold, cool, and warm places'],
      ['DEN', '🕳️', 'Rests and raises young in a den'],
    ],
    food: [
      ['DIET', '🐭🍓', 'Omnivore: animals and plants'],
      ['FOOD', '🐭', 'Small animals, insects, fruit, and eggs'],
      ['HOW', '⬆️', 'Pounces onto hidden prey'],
      ['STORES', '🕳️', 'Hides extra food for later'],
    ],
    abilities: [
      ['HEAR', '👂', 'Hears small animals underground'],
      ['SNEAK', '🐾', 'Moves quietly while hunting'],
      ['JUMP', '⬆️', 'Leaps high when pouncing'],
      ['TAIL', '🦊', 'Uses its bushy tail for warmth and balance'],
    ],
  },
  frog: {
    habitat: [
      ['PLACE', '🌍', 'Frog species live on every continent except Antarctica'],
      ['HOME', '🏞️', 'Ponds, wetlands, forests, and gardens'],
      ['CLIMATE', '🌧️', 'Moist places, often warm or mild'],
      ['WATER', '💧', 'Needs water or damp shelter'],
    ],
    food: [
      ['DIET', '🐛', 'Adult frogs are carnivores'],
      ['FOOD', '🪰', 'Insects, worms, and other tiny animals'],
      ['HOW', '👅', 'Flicks out a sticky tongue'],
      ['WHEN', '🌙', 'Many hunt at night or after rain'],
    ],
    abilities: [
      ['JUMP', '⬆️', 'Powerful back legs make long jumps'],
      ['SWIM', '🌊', 'Webbed feet help many frogs swim'],
      ['SKIN', '💧', 'Can take in oxygen through moist skin'],
      ['HIDE', '🍃', 'Colours help it blend in'],
    ],
  },
  giraffe: {
    habitat: [
      ['PLACE', '🌍', 'Africa'],
      ['HOME', '🌳', 'Savannas and open woodlands'],
      ['TEMPERATURE', '☀️', 'Warm and hot'],
      ['RAIN', '🌦️', 'Wet seasons and dry seasons'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FAVOURITE', '🍃', 'Acacia leaves and fresh shoots'],
      ['HOW', '👅', 'A long tongue pulls leaves from branches'],
      ['DRINKS', '💧', 'Spreads its front legs to drink'],
    ],
    abilities: [
      ['REACH', '🦒🌳', 'Its long neck reaches high leaves'],
      ['RUN', '🏃', 'Runs quickly across open ground'],
      ['DEFEND', '🦵', 'Can defend itself with a strong kick'],
      ['LOOK OUT', '👀', 'Sees far above tall grass'],
    ],
  },
  goat: {
    habitat: [
      ['PLACE', '🌍', 'Domestic goats are kept on every inhabited continent'],
      ['HOME', '⛰️', 'Rocky slopes, grasslands, and farms'],
      ['CLIMATE', '🌦️', 'Many warm and cool climates'],
      ['GROUND', '🪨', 'Handles steep, uneven ground'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🍃', 'Leaves, shrubs, grass, and hay'],
      ['HOW', '🐐', 'Browses plants with nimble lips'],
      ['CUD', '🔄', 'Chews food again to digest it'],
    ],
    abilities: [
      ['CLIMB', '⛰️', 'Climbs steep and rocky slopes'],
      ['BALANCE', '⚖️', 'Balances on small footholds'],
      ['JUMP', '⬆️', 'Jumps across gaps and obstacles'],
      ['SEE', '👀', 'Wide pupils give a broad view'],
    ],
  },
  hippo: {
    habitat: [
      ['PLACE', '🌍', 'Africa'],
      ['HOME', '🏞️', 'Rivers, lakes, and nearby grasslands'],
      ['TEMPERATURE', '☀️', 'Warm and hot'],
      ['WATER', '🌊', 'Rests in water during the day'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: mostly plants'],
      ['FOOD', '🌱', 'Mostly short grass'],
      ['HOW', '🌙', 'Grazes on land mostly at night'],
      ['DRINKS', '💧', 'Gets water while living near rivers'],
    ],
    abilities: [
      ['WATER', '🌊', 'Walks and pushes along underwater'],
      ['HOLD BREATH', '🤿', 'Stays underwater for several minutes'],
      ['RUN', '🏃', 'Runs surprisingly fast on land'],
      ['SKIN', '🧴', 'Skin makes an oily protective liquid'],
    ],
  },
  horse: {
    habitat: [
      ['PLACE', '🌍', 'Domestic horses are kept on every inhabited continent'],
      ['HOME', '🌾', 'Open fields, pastures, and stables'],
      ['CLIMATE', '🌦️', 'Many different climates'],
      ['WATER', '💧', 'Needs fresh water every day'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, hay, and safe grains'],
      ['HOW', '🐴', 'Clips grass with lips and front teeth'],
      ['GRAZES', '⏰', 'Eats small amounts for many hours'],
    ],
    abilities: [
      ['RUN', '🏃', 'Runs fast on long, strong legs'],
      ['HEAR', '👂', 'Turns its ears toward sounds'],
      ['BALANCE', '⚖️', 'Moves securely at different speeds'],
      ['SLEEP', '😴', 'Can rest while standing'],
    ],
  },
  ibis: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Ibis species live on every continent except Antarctica, including warm and temperate wetlands',
      ],
      ['HOME', '🏞️', 'Wetlands, marshes, and muddy shores'],
      ['TEMPERATURE', '☀️', 'Mostly warm and mild'],
      ['WATER', '💧', 'Feeds in shallow water'],
    ],
    food: [
      ['DIET', '🐛🌱', 'Omnivore: animals and some plants'],
      ['FOOD', '🦐', 'Insects, worms, crabs, and seeds'],
      ['HOW', '🥢', 'Probes mud with a long curved beak'],
      ['WADES', '🦵', 'Walks through shallow water to feed'],
    ],
    abilities: [
      ['PROBE', '🥢', 'Finds hidden food by touch'],
      ['WADE', '🦵', 'Long legs keep its body above water'],
      ['FLY', '🪽', 'Flies with its flock'],
      ['BEAK', '〰️', 'Curved beak reaches into mud'],
    ],
  },
  jackal: {
    habitat: [
      ['PLACE', '🌍', 'Africa, Asia, and southeast Europe'],
      ['HOME', '🌾', 'Savannas, deserts, and open woodland'],
      ['CLIMATE', '☀️', 'Mostly warm and dry'],
      ['DEN', '🕳️', 'Uses a den for shelter and young'],
    ],
    food: [
      ['DIET', '🐭🍓', 'Omnivore: animals and plants'],
      ['FOOD', '🐭', 'Small animals, insects, fruit, and scraps'],
      ['HOW', '🐾', 'Hunts alone, in pairs, or scavenges'],
      ['WHEN', '🌅', 'Often active near dawn and dusk'],
    ],
    abilities: [
      ['HEAR', '👂', 'Locates small animals by sound'],
      ['RUN', '🏃', 'Runs steadily over long distances'],
      ['TEAMWORK', '🐾🐾', 'Pairs work together'],
      ['CALL', '🌙', 'Howls and yips to communicate'],
    ],
  },
  kangaroo: {
    habitat: [
      ['PLACE', '🌏', 'Australia'],
      ['HOME', '🌾', 'Grasslands, scrub, and open woodland'],
      ['TEMPERATURE', '☀️', 'Mostly warm and dry'],
      ['RAIN', '🌦️', 'Often lives where rain is limited'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, leaves, and shrubs'],
      ['HOW', '🦘', 'Grazes and browses low plants'],
      ['WATER', '💧', 'Gets some water from plants'],
    ],
    abilities: [
      ['HOP', '⬆️', 'Travels with powerful hopping legs'],
      ['POUCH', '👶', 'Carries its baby in a pouch'],
      ['BALANCE', '〰️', 'Uses its strong tail for balance'],
      ['DEFEND', '🦵', 'Can push and kick with its legs'],
    ],
  },
  kiwi: {
    habitat: [
      ['PLACE', '🌏', 'New Zealand'],
      ['HOME', '🌲', 'Forests, scrub, and grasslands'],
      ['CLIMATE', '🌧️', 'Mild and often damp'],
      ['GROUND', '🍂', 'Searches through soil and leaf litter'],
    ],
    food: [
      ['DIET', '🐛🍓', 'Omnivore: animals and plants'],
      ['FOOD', '🪱', 'Worms, insects, seeds, and fruit'],
      ['HOW', '🥢', 'Probes soil with a long beak'],
      ['WHEN', '🌙', 'Looks for food mostly at night'],
    ],
    abilities: [
      ['SMELL', '👃', 'Smells with nostrils near its beak tip'],
      ['RUN', '🏃', 'Runs on strong legs but cannot fly'],
      ['DIG', '🕳️', 'Probes and digs for hidden food'],
      ['EGG', '🥚', 'Lays a very large egg for its size'],
    ],
  },
  koala: {
    habitat: [
      ['PLACE', '🌏', 'Eastern Australia'],
      ['HOME', '🌳', 'Eucalyptus forests and woodlands'],
      ['CLIMATE', '☀️', 'Warm and mild'],
      ['TREES', '🌲', 'Spends most of its life in trees'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🍃', 'Mostly eucalyptus leaves'],
      ['HOW', '🐨', 'Chews tough leaves with strong teeth'],
      ['WATER', '💧', 'Gets much of its water from leaves'],
    ],
    abilities: [
      ['CLIMB', '🌳', 'Climbs using strong arms and claws'],
      ['GRIP', '🐾', 'Gripping hands hold branches tightly'],
      ['DIGEST', '🍃', 'Can digest tough eucalyptus leaves'],
      ['SLEEP', '😴', 'Sleeps many hours to save energy'],
    ],
  },
  lion: {
    habitat: [
      ['PLACE', '🌍', 'Mostly Africa, with a small group in India'],
      ['HOME', '🌾', 'Savannas, grasslands, and open woodland'],
      ['TEMPERATURE', '☀️', 'Warm and hot'],
      ['RAIN', '🌦️', 'Wet seasons and dry seasons'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🦓', 'Zebras, antelopes, and other animals'],
      ['HOW', '🦁🦁', 'Often hunts together in a pride'],
      ['WHEN', '🌙', 'Often hunts in cooler, darker hours'],
    ],
    abilities: [
      ['ROAR', '📣', 'Its roar can travel very far'],
      ['TEAMWORK', '🦁🦁', 'Pride members cooperate'],
      ['NIGHT', '🌙', 'Sees well in low light'],
      ['SPRINT', '🏃', 'Runs very fast for a short distance'],
    ],
  },
  gecko: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Gecko species live on every continent except Antarctica, mostly in warm regions but also in mild climates',
      ],
      ['HOME', '🌴🪨', 'Trees, rocks, caves, and buildings'],
      ['TEMPERATURE', '☀️', 'Warm and tropical'],
      ['SHELTER', '🌙', 'Hides by day and often comes out at night'],
    ],
    food: [
      ['DIET', '🐛', 'Mostly a carnivore'],
      ['FOOD', '🦗', 'Insects and other tiny animals'],
      ['HOW', '👅', 'Snaps up food with a quick mouth and tongue'],
      ['WHEN', '🌙', 'Many geckos hunt at night'],
    ],
    abilities: [
      ['STICK', '🦶', 'Tiny toe hairs grip walls and ceilings'],
      ['CLIMB', '🧗', 'Climbs rocks, trees, and smooth walls'],
      ['TAIL', '✨', 'Can regrow a lost tail'],
      ['CALL', '📣', 'Many geckos chirp or click'],
    ],
  },
  llama: {
    habitat: [
      ['PLACE', '🌎', 'The Andes of South America'],
      ['HOME', '⛰️', 'High grasslands and mountain farms'],
      ['TEMPERATURE', '❄️☀️', 'Cool nights and sunny days'],
      ['HEIGHT', '🏔️', 'Lives high above sea level'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, hay, and mountain plants'],
      ['HOW', '🦙', 'Grazes with a split upper lip'],
      ['CUD', '🔄', 'Chews food again to digest it'],
    ],
    abilities: [
      ['CARRY', '🎒', 'Carries loads along mountain paths'],
      ['CLIMB', '⛰️', 'Walks securely on steep ground'],
      ['WOOL', '🧶', 'Thick fibre keeps it warm'],
      ['WARN', '💦', 'May spit as a warning'],
    ],
  },
  mole: {
    habitat: [
      ['PLACE', '🌍', 'Europe, Asia, and North America'],
      ['HOME', '🕳️', 'Underground tunnels in soil'],
      ['CLIMATE', '🌦️', 'Cool and mild places'],
      ['SOIL', '🌧️', 'Likes soil soft enough to dig'],
    ],
    food: [
      ['DIET', '🪱', 'Carnivore: tiny soil animals'],
      ['FOOD', '🪱', 'Earthworms, grubs, and insects'],
      ['HOW', '👃', 'Searches tunnels using touch and smell'],
      ['OFTEN', '⏰', 'Needs to eat often'],
    ],
    abilities: [
      ['DIG', '⛏️', 'Wide front paws push through soil'],
      ['FEEL', '〰️', 'Sensitive nose and whiskers feel movement'],
      ['TUNNELS', '🕳️', 'Builds long tunnel systems'],
      ['DARK', '🌑', 'Finds its way without much light'],
    ],
  },
  monkey: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Monkeys are native to Africa, Asia, Mexico, Central America and South America; some live in snowy mountains',
      ],
      ['HOME', '🌴', 'Forests, woodlands, and grasslands'],
      ['CLIMATE', '☀️🌧️', 'Mostly warm, often rainy'],
      ['TREES', '🌳', 'Many spend much of their time in trees'],
    ],
    food: [
      ['DIET', '🍌🐛', 'Usually an omnivore'],
      ['FOOD', '🍎', 'Fruit, leaves, seeds, and insects'],
      ['HOW', '🤲', 'Uses hands to hold and open food'],
      ['FINDS', '🔎', 'Forages through trees and on the ground'],
    ],
    abilities: [
      ['CLIMB', '🌳', 'Climbs with hands and feet'],
      ['GRAB', '🤲', 'Grasps branches and small objects'],
      ['LEARN', '🧠', 'Solves problems and learns from others'],
      ['SOCIAL', '🐒🐒', 'Communicates in a group'],
    ],
  },
  mouse: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'House mice live on every inhabited continent, spread by people',
      ],
      ['HOME', '🌾🏠', 'Fields, forests, farms, and buildings'],
      ['CLIMATE', '🌦️', 'Many different climates'],
      ['NEST', '🪹', 'Makes a hidden nest'],
    ],
    food: [
      ['DIET', '🌾🐛', 'Omnivore: plants and tiny animals'],
      ['FOOD', '🌻', 'Seeds, grain, fruit, and insects'],
      ['HOW', '🦷', 'Gnaws with front teeth that keep growing'],
      ['STORES', '📦', 'Carries food to safe hiding places'],
    ],
    abilities: [
      ['SQUEEZE', '↔️', 'Fits through very small gaps'],
      ['SMELL', '👃', 'Uses smell to find food and trails'],
      ['HEAR', '👂', 'Hears very high sounds'],
      ['DASH', '🏃', 'Runs quickly into cover'],
    ],
  },
  newt: {
    habitat: [
      ['PLACE', '🌍', 'Europe, Asia, and North America'],
      ['HOME', '🏞️', 'Ponds, damp woods, and gardens'],
      ['CLIMATE', '🌧️', 'Cool and moist'],
      ['WATER', '💧', 'Returns to water to breed'],
    ],
    food: [
      ['DIET', '🐛', 'Carnivore: tiny animals'],
      ['FOOD', '🪱', 'Worms, insects, tadpoles, and snails'],
      ['HOW', '😮', 'Snaps up small moving food'],
      ['WHERE', '💧', 'Feeds on land and in water'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Uses its tail to swim'],
      ['REGROW', '✨', 'Can regrow some damaged body parts'],
      ['SKIN', '💧', 'Breathes partly through moist skin'],
      ['HIDE', '🍂', 'Colours blend with pond plants and leaves'],
    ],
  },
  otter: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Otters live in parts of the Americas, Europe, Asia and Africa; none are native to Australia or Antarctica',
      ],
      ['HOME', '🏞️', 'Rivers, lakes, wetlands, and seashores'],
      ['CLIMATE', '🌦️', 'Cool, mild, and warm places'],
      ['WATER', '💧', 'Needs healthy water with plenty of food'],
    ],
    food: [
      ['DIET', '🐟', 'Carnivore: animals'],
      ['FOOD', '🐟🦀', 'Fish, crabs, shellfish, and frogs'],
      ['HOW', '🤲', 'Catches food with mouth and paws'],
      ['TOOLS', '🪨', 'Some use rocks to open shells'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Streamlined body moves quickly in water'],
      ['FUR', '🧥', 'Dense fur traps a warm layer of air'],
      ['DIVE', '🤿', 'Holds its breath while searching underwater'],
      ['FEEL', '〰️', 'Whiskers sense movement in water'],
    ],
  },
  owl: {
    habitat: [
      ['PLACE', '🌍', 'Owl species live on every continent except Antarctica'],
      ['HOME', '🌲', 'Forests, farms, deserts, and tundra'],
      ['CLIMATE', '🌦️', 'Many different climates'],
      ['NEST', '🪹', 'Uses hollows, ledges, or old nests'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🐭', 'Mice, insects, birds, and other animals'],
      ['HOW', '🐾', 'Grabs food with sharp talons'],
      ['WHEN', '🌙', 'Many owls hunt at night'],
    ],
    abilities: [
      ['SILENT', '🪽', 'Special feathers make flight quiet'],
      ['HEAR', '👂', 'Pinpoints very faint sounds'],
      ['NIGHT', '🌙', 'Large eyes see well in low light'],
      ['TURN', '↪️', 'Turns its head very far around'],
    ],
  },
  panda: {
    habitat: [
      ['PLACE', '🌏', 'Central China'],
      ['HOME', '🎋', 'Cool mountain bamboo forests'],
      ['CLIMATE', '🌧️❄️', 'Cool, misty, and wet'],
      ['MOUNTAINS', '⛰️', 'Lives high in forested mountains'],
    ],
    food: [
      ['DIET', '🌿', 'Mostly a herbivore'],
      ['FOOD', '🎋', 'Almost entirely bamboo'],
      ['HOW', '🐼', 'A special wrist bone grips stems'],
      ['OFTEN', '⏰', 'Eats bamboo for many hours'],
    ],
    abilities: [
      ['GRIP', '🤲', 'Holds bamboo with a false thumb'],
      ['CHEW', '🦷', 'Strong jaws crush tough bamboo'],
      ['CLIMB', '🌳', 'Climbs trees well'],
      ['HIDE', '⚫⚪', 'Bold fur breaks up its shape in shade and snow'],
    ],
  },
  parrot: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Parrots are native to the Americas, Africa, Asia and Australasia, including cold New Zealand habitats; introduced populations also live in Europe',
      ],
      ['HOME', '🌴', 'Rainforests, woodlands, and savannas'],
      ['CLIMATE', '☀️🌧️', 'Mostly warm, often rainy'],
      ['TREES', '🌳', 'Feeds and nests in trees'],
    ],
    food: [
      ['DIET', '🌰🍓', 'Mostly plant food, sometimes tiny animals'],
      ['FOOD', '🥜', 'Fruit, seeds, nuts, flowers, and buds'],
      ['HOW', '🦜', 'Cracks and tears food with a hooked beak'],
      ['FEET', '🦶', 'Holds food in one foot'],
    ],
    abilities: [
      ['MIMIC', '🗣️', 'Some copy many sounds'],
      ['CLIMB', '🌳', 'Uses beak and feet to climb'],
      ['SOLVE', '🧠', 'Learns patterns and solves puzzles'],
      ['FLY', '🪽', 'Flies between feeding and nesting trees'],
    ],
  },
  penguin: {
    habitat: [
      ['PLACE', '🌍', 'The Southern Hemisphere'],
      ['HOME', '🧊', 'Ocean coasts, islands, and sea ice'],
      ['TEMPERATURE', '❄️', 'Cold or cool, depending on the species'],
      ['WATER', '🌊', 'Feeds in the ocean'],
    ],
    food: [
      ['DIET', '🐟', 'Carnivore: animals'],
      ['FOOD', '🐟🦐', 'Fish, squid, and krill'],
      ['HOW', '🤿', 'Dives and chases food underwater'],
      ['EATS', '😮', 'Swallows slippery food whole'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Wings work like flippers underwater'],
      ['WARM', '🧥', 'Feathers and fat hold in body heat'],
      ['HUDDLE', '🐧🐧', 'Some huddle together for warmth'],
      ['DIVE', '⬇️', 'Many dive deep and hold their breath'],
    ],
  },
  pig: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Domestic pigs are kept on every inhabited continent; wild pig ranges vary by species',
      ],
      ['HOME', '🏡🌲', 'Farms, forests, and grasslands'],
      ['CLIMATE', '🌦️', 'Many different climates'],
      ['MUD', '🟤', 'Uses mud and shade to stay cool'],
    ],
    food: [
      ['DIET', '🌿🐛', 'Omnivore: plants and animals'],
      ['FOOD', '🌽', 'Roots, fruit, grain, and insects'],
      ['HOW', '🐽', 'Roots through soil with a strong snout'],
      ['FINDS', '👃', 'Uses an excellent sense of smell'],
    ],
    abilities: [
      ['SMELL', '👃', 'Finds hidden food by smell'],
      ['DIG', '🐽', 'Strong snout moves soil and leaves'],
      ['LEARN', '🧠', 'Learns quickly and remembers'],
      ['SWIM', '🌊', 'Can swim well'],
    ],
  },
  rabbit: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Rabbits live on every inhabited continent, including introduced populations in Australia and New Zealand',
      ],
      ['HOME', '🌾', 'Grasslands, woods, farms, and gardens'],
      ['CLIMATE', '🌦️', 'Mostly mild and cool places'],
      ['BURROW', '🕳️', 'Many shelter in underground burrows'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, herbs, leaves, and bark'],
      ['HOW', '🐇', 'Nibbles with front teeth that keep growing'],
      ['WHEN', '🌅', 'Often feeds near dawn and dusk'],
    ],
    abilities: [
      ['HOP', '⬆️', 'Strong back legs make fast hops'],
      ['HEAR', '👂', 'Long ears detect distant danger'],
      ['DIG', '🕳️', 'Powerful feet dig burrows'],
      ['HIDE', '🌾', 'Fur helps it blend into its home'],
    ],
  },
  rhino: {
    habitat: [
      ['PLACE', '🌍', 'Africa and Asia'],
      ['HOME', '🌾🌲', 'Savannas, grasslands, and forests'],
      ['TEMPERATURE', '☀️', 'Warm and hot'],
      ['MUD', '🟤', 'Uses mud and water to cool its skin'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱🍃', 'Grass, leaves, shoots, and fruit'],
      ['HOW', '🦏', 'Grazes or browses with strong lips'],
      ['DRINKS', '💧', 'Visits water when it is available'],
    ],
    abilities: [
      ['HORN', '📯', 'Uses its horn for defence and digging'],
      ['SMELL', '👃', 'Has a strong sense of smell'],
      ['RUN', '🏃', 'Can charge very quickly'],
      ['SKIN', '🛡️', 'Thick skin protects its body'],
    ],
  },
  rooster: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Roosters are male domestic chickens, kept on every inhabited continent',
      ],
      ['HOME', '🏡', 'Coops, yards, and farms'],
      ['CLIMATE', '🌤️', 'Many mild climates'],
      ['ROOST', '🌳', 'Sleeps on a raised perch'],
    ],
    food: [
      ['DIET', '🌾🐛', 'Omnivore: plants and tiny animals'],
      ['FOOD', '🌽', 'Seeds, grain, greens, and insects'],
      ['HOW', '🐓', 'Pecks and scratches the ground'],
      ['FINDS', '🔎', 'Calls hens when it finds food'],
    ],
    abilities: [
      ['CROW', '📣', 'Crows loudly, often around dawn'],
      ['GUARD', '🛡️', 'Watches for danger around the flock'],
      ['RUN', '🏃', 'Runs quickly on strong legs'],
      ['BALANCE', '⚖️', 'Balances on narrow perches'],
    ],
  },
  seal: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Seal species live mainly along cold and temperate coasts worldwide, with some in warmer seas',
      ],
      ['HOME', '🌊', 'Oceans, rocky shores, beaches, and ice'],
      ['TEMPERATURE', '❄️', 'Mostly cold and cool water'],
      ['REST', '🏖️', 'Comes onto land or ice to rest'],
    ],
    food: [
      ['DIET', '🐟', 'Carnivore: animals'],
      ['FOOD', '🐟🦑', 'Fish, squid, and crustaceans'],
      ['HOW', '🤿', 'Dives and chases food underwater'],
      ['EATS', '😮', 'Usually swallows food whole'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Flippers and a smooth body speed through water'],
      ['DIVE', '🤿', 'Holds its breath for long dives'],
      ['FEEL', '〰️', 'Whiskers detect movement in water'],
      ['WARM', '🧥', 'Fat under the skin keeps it warm'],
    ],
  },
  shark: {
    habitat: [
      ['PLACE', '🌍', 'Oceans around the world'],
      ['HOME', '🌊', 'Coasts, reefs, and open ocean'],
      ['TEMPERATURE', '🌡️', 'Warm, cool, and cold water'],
      ['WATER', '🧂', 'Most live in salt water'],
    ],
    food: [
      ['DIET', '🐟', 'Carnivore: animals'],
      ['FOOD', '🐟🦭', 'Fish, squid, and other sea animals'],
      ['HOW', '🔎', 'Tracks movement, scent, and electrical signals'],
      ['TEETH', '🦷', 'Rows of teeth grip and cut food'],
    ],
    abilities: [
      ['SENSE', '⚡', 'Senses tiny electrical signals'],
      ['SMELL', '👃', 'Detects scents in water'],
      ['SWIM', '🌊', 'Powerful tail drives it forward'],
      ['TEETH', '✨', 'Replaces worn or lost teeth'],
    ],
  },
  sheep: {
    habitat: [
      ['PLACE', '🌍', 'Domestic sheep are kept on every inhabited continent'],
      ['HOME', '🌾', 'Grasslands, farms, and mountain pastures'],
      ['CLIMATE', '🌦️', 'Many cool and mild climates'],
      ['SHELTER', '🏡', 'Needs shelter from extreme weather'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, herbs, and hay'],
      ['HOW', '🐑', 'Grazes close to the ground'],
      ['CUD', '🔄', 'Chews food again to digest it'],
    ],
    abilities: [
      ['WOOL', '🧶', 'Wool helps keep its body warm'],
      ['HERD', '🐑🐑', 'Stays close to the flock'],
      ['CLIMB', '⛰️', 'Walks over steep pasture'],
      ['REMEMBER', '🧠', 'Recognises familiar sheep and people'],
    ],
  },
  skunk: {
    habitat: [
      ['PLACE', '🌎', 'North and South America'],
      ['HOME', '🌲', 'Forests, grasslands, farms, and towns'],
      ['CLIMATE', '🌦️', 'Mostly mild places'],
      ['DEN', '🕳️', 'Rests in a den or hollow'],
    ],
    food: [
      ['DIET', '🐛🍓', 'Omnivore: animals and plants'],
      ['FOOD', '🐛', 'Insects, fruit, eggs, and small animals'],
      ['HOW', '🐾', 'Digs with long front claws'],
      ['WHEN', '🌙', 'Usually searches for food at night'],
    ],
    abilities: [
      ['SPRAY', '💨', 'Sprays a powerful smell for defence'],
      ['WARN', '⚫⚪', 'Bold colours warn other animals'],
      ['DIG', '🕳️', 'Strong claws uncover food'],
      ['SMELL', '👃', 'Uses smell to explore'],
    ],
  },
  sloth: {
    habitat: [
      ['PLACE', '🌎', 'Central and South America'],
      ['HOME', '🌴', 'Warm tropical rainforests'],
      ['TEMPERATURE', '☀️', 'Warm all year'],
      ['RAIN', '🌧️', 'Very rainy and humid'],
    ],
    food: [
      ['DIET', '🌿', 'Mostly a herbivore'],
      ['FOOD', '🍃', 'Leaves, buds, and some fruit'],
      ['HOW', '🦥', 'Pulls branches close with long claws'],
      ['DIGEST', '🐌', 'Digests tough leaves very slowly'],
    ],
    abilities: [
      ['HANG', '🙃', 'Hangs securely from branches'],
      ['HIDE', '🌿', 'Algae in its fur helps it blend in'],
      ['SWIM', '🌊', 'Swims better than it walks'],
      ['SAVE ENERGY', '🔋', 'Moves slowly to save energy'],
    ],
  },
  snail: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Snail species live in land or water habitats on every inhabited continent',
      ],
      ['HOME', '🌿', 'Gardens, forests, ponds, and seas'],
      ['CLIMATE', '🌧️', 'Often cool or moist'],
      ['RAIN', '💧', 'Land snails are active when it is damp'],
    ],
    food: [
      ['DIET', '🌿', 'Many are herbivores'],
      ['FOOD', '🍃', 'Leaves, algae, fungi, and soft plants'],
      ['HOW', '👅', 'Scrapes food with a rough ribbon-like tongue'],
      ['WHEN', '🌧️', 'Often feeds after rain or at night'],
    ],
    abilities: [
      ['SHELL', '🐚', 'Pulls into its shell for protection'],
      ['SLIME', '〰️', 'Slime helps it glide over rough ground'],
      ['CLIMB', '⬆️', 'Climbs walls, stems, and rocks'],
      ['FEEL', '📡', 'Tentacles sense light, smell, and touch'],
    ],
  },
  'green-tree-python': {
    habitat: [
      ['PLACE', '🌏', 'New Guinea and northern Australia'],
      ['HOME', '🌴', 'Warm tropical rainforests'],
      ['TEMPERATURE', '☀️', 'Warm and humid'],
      ['TREES', '🌳', 'Spends much of its time on branches'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🐭🐦', 'Small mammals, birds, and reptiles'],
      ['HOW', '〰️', 'Coils around food before swallowing it whole'],
      ['FINDS', '👅', 'Flicks its tongue to collect scents'],
    ],
    abilities: [
      ['CLIMB', '🌳', 'Coils securely around branches'],
      ['HIDE', '🍃', 'Green colour blends with leaves'],
      ['SENSE', '🌡️', 'Heat-sensing pits help locate warm animals'],
      ['JAW', '😮', 'Flexible jaws open around food'],
    ],
  },
  tarantula: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Tarantulas live in warm parts of every continent except Antarctica',
      ],
      ['HOME', '🕳️', 'Burrows, tree hollows, and sheltered ground'],
      ['CLIMATE', '☀️', 'Warm, from dry scrub to rainforest'],
      ['SHELTER', '🍂', 'Hides in a silk-lined retreat'],
    ],
    food: [
      ['DIET', '🐛', 'Carnivore: tiny animals'],
      ['FOOD', '🦗', 'Insects and other small animals'],
      ['HOW', '👀', 'Waits quietly, then grabs passing food'],
      ['EATS', '🥤', 'Turns food soft before drinking it'],
    ],
    abilities: [
      ['SILK', '🕸️', 'Lines its shelter and protects eggs with silk'],
      ['FEEL', '〰️', 'Sensitive hairs detect tiny vibrations'],
      ['DEFEND', '💨', 'Some brush irritating hairs as a warning'],
      ['REGROW', '✨', 'Can regrow a lost leg while moulting'],
    ],
  },
  swan: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Swans mainly live in temperate parts of North America, Europe, Asia, South America and Australia; some breed in the Arctic',
      ],
      ['HOME', '🏞️', 'Lakes, rivers, marshes, and coasts'],
      ['CLIMATE', '🌦️', 'Mostly cool and mild'],
      ['WATER', '💧', 'Lives and feeds on the water'],
    ],
    food: [
      ['DIET', '🌿🐛', 'Mostly plants, plus tiny animals'],
      ['FOOD', '🌱', 'Water plants, seeds, and small water animals'],
      ['HOW', '🦢', 'Long neck reaches underwater plants'],
      ['GRAZES', '🌾', 'Also grazes on shore'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Webbed feet paddle through water'],
      ['FLY', '🪽', 'Large wings carry it long distances'],
      ['REACH', '〰️', 'Long neck reaches deep food'],
      ['GUARD', '🛡️', 'Strongly protects its nest and young'],
    ],
  },
  tiger: {
    habitat: [
      ['PLACE', '🌏', 'Asia'],
      ['HOME', '🌲', 'Forests, grasslands, and mangroves'],
      ['CLIMATE', '☀️❄️', 'Tropical heat to snowy cold'],
      ['COVER', '🌿', 'Needs plants or trees for cover'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🦌', 'Deer, wild pigs, and other animals'],
      ['HOW', '🐾', 'Stalks quietly before a short rush'],
      ['WHEN', '🌙', 'Often hunts in dim light'],
    ],
    abilities: [
      ['STRIPES', '🐯', 'Stripes blend with shadows and grass'],
      ['SWIM', '🌊', 'Is a powerful swimmer'],
      ['LEAP', '⬆️', 'Leaps with strong back legs'],
      ['ROAR', '📣', 'Uses loud calls to communicate'],
    ],
  },
  turkey: {
    habitat: [
      [
        'PLACE',
        '🌎',
        'Wild turkeys are native to North America; domestic turkeys are farmed worldwide',
      ],
      ['HOME', '🌲🏡', 'Woodlands, fields, and farms'],
      ['CLIMATE', '🌦️', 'Mostly mild and cool'],
      ['ROOST', '🌳', 'Wild turkeys sleep in trees'],
    ],
    food: [
      ['DIET', '🌰🐛', 'Omnivore: plants and tiny animals'],
      ['FOOD', '🌰', 'Seeds, nuts, berries, and insects'],
      ['HOW', '🐾', 'Scratches leaves to uncover food'],
      ['FORAGES', '🔎', 'Walks widely while searching'],
    ],
    abilities: [
      ['RUN', '🏃', 'Runs quickly on strong legs'],
      ['FLY', '🪽', 'Wild turkeys fly short distances'],
      ['DISPLAY', '🪭', 'Fans its tail in a display'],
      ['CALL', '📣', 'Gobbling carries through the woods'],
    ],
  },
  tortoise: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Tortoises are native to parts of the Americas, Africa, Europe and Asia, including Madagascar and ocean islands',
      ],
      ['HOME', '🏜️🌾', 'Dry grasslands, scrub, and islands'],
      ['TEMPERATURE', '☀️', 'Warm and often dry'],
      ['SHELTER', '🕳️', 'Uses shade or burrows in extreme heat'],
    ],
    food: [
      ['DIET', '🌿', 'Mostly a herbivore'],
      ['FOOD', '🌵🌱', 'Grass, leaves, flowers, and cactus pads'],
      ['HOW', '🐢', 'Bites plants with a hard beak'],
      ['WATER', '💧', 'Can cope with limited water'],
    ],
    abilities: [
      ['SHELL', '🛡️', 'A high, hard shell protects its body'],
      ['DIG', '🕳️', 'Strong feet dig shelter and nests'],
      ['SAVE WATER', '💧', 'Stores water and loses it slowly'],
      ['LONG LIFE', '⏳', 'Some tortoises live for more than a century'],
    ],
  },
  vole: {
    habitat: [
      ['PLACE', '🌍', 'North America, Europe, and Asia'],
      ['HOME', '🌾', 'Grasslands, fields, wetlands, and woods'],
      ['CLIMATE', '🌦️', 'Mostly cool and mild'],
      ['TUNNELS', '〰️', 'Uses paths and shallow burrows'],
    ],
    food: [
      ['DIET', '🌿', 'Mostly a herbivore'],
      ['FOOD', '🌱', 'Grass, roots, seeds, bark, and bulbs'],
      ['HOW', '🦷', 'Gnaws plants with growing front teeth'],
      ['STORES', '📦', 'Some store food in burrows'],
    ],
    abilities: [
      ['TUNNEL', '🕳️', 'Builds runways under grass or snow'],
      ['HIDE', '🌾', 'Stays low beneath thick plants'],
      ['DIG', '🐾', 'Digs nests and food stores'],
      ['SWIM', '🌊', 'Some voles swim very well'],
    ],
  },
  'blue-whale': {
    habitat: [
      ['PLACE', '🌍', 'Oceans around the world'],
      ['HOME', '🌊', 'Open ocean and coastal seas'],
      ['TEMPERATURE', '🌡️', 'Warm, cool, and icy water'],
      ['TRAVEL', '🧭', 'Migrates between feeding and breeding areas'],
    ],
    food: [
      ['DIET', '🐟', 'Carnivore: ocean animals'],
      ['FOOD', '🦐', 'Almost entirely tiny krill'],
      ['HOW', '〰️', 'Baleen plates filter krill from seawater'],
      ['FEEDS', '🌊', 'Gulps huge mouthfuls where krill gather'],
    ],
    abilities: [
      ['LARGEST', '📏', 'The largest animal known to have lived'],
      ['SWIM', '🌊', 'Powerful tail moves its huge body'],
      ['CALLS', '🎵', 'Very low calls travel far through water'],
      ['BREATHE', '💨', 'Breathes air through a blowhole'],
    ],
  },
  wolf: {
    habitat: [
      ['PLACE', '🌍', 'North America, Europe, and Asia'],
      ['HOME', '🌲❄️', 'Forests, tundra, mountains, and grasslands'],
      ['CLIMATE', '❄️', 'Mostly cool and cold'],
      ['DEN', '🕳️', 'Raises pups in a sheltered den'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🦌', 'Deer and other mammals'],
      ['HOW', '🐺🐺', 'Pack members hunt together'],
      ['TRAVEL', '🐾', 'May travel far to find food'],
    ],
    abilities: [
      ['TEAMWORK', '🐺🐺', 'Cooperates closely with its pack'],
      ['HOWL', '🌙', 'Howls to contact distant pack members'],
      ['SMELL', '👃', 'Follows scents over long distances'],
      ['ENDURANCE', '🏃', 'Trots for many kilometres'],
    ],
  },
  yak: {
    habitat: [
      ['PLACE', '🌏', 'High mountains of Central Asia'],
      ['HOME', '🏔️', 'Cold plateaus and mountain grasslands'],
      ['TEMPERATURE', '❄️', 'Very cold and windy'],
      ['HEIGHT', '⛰️', 'Lives where the air is thin'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, herbs, moss, and shrubs'],
      ['HOW', '🐂', 'Grazes short mountain plants'],
      ['CUD', '🔄', 'Chews food again to digest it'],
    ],
    abilities: [
      ['WARM', '🧥', 'Long thick hair protects against cold'],
      ['CLIMB', '🏔️', 'Walks securely on mountain ground'],
      ['CARRY', '🎒', 'Carries loads at high altitude'],
      ['BREATHE', '💨', 'Body works well in thin mountain air'],
    ],
  },
  zebra: {
    habitat: [
      ['PLACE', '🌍', 'Africa'],
      ['HOME', '🌾', 'Savannas, grasslands, and open woodland'],
      ['TEMPERATURE', '☀️', 'Warm and hot'],
      ['RAIN', '🌦️', 'Wet seasons and dry seasons'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Mostly grasses'],
      ['HOW', '🦓', 'Clips and grinds tough grass'],
      ['WATER', '💧', 'Travels to find water and fresh grass'],
    ],
    abilities: [
      ['STRIPES', '⚫⚪', 'Stripes may confuse biting flies and attackers'],
      ['RUN', '🏃', 'Runs quickly in a zigzag path'],
      ['DEFEND', '🦵', 'Strong legs can kick'],
      ['HERD', '🦓🦓', 'Stays alert with the herd'],
    ],
  },
  alpaca: {
    habitat: [
      ['PLACE', '🌎', 'The Andes of South America'],
      ['HOME', '⛰️', 'High grasslands and mountain farms'],
      ['TEMPERATURE', '❄️☀️', 'Cool nights and sunny days'],
      ['HEIGHT', '🏔️', 'Lives high above sea level'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌱', 'Grass, hay, and mountain plants'],
      ['HOW', '🦙', 'Grazes with a split upper lip'],
      ['CUD', '🔄', 'Chews food again to digest it'],
    ],
    abilities: [
      ['WOOL', '🧶', 'Soft fibre keeps it warm'],
      ['CLIMB', '⛰️', 'Walks securely on mountain ground'],
      ['BREATHE', '💨', 'Copes well with thin mountain air'],
      ['HUM', '🎵', 'Hums softly to communicate'],
    ],
  },
  armadillo: {
    habitat: [
      ['PLACE', '🌎', 'The Americas'],
      ['HOME', '🌾🌲', 'Grasslands, forests, and scrub'],
      ['TEMPERATURE', '☀️', 'Mostly warm'],
      ['BURROW', '🕳️', 'Digs a cool underground shelter'],
    ],
    food: [
      ['DIET', '🐛🌿', 'Mostly insects, plus some plants'],
      ['FOOD', '🐜', 'Ants, termites, grubs, and fruit'],
      ['HOW', '⛏️', 'Digs open nests and soil'],
      ['FINDS', '👃', 'Uses smell to locate hidden food'],
    ],
    abilities: [
      ['ARMOUR', '🛡️', 'Hard bands protect its body'],
      ['DIG', '🕳️', 'Strong claws dig very quickly'],
      ['HOLD BREATH', '🤿', 'Can hold its breath while digging or swimming'],
      ['JUMP', '⬆️', 'May spring straight up when startled'],
    ],
  },
  beaver: {
    habitat: [
      ['PLACE', '🌎', 'North America, Europe, and Asia'],
      ['HOME', '🏞️', 'Rivers, ponds, lakes, and wetlands'],
      ['TEMPERATURE', '❄️🌤️', 'Cool and mild'],
      ['WATER', '💧', 'Builds its home beside or in water'],
    ],
    food: [
      ['DIET', '🌿', 'Herbivore: plants'],
      ['FOOD', '🌳', 'Bark, twigs, leaves, and water plants'],
      ['HOW', '🦷', 'Gnaws wood with strong front teeth'],
      ['STORES', '📦', 'Stores branches underwater for winter'],
    ],
    abilities: [
      ['BUILD', '🪵', 'Builds dams and lodges with wood and mud'],
      ['SWIM', '🌊', 'Webbed feet and a flat tail help it swim'],
      ['DIVE', '🤿', 'Stays underwater for many minutes'],
      ['TEETH', '🦷', 'Orange front teeth keep growing'],
    ],
  },
  cheetah: {
    habitat: [
      ['PLACE', '🌍', 'Mostly Africa, with a small group in Iran'],
      ['HOME', '🌾', 'Open grasslands, savannas, and dry scrub'],
      ['TEMPERATURE', '☀️', 'Warm and hot'],
      ['COVER', '🌿', 'Uses tall grass and low bushes for cover'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🦌', 'Small antelopes, hares, and birds'],
      ['HOW', '🏃', 'Chases food in a very fast sprint'],
      ['WHEN', '☀️', 'Often hunts during daylight'],
    ],
    abilities: [
      ['FASTEST', '⚡', 'The fastest land animal'],
      ['TURN', '↪️', 'Long tail helps with sharp turns'],
      ['GRIP', '🐾', 'Claws grip the ground while running'],
      ['SPOT', '👀', 'Watches from raised ground'],
    ],
  },
  chimpanzee: {
    habitat: [
      ['PLACE', '🌍', 'Central and western Africa'],
      ['HOME', '🌴', 'Rainforests, woodlands, and forest edges'],
      ['TEMPERATURE', '☀️', 'Warm and tropical'],
      ['RAIN', '🌧️', 'Often rainy and humid'],
    ],
    food: [
      ['DIET', '🍎🐛', 'Omnivore: plants and animals'],
      ['FOOD', '🍌', 'Fruit, leaves, seeds, insects, and meat'],
      ['HOW', '🤲', 'Uses hands and simple tools to get food'],
      ['SHARES', '🤝', 'Sometimes shares food with its group'],
    ],
    abilities: [
      ['TOOLS', '🛠️', 'Uses sticks and stones as tools'],
      ['CLIMB', '🌳', 'Climbs using long arms and gripping feet'],
      ['LEARN', '🧠', 'Learns by watching others'],
      ['TALK', '🗣️', 'Uses calls, faces, and gestures'],
    ],
  },
  flamingo: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Flamingos live in parts of Africa, Europe, Asia and the Americas, including cold Andean lakes',
      ],
      ['HOME', '🏞️', 'Shallow salty lakes, lagoons, and mudflats'],
      ['TEMPERATURE', '🌦️', 'Warm lagoons and cold high-altitude lakes'],
      ['WATER', '🧂', 'Often feeds in salty or alkaline water'],
    ],
    food: [
      ['DIET', '🦐🌿', 'Omnivore: tiny animals and algae'],
      ['FOOD', '🦐', 'Tiny shrimp, algae, and small water animals'],
      ['HOW', '🙃', 'Feeds with its curved bill upside down'],
      ['FILTERS', '〰️', 'Filters tiny food from water and mud'],
    ],
    abilities: [
      ['BALANCE', '🦵', 'Rests while standing on one leg'],
      ['PINK', '🩷', 'Food pigments help turn its feathers pink'],
      ['FLY', '🪽', 'Flies strongly with neck and legs stretched out'],
      ['FLOCK', '🦩🦩', 'Lives in very large groups'],
    ],
  },
  gorilla: {
    habitat: [
      ['PLACE', '🌍', 'Central Africa'],
      ['HOME', '🌴', 'Rainforests and mountain forests'],
      ['TEMPERATURE', '🌦️', 'Warm lowlands or cool mountains'],
      ['RAIN', '🌧️', 'Forests with plenty of rain'],
    ],
    food: [
      ['DIET', '🌿', 'Mostly a herbivore'],
      ['FOOD', '🍃', 'Leaves, shoots, stems, bark, and fruit'],
      ['HOW', '🤲', 'Pulls and holds plants with strong hands'],
      ['FORAGES', '🔎', 'Travels slowly while finding fresh plants'],
    ],
    abilities: [
      ['STRONG', '💪', 'Has extremely powerful arms and shoulders'],
      ['KNUCKLES', '👊', 'Walks on its knuckles'],
      ['CLIMB', '🌳', 'Young gorillas climb especially well'],
      ['TALK', '🗣️', 'Uses calls, gestures, and expressions'],
    ],
  },
  hedgehog: {
    habitat: [
      [
        'PLACE',
        '🌍',
        'Hedgehogs are native to Africa, Europe and Asia; European hedgehogs were introduced to New Zealand',
      ],
      ['HOME', '🌿', 'Hedgerows, grasslands, woods, and gardens'],
      ['TEMPERATURE', '🌦️', 'Mostly mild and cool'],
      ['NEST', '🍂', 'Sleeps in a nest of leaves and grass'],
    ],
    food: [
      ['DIET', '🐛🍓', 'Omnivore: animals and plants'],
      ['FOOD', '🐛', 'Insects, worms, slugs, eggs, and fruit'],
      ['HOW', '👃', 'Snuffles through leaves using smell'],
      ['WHEN', '🌙', 'Looks for food mostly at night'],
    ],
    abilities: [
      ['ROLL', '⚪', 'Rolls into a tight ball'],
      ['SPINES', '🛡️', 'Thousands of spines protect its back'],
      ['SMELL', '👃', 'Finds food with a strong sense of smell'],
      ['WINTER', '😴', 'Some hibernate through cold months'],
    ],
  },
  jaguar: {
    habitat: [
      ['PLACE', '🌎', 'Central and South America'],
      ['HOME', '🌴🏞️', 'Rainforests, wetlands, and grasslands'],
      ['TEMPERATURE', '☀️', 'Warm and tropical'],
      ['WATER', '💧', 'Often lives close to rivers and swamps'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🐟', 'Deer, capybaras, fish, turtles, and caimans'],
      ['HOW', '🐾', 'Stalks quietly and attacks from close range'],
      ['BITE', '🦷', 'Powerful jaws bite through hard shells'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Swims and hunts confidently in water'],
      ['BITE', '🦷', 'Has the strongest bite of the big cats for its size'],
      ['HIDE', '🎨', 'Rosette spots blend with forest shadows'],
      ['CLIMB', '🌳', 'Climbs and rests in trees'],
    ],
  },
  meerkat: {
    habitat: [
      ['PLACE', '🌍', 'Southern Africa'],
      ['HOME', '🏜️', 'Dry deserts, scrub, and grasslands'],
      ['TEMPERATURE', '☀️❄️', 'Hot days and cold nights'],
      ['BURROW', '🕳️', 'Lives in a large underground burrow'],
    ],
    food: [
      ['DIET', '🐛🌿', 'Omnivore: animals and plants'],
      ['FOOD', '🦂', 'Insects, scorpions, eggs, and roots'],
      ['HOW', '⛏️', 'Digs quickly to uncover food'],
      ['TEAM', '🤝', 'One group member watches while others feed'],
    ],
    abilities: [
      ['LOOK OUT', '👀', 'Stands tall to watch for danger'],
      ['DIG', '🕳️', 'Long claws dig burrows and food'],
      ['TEAMWORK', '🐾🐾', 'Lives and works in a close group'],
      ['SUN', '☀️', 'Dark belly skin absorbs morning warmth'],
    ],
  },
  octopus: {
    habitat: [
      ['PLACE', '🌍', 'Oceans around the world'],
      ['HOME', '🪸', 'Reefs, rocky seabeds, caves, and deep sea'],
      ['TEMPERATURE', '🌡️', 'Warm, cool, and cold water'],
      ['DEN', '🪨', 'Hides in a rocky den'],
    ],
    food: [
      ['DIET', '🦀', 'Carnivore: animals'],
      ['FOOD', '🦀🐚', 'Crabs, shellfish, fish, and shrimp'],
      ['HOW', '🐙', 'Arms and suckers hold food'],
      ['BEAK', '🦜', 'A hard beak breaks and bites food'],
    ],
    abilities: [
      ['CAMOUFLAGE', '🎨', 'Changes colour and skin texture'],
      ['SQUEEZE', '↔️', 'Fits through gaps wider than its beak'],
      ['INK', '🖋️', 'Releases an ink cloud to escape'],
      ['SOLVE', '🧠', 'Learns, remembers, and solves puzzles'],
    ],
  },
  'polar-bear': {
    habitat: [
      ['PLACE', '🌍', 'The Arctic around the North Pole'],
      ['HOME', '🧊', 'Sea ice, coasts, and frozen ocean'],
      ['TEMPERATURE', '❄️', 'Extremely cold'],
      ['ICE', '🌊', 'Depends on sea ice for hunting and travel'],
    ],
    food: [
      ['DIET', '🥩', 'Carnivore: animals'],
      ['FOOD', '🦭', 'Mostly seals'],
      ['HOW', '🕳️', 'Waits quietly beside seal breathing holes'],
      ['STORES', '🧥', 'Stores energy as a thick layer of fat'],
    ],
    abilities: [
      ['SWIM', '🌊', 'Swims for long distances in icy water'],
      ['WARM', '🧥', 'Dense fur and fat hold in heat'],
      ['SMELL', '👃', 'Smells seals from very far away'],
      ['GRIP', '🐾', 'Huge paws grip ice and paddle in water'],
    ],
  },
  raccoon: {
    habitat: [
      ['PLACE', '🌎', 'North America, with introduced groups elsewhere'],
      ['HOME', '🌲🏠', 'Forests, wetlands, farms, and towns'],
      ['TEMPERATURE', '🌦️', 'Warm, mild, and cold seasons'],
      ['DEN', '🕳️', 'Sleeps in tree hollows, burrows, or buildings'],
    ],
    food: [
      ['DIET', '🐛🍎', 'Omnivore: animals and plants'],
      ['FOOD', '🦀', 'Fruit, nuts, insects, eggs, and water animals'],
      ['HOW', '🤲', 'Uses sensitive front paws to explore food'],
      ['WHEN', '🌙', 'Usually searches for food at night'],
    ],
    abilities: [
      ['FEEL', '🤲', 'Front paws are extremely sensitive'],
      ['CLIMB', '🌳', 'Climbs trees and buildings well'],
      ['SOLVE', '🧠', 'Remembers how to open simple containers'],
      ['NIGHT', '🌙', 'Sees well in low light'],
    ],
  },
} satisfies Record<string, AnimalKnowledgeSeed>

const DISPLAY_CATEGORY_SEEDS = {
  alpaca: { location: 'Andes', habitat: 'Mountain', food: 'Grass' },
  ant: { location: 'Worldwide', habitat: 'Burrow', food: 'Insects' },
  armadillo: { location: 'America', habitat: 'Grassland', food: 'Insects' },
  bat: { location: 'Worldwide', habitat: 'Cave', food: 'Insects' },
  bear: {
    location: 'North America, Europe, and Asia',
    habitat: 'Forest',
    food: 'Fish',
  },
  beaver: {
    location: 'North America, Europe, and Asia',
    habitat: 'River',
    food: 'Leaves',
  },
  bee: { location: 'Worldwide', habitat: 'Trees', food: 'Flowers & Nectar' },
  'blue-whale': { location: 'Ocean', habitat: 'Ocean', food: 'Krill' },
  bluebird: {
    location: 'North America',
    habitat: 'Grassland',
    food: 'Insects',
  },
  butterfly: {
    location: 'Worldwide',
    habitat: 'Grassland',
    food: 'Flowers & Nectar',
  },
  camel: { location: 'Earth', habitat: 'Desert', food: 'Grass' },
  cat: { location: 'Worldwide', habitat: 'Town', food: 'Fish' },
  cheetah: {
    location: 'Africa & Iran',
    habitat: 'Grassland',
    food: 'Antelopes',
  },
  chicken: { location: 'Worldwide', habitat: 'Farm', food: 'Seeds & Nuts' },
  chimpanzee: { location: 'Africa', habitat: 'Forest', food: 'Fruit' },
  cow: { location: 'Worldwide', habitat: 'Farm', food: 'Grass' },
  crab: { location: 'Global coasts', habitat: 'Coastline', food: 'Shellfish' },
  crocodile: { location: 'Warm regions', habitat: 'River', food: 'Fish' },
  deer: { location: 'Five continents', habitat: 'Forest', food: 'Leaves' },
  dog: { location: 'Worldwide', habitat: 'Town', food: 'Food' },
  dolphin: { location: 'Ocean', habitat: 'Ocean', food: 'Fish' },
  duck: { location: 'Worldwide', habitat: 'Wetland', food: 'Seeds & Nuts' },
  eagle: { location: 'Worldwide', habitat: 'Mountain', food: 'Birds' },
  elephant: { location: 'Earth', habitat: 'Grassland', food: 'Leaves' },
  flamingo: { location: 'Five continents', habitat: 'Wetland', food: 'Shrimp' },
  fox: { location: 'Worldwide', habitat: 'Forest', food: 'Rodents' },
  frog: { location: 'Worldwide', habitat: 'Pond', food: 'Insects' },
  gecko: { location: 'Worldwide', habitat: 'Trees', food: 'Insects' },
  giraffe: { location: 'Africa', habitat: 'Grassland', food: 'Leaves' },
  goat: { location: 'Worldwide', habitat: 'Mountain', food: 'Leaves' },
  gorilla: { location: 'Africa', habitat: 'Forest', food: 'Leaves' },
  'green-tree-python': {
    location: 'Australia',
    habitat: 'Forest',
    food: 'Rodents',
  },
  hedgehog: { location: 'Afro-Eurasia', habitat: 'Grassland', food: 'Insects' },
  hippo: { location: 'Africa', habitat: 'River', food: 'Grass' },
  horse: { location: 'Worldwide', habitat: 'Farm', food: 'Grass' },
  ibis: { location: 'Worldwide', habitat: 'Wetland', food: 'Insects' },
  jackal: { location: 'Afro-Eurasia', habitat: 'Grassland', food: 'Rodents' },
  jaguar: { location: 'America', habitat: 'Forest', food: 'Reptiles' },
  kangaroo: { location: 'Australia', habitat: 'Grassland', food: 'Grass' },
  kiwi: { location: 'Australia', habitat: 'Forest', food: 'Worms' },
  koala: { location: 'Australia', habitat: 'Forest', food: 'Leaves' },
  lion: { location: 'Africa', habitat: 'Grassland', food: 'Antelopes' },
  llama: { location: 'Andes', habitat: 'Mountain', food: 'Grass' },
  meerkat: { location: 'Africa', habitat: 'Desert', food: 'Insects' },
  mole: { location: 'Earth', habitat: 'Burrow', food: 'Worms' },
  monkey: {
    location: 'Africa, Asia & Americas',
    habitat: 'Forest',
    food: 'Fruit',
  },
  mouse: { location: 'Worldwide', habitat: 'Farm', food: 'Seeds & Nuts' },
  newt: { location: 'Earth', habitat: 'Pond', food: 'Worms' },
  octopus: { location: 'Ocean', habitat: 'Ocean', food: 'Shellfish' },
  otter: { location: 'Five continents', habitat: 'River', food: 'Fish' },
  owl: { location: 'Worldwide', habitat: 'Forest', food: 'Rodents' },
  panda: { location: 'Asia', habitat: 'Forest', food: 'Bamboo' },
  parrot: { location: 'Worldwide', habitat: 'Forest', food: 'Fruit' },
  penguin: { location: 'Earth', habitat: 'Ocean', food: 'Fish' },
  pig: { location: 'Worldwide', habitat: 'Farm', food: 'Roots' },
  'polar-bear': { location: 'Arctic', habitat: 'Tundra', food: 'Seals' },
  rabbit: { location: 'Worldwide', habitat: 'Grassland', food: 'Grass' },
  raccoon: { location: 'North America', habitat: 'Forest', food: 'Fruit' },
  rhino: { location: 'Earth', habitat: 'Grassland', food: 'Grass' },
  rooster: { location: 'Worldwide', habitat: 'Farm', food: 'Seeds & Nuts' },
  seal: { location: 'Global coasts', habitat: 'Ocean', food: 'Fish' },
  shark: { location: 'Ocean', habitat: 'Ocean', food: 'Fish' },
  sheep: { location: 'Worldwide', habitat: 'Grassland', food: 'Grass' },
  skunk: { location: 'America', habitat: 'Forest', food: 'Insects' },
  sloth: { location: 'America', habitat: 'Forest', food: 'Leaves' },
  snail: { location: 'Worldwide', habitat: 'Nature', food: 'Leaves' },
  swan: { location: 'Mild regions', habitat: 'Wetland', food: 'Grass' },
  tarantula: { location: 'Worldwide', habitat: 'Burrow', food: 'Insects' },
  tiger: { location: 'Asia', habitat: 'Forest', food: 'Deer' },
  tortoise: {
    location: 'Five continents',
    habitat: 'Grassland',
    food: 'Leaves',
  },
  turkey: {
    location: 'North America',
    habitat: 'Forest',
    food: 'Seeds & Nuts',
  },
  vole: {
    location: 'North America, Europe, and Asia',
    habitat: 'Grassland',
    food: 'Roots',
  },
  wolf: { location: 'Earth', habitat: 'Forest', food: 'Deer' },
  yak: { location: 'Asia', habitat: 'Mountain', food: 'Grass' },
  zebra: { location: 'Africa', habitat: 'Grassland', food: 'Grass' },
} satisfies Record<keyof typeof KNOWLEDGE_SEEDS, AnimalDisplayCategories>

export const ANIMAL_KNOWLEDGE: AnimalKnowledge[] = (
  Object.entries(KNOWLEDGE_SEEDS) as Array<
    [keyof typeof KNOWLEDGE_SEEDS, AnimalKnowledgeSeed]
  >
)
  .map(([name, seed]) => {
    const categories = DISPLAY_CATEGORY_SEEDS[name]
    return {
      name,
      locationCategory: categories.location,
      habitatCategory: categories.habitat,
      foodCategory: categories.food,
      habitat: makeFacts(seed.habitat),
      food: makeFacts(seed.food),
      abilities: makeFacts(seed.abilities),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export const ANIMAL_KNOWLEDGE_BY_NAME = new Map(
  ANIMAL_KNOWLEDGE.map((profile) => [profile.name, profile])
)
