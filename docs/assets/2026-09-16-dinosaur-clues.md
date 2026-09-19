# Dinosaur picture clues

The Who am I dinosaur collection uses the same square illustrated cards and short captions as animals and insects. Its four categories are **Food, Habitat, Ability, Geological period**. The ability clue includes distinctive anatomy when its exact behavior is uncertain.

| Creature           | Food    | Habitat      | Ability        | Geological period |
| ------------------ | ------- | ------------ | -------------- | ----------------- |
| Ankylosaurus       | Plants  | Woodlands    | Body armor     | Late Cretaceous   |
| Brontosaurus       | Plants  | River plains | Long reach     | Late Jurassic     |
| Pachycephalosaurus | Plants? | Woodlands    | Thick skull    | Late Cretaceous   |
| Parasaurolophus    | Plants  | River plains | Crest calls    | Late Cretaceous   |
| Pteranodon         | Fish    | Seacoasts    | Soaring        | Late Cretaceous   |
| Quetzalcoatlus     | Animals | Wetlands     | Giant wings    | Late Cretaceous   |
| Stegosaurus        | Plants  | River plains | Tail spikes    | Late Jurassic     |
| Triceratops        | Plants  | Woodlands    | Three horns    | Late Cretaceous   |
| Tyrannosaurus rex  | Meat    | Woodlands    | Powerful bite  | Late Cretaceous   |
| Velociraptor       | Meat    | Dry dunes    | Gripping claws | Late Cretaceous   |

| Allosaurus | Meat | River plains | Gripping hands | Late Jurassic |
| Baculites | Animal plankton | Seas | Protective shell | Late Cretaceous |
| Dimetrodon | Meat | Wetlands | Two tooth sizes | Early Permian |
| Otodus megalodon | Meat | Seas | Serrated teeth | Neogene |
| Tetrapodophis | Small animals? | Coastal water? | Flexible body | Early Cretaceous |
Habitats are broad reconstructions, not exclusive ranges. The Pachycephalosaurus food caption includes a question mark because its diet is uncertain. Its skull is shown without claiming proven head-butting. Parasaurolophus calls and Velociraptor gripping behavior are qualified as probable. Quetzalcoatlus's exact diet remains uncertain. Pteranodon and Quetzalcoatlus are pterosaurs, not dinosaurs; their habitat descriptions and portrait accessibility descriptions retain this distinction.

## Art and interaction

The original clue set of transparent PNGs was saved under `src/assets/dinosaurs/`: three food pictures, five habitats, two geological-period pictures, ten creature-specific abilities, and four additional mascot ability pictures. Existing matching food, habitat and period categories share images. Each period now uses a single stone with ivory dinosaur fossil reliefs: a blue/teal Late Jurassic stone shows a Brontosaurus-like sauropod and Stegosaurus; an amber/ochre Late Cretaceous stone shows Tyrannosaurus rex and Triceratops. The visible captions identify the interval. These are stylized teaching illustrations, not actual fossil specimens, rock-layer diagrams or scientifically fixed rock colors. The distinct colors reinforce recognition, while the fossil silhouettes and labels also distinguish the periods. Replacement prompts, sources and generated masters are recorded in [the period stone manifest](2026-09-16-dinosaur-period-stones.json). Built-in imagegen generated both replacements with real alpha transparency, preserved without local image edits.

Learn mode starts with the creature-specific ability. Clicking that clue switches to the theme's generic mascot, following the existing animal interaction. In two-player mode, hiding the answer replaces the ability image with a mascot, and revealing the answer restores the creature. Hard solo mode uses generic abilities too. The ability is the final solo clue so a creature-specific picture does not reveal the answer immediately.

Existing princess-bear and Teenieping assets provide armor, reach, calls, flight, horns, biting and gripping. Both themes gain new **dome** and **spikes** variants. Mascot helmets and toy tails illustrate the concept; they are not reconstructions of dinosaur anatomy. All generation used the built-in image tool, with prompts retained in [the clue manifest](2026-09-16-dinosaur-clue-prompts.json) and [the mascot manifest](2026-09-16-dinosaur-generic-prompts.json). The final Stegosaurus uses [a correction pass](2026-09-16-dinosaur-clue-corrections.json) to retain four tail spikes. The 24 new PNGs total about 34.7 MiB and retain alpha transparency. No portrait images were replaced.

## Sources

- Anatomy, food and time intervals: per-creature NHM/AMNH sources in `dinosaurKnowledge.ts` and [original collection notes](2026-09-16-dinosaur-collection.md).
- [NHM Pachycephalosaurus](https://www.nhm.ac.uk/discover/dino-directory/pachycephalosaurus): uncertain diet and dome function, warm humid environment.
- [NPS Morrison Formation](https://www.nps.gov/subjects/fossils/the-morrison-formation.htm) and [Morrison geography](https://www.nps.gov/dino/learn/nature/morrisonformationutah.htm): Jurassic river plains and vegetation.
- [Smithsonian Tyrannosaurus rex](https://www.si.edu/newsdesk/factsheets/tyrannosaurus-rex): floodplain reconstruction.
- [NHM Ankylosaurus](https://www.nhm.ac.uk/discover/dino-directory/ankylosaurus.html): armor, plants and tail club.
- [NHM Triceratops](https://www.nhm.ac.uk/discover/dino-directory/triceratops.html): horns and possible defense.
- [NHM Stegosaurus](https://www.nhm.ac.uk/discover/dino-directory/stegosaurus.html): defensive tail spikes.
- [Sandia Parasaurolophus research](https://newsreleases.sandia.gov/scientists-use-digital-paleontology-to-produce-voice-of-parasaurolophus-dinosaur/): crest acoustics.
- [AMNH Pteranodon](https://www.amnh.org/explore/ology/ology-cards/358-pteranodon-longiceps): fish and soaring.
- [UT Austin Quetzalcoatlus](https://news.utexas.edu/2021/12/08/worlds-largest-pterosaur-leaped-aloft-to-fly/): flight and evergreen/wetland environment.
- [AMNH Velociraptor](https://www.amnh.org/exhibitions/permanent/saurischian-dinosaurs/velociraptor) and [NHM Velociraptor](https://www.nhm.ac.uk/discover/velociraptor-facts.html): dunes, anatomy and prey.

## Checklist additions

The [five additions](2026-09-16-dinosaur-additions.md) add five individual abilities, shared animal-plankton food and ocean habitat, and three period stones. Existing matching food, habitat and period images remain shared. Generic abilities reuse both themes' existing grip, shell, bite and squeeze artwork. The flexible-body mascot is a conceptual analogy, not evidence of constriction behavior.

New period colors: rose-red Early Permian with a Dimetrodon skeleton and fern; violet Early Cretaceous with Iguanodon and Microraptor; emerald Neogene with a megalodon tooth and whale vertebra. The Permian and Neogene stones deliberately contain appropriate non-dinosaur fossils. The Neogene includes the Miocene and Pliocene epochs; it is not a dinosaur period. These are illustrative symbols, not actual fossil specimens or fixed geological rock colors.
