# Bad Dinosaurs: five checklist additions

The collection now includes all 15 named taxa on the supplied checklist. Donnie is excluded as requested. Added: **Allosaurus, Baculites, Dimetrodon, Otodus megalodon and Tetrapodophis**. The Dinosaurs selector remains the familiar entry point, while learning text distinguishes dinosaurs from other prehistoric animals.

Each addition has one transparent cartoon portrait, one transparent realistic reconstruction and one individual ability illustration. Matching food, habitat and period categories share images. Learn mode retains click-to-switch, double-click-to-enlarge and the name below the portrait. Extra notes beneath the portraits were removed at the user’s request; artwork qualifications remain documented here. Hidden two-player answers and hard solo mode use the existing themed generic ability illustrations in both Teenieping and princess-bear themes.

| Creature         | Classification         | Food            | Habitat        | Ability          | Interval         | Generic ability |
| ---------------- | ---------------------- | --------------- | -------------- | ---------------- | ---------------- | --------------- |
| Allosaurus       | Dinosaur               | Meat            | River plains   | Gripping hands   | Late Jurassic    | grip            |
| Baculites        | Ammonite               | Animal plankton | Seas           | Protective shell | Late Cretaceous  | shell           |
| Dimetrodon       | Non-mammalian synapsid | Meat            | Wetlands       | Two tooth sizes  | Early Permian    | bite            |
| Otodus megalodon | Shark                  | Meat            | Seas           | Serrated teeth   | Neogene          | bite            |
| Tetrapodophis    | Snake-like squamate    | Small animals?  | Coastal water? | Flexible body    | Early Cretaceous | squeeze         |

## Artwork and qualifications

Built-in imagegen created 20 PNGs under `src/assets/dinosaurs/`: ten portraits, five individual ability images, animal-plankton food, ocean habitat and three period stones. Generated files were copied unchanged, preserving alpha. Exact prompts, generated master paths and project destinations are in [the prompt manifest](2026-09-16-dinosaur-additions-prompts.json).

- Dimitri/Dimetrodon, Annabel/Baculites and Megan/megalodon cartoon designs follow [Jan Esparza Monrós's production art](https://www.artstation.com/artwork/PXP9zn), using the previously saved reference sheets. Unseen body details were inferred. Production character names do not independently establish the real genus.
- Allosaurus is listed as pilot-only by the [supplied fan checklist](https://dinopedia.fandom.com/wiki/Bad_Dinosaurs). Its exact pilot design was not verified; its cartoon is an explicitly qualified teaching approximation.
- Tetrapodophis is the checklist's provisional match for the limbed snake. Its green cartoon is approximate, not a verified model recreation. The purple expression sheet considered during reference inspection is Barry and was **not** used for this creature.
- Baculites' real shell is nearly straight; Annabel's twisted shell remains faithful to the cartoon. The two are a best-guess match, not identical anatomy.
- Realistic pictures are speculative paleoart, not photographs. Megalodon's complete body proportions are uncertain. Tetrapodophis follows a lizard-like reconstruction; its identification as a four-legged snake is disputed.
- Tetrapodophis diet and habitat clues remain qualified. Flexible-body artwork does not assert constriction behavior. Dimetrodon's clue teaches differentiated teeth without assigning a proven function to its sail.

Fact cards now honor their specified image fit even with a wrapped caption, preventing tall period stones from being cropped.

Period stones are one object each: rose-red Early Permian with Dimetrodon and a fern impression; violet Early Cretaceous with Iguanodon and Microraptor; emerald Neogene with a megalodon tooth and whale vertebra. Existing teal Late Jurassic and amber Late Cretaceous stones are shared. Colors are memory aids, not geological claims; fossil arrangements are illustrations, not actual specimens. Permian and Neogene stones use appropriate non-dinosaur fossils.

## Scientific sources

- [NHM Allosaurus](https://www.nhm.ac.uk/discover/dino-directory/allosaurus.html): carnivory, Late Jurassic, three fingers and brow crests. [NPS Morrison Formation](https://www.nps.gov/subjects/fossils/the-morrison-formation.htm): river-plain environment.
- [AMNH Baculites feeding research](https://www.amnh.org/explore/news-blogs/ammonites-plankton-diet): small animal plankton and marine setting. [Cretaceous Atlas](https://www.cretaceousatlas.org/species/baculites-baculus/): classification and Late Cretaceous fossils.
- [Harvard Dimetrodon](https://whatsinaname.hmnh.harvard.edu/dimetrodon): synapsid relationships, early Permian environment, teeth and diet; sail function remains uncertain.
- [NHM megalodon](https://www.nhm.ac.uk/discover/megalodon--the-truth-about-the-largest-shark-that-ever-lived.html): warm seas, marine prey, serrated teeth, approximately 23–3.6 million years ago and uncertain body shape. Neogene encompasses its Miocene and Pliocene history.
- [University of Alberta Tetrapodophis research summary](https://ssl.eas.ualberta.ca/cms/download/file/papers/paper_525.pdf): disputed snake identification and aquatic lizard interpretation. [Original fossil description](https://doi.org/10.1126/science.aaa9208): Early Cretaceous, four reduced limbs and carnivory interpretation.

## Validation

The existing collection test now covers all 15 entries and verifies both themes have non-revealing generic ability assets, with no increase in test count. The full suite passes **110 tests across 51 files**. Production build/type check and lint pass. All 20 PNGs have transparent pixels and nonempty artwork. Browser checks cover the expanded Learn view, new clues, period stones, image switching and the shared interactions.
