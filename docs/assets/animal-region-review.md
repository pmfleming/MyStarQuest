# Animal location review — 5 September 2026

Artwork update: the factual review below is retained, but its initial eight cutout maps have been superseded by the [consistent scenic location set](scenic-location-images.md). Current category captions and images are defined together in `ANIMAL_LOCATIONS`.

Reviewed all 35 profiles previously displaying **Warm regions**, **Many regions**, or **Worldwide**, or using the Worldwide image category. Four additional profiles (bluebird, crab, jackal, raccoon) now reuse the matching reviewed category so an identical location caption cannot select a different image.

## Map conventions

These are educational category maps. Continental highlights mean that members of the animal group occur somewhere on those continents; they do not claim continuous occupation of every highlighted country or habitat. Generic names such as frog, eagle, and monkey cover multiple species. Worldwide means the six inhabited continents; Antarctica is unhighlighted. Domestic animals include their human-assisted distribution. For deer, hedgehog, monkey, and turkey, the map teaches their native continental range; the full fact distinguishes established introductions or farming elsewhere.

Each reviewed category owns one short caption and one unique custom flat-world-map asset in `REVIEWED_ANIMAL_LOCATIONS`. The game renders that canonical caption instead of deriving it from the longer animal fact. All eight maps have real alpha transparency, no baked-in text or card frame, and padding for the live full-width bottom pill. The built-in image tool created the maps. Original alpha was preserved where available; neutral painted backgrounds in five outputs were extracted locally before export.

| Category                | Highlight                                                                                            | Assigned profiles                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worldwide               | Six inhabited continents                                                                             | Ant, bat, bee, butterfly, cat, chicken, cow, dog, duck, eagle, fox, frog, gecko, goat, horse, ibis, mouse, owl, parrot, pig, rabbit, rooster, sheep, snail, tarantula |
| Warm regions            | Tropical/subtropical crocodile regions of the Americas, Africa, southern Asia and northern Australia | Crocodile                                                                                                                                                             |
| Afro-Eurasia            | Africa, Europe, Asia                                                                                 | Hedgehog, jackal                                                                                                                                                      |
| Five continents         | North America, South America, Africa, Europe, Asia                                                   | Deer, flamingo, otter, tortoise                                                                                                                                       |
| Africa, Asia & Americas | Africa, Asia, North America, South America                                                           | Monkey                                                                                                                                                                |
| Global coasts           | Coastal waters worldwide                                                                             | Seal, crab                                                                                                                                                            |
| Mild regions            | Broad temperate zones in both hemispheres                                                            | Swan                                                                                                                                                                  |
| North America           | North America                                                                                        | Turkey, bluebird, raccoon                                                                                                                                             |

## Evidence and decisions

- **Bat:** six continents; polar regions generally unsuitable. [Animal Diversity Web — Chiroptera](https://animaldiversity.org/accounts/Chiroptera/).
- **Ant, bee, butterfly:** broad group distributions extend beyond tropical habitats. Bee and butterfly cards retain a worldwide continental overview; warm-weather activity is not the same as geographic restriction. [Smithsonian — bees](https://www.si.edu/object/10-incredible-facts-about-honeybees%3Ayt_3cfNbbrXOAc), [Smithsonian — butterflies](https://www.si.edu/spotlight/buginfo/butterfly?page=1), [Animal Diversity Web — Formicidae](https://animaldiversity.org/accounts/Formicidae/).
- **Cat, dog:** domestic and established feral populations justify Worldwide. [ADW — domestic cat](https://animaldiversity.org/accounts/Felis_catus/), [ADW — dog](https://animaldiversity.org/accounts/Canis_lupus_familiaris/).
- **Chicken, rooster, cow, goat, horse, pig, sheep:** worldwide farming rather than native wild distribution. [FAO — global livestock distributions](https://www.fao.org/livestock-systems/global-distributions/en/), [FAO — livestock biodiversity](https://www.fao.org/4/a1250e/a1250e02.pdf).
- **Crocodile:** warm-region association retained, with a dedicated map excluding Europe and temperate Australia. [National Geographic — crocodilian ranges](https://education.nationalgeographic.org/resource/crocodilian-ranges/), [ADW — saltwater crocodile](https://animaldiversity.org/accounts/Crocodylus_porosus/).
- **Deer:** native to the Americas, Europe, Asia, and a small part of northwest Africa. Australia/New Zealand populations are introduced; retained in the full fact. [ADW — Cervidae](https://animaldiversity.org/accounts/Cervidae/).
- **Duck:** the broad group spans six inhabited continents, including introduced populations. [ADW — Anseriformes](https://animaldiversity.org/accounts/Anseriformes/), [ADW — mallard](https://animaldiversity.org/accounts/Anas_platyrhynchos/).
- **Eagle:** replaced “Many regions” with Worldwide at group level. [ADW — Accipitridae](https://animaldiversity.org/accounts/Accipitridae/).
- **Flamingo:** native continental footprint excludes Australia and Antarctica; “warm” alone misses cold high-altitude lakes. Updated both location and temperature facts. [SeaWorld — flamingo habitats and distribution](https://seaworld.org/animals/all-about/flamingos/habitat/).
- **Fox:** broad common-name group spans the Americas and Afro-Eurasia; introduced red foxes add Australia. [ADW — red fox](https://animaldiversity.org/accounts/Vulpes_vulpes/), [ADW — South American gray fox](https://animaldiversity.org/accounts/Lycalopex_griseus/).
- **Frog:** broad group occurs on six inhabited continents. [American Museum of Natural History — Anura](https://amphibiansoftheworld.amnh.org/Amphibia/Anura).
- **Gecko:** six inhabited continents, with mild-climate species as well as tropical ones. [San Diego Zoo Wildlife Explorers — gecko](https://sdzwildlifeexplorers.org/animals/gecko).
- **Hedgehog:** Afro-Eurasian native distribution; New Zealand is an introduction, now explicitly identified. [San Diego Zoo — hedgehog](https://animals.sandiegozoo.org/animals/hedgehog), [New Zealand DOC — hedgehogs](https://www.doc.govt.nz/nature/pests-and-threats/animal-pests-and-threats/hedgehogs/).
- **Ibis:** species occur in temperate as well as tropical wetlands on all six inhabited continents. [American Ornithological Society — checklist, Threskiornithidae](https://americanornithology.org/wp-content/uploads/2019/07/AOSChecklistTin-Falcon.pdf), [Trust for Avian Systematics — family checklist](https://www.aviansystematics.org/checklist?viewfamilies=24).
- **Monkey:** Africa/Asia and Mexico/Central/South America; no native Australia. Some Asian species occupy snowy mountains, so “warm regions” is insufficient. [San Diego Zoo — monkey](https://animals.sandiegozoo.org/animals/monkey).
- **Mouse:** the farm-associated profile is treated as house mouse, globally spread by humans. [ADW — house mouse](https://animaldiversity.org/accounts/Mus_musculus/).
- **Otter:** corrected Worldwide to five continents; Australia and Antarctica have no native otters. [San Diego Zoo — otter](https://animals.sandiegozoo.org/animals/otter).
- **Owl:** group-level worldwide terrestrial range. [ADW — Strigiformes](https://animaldiversity.org/accounts/Strigiformes/).
- **Parrot:** predominantly tropical/subtropical native distribution, but includes temperate/alpine New Zealand species. Established introduced European populations support the current worldwide continental overview. [DOC — kea](https://www.doc.govt.nz/kea), [RSPB — ring-necked parakeet](https://www.rspb.org.uk/birds-and-wildlife/ring-necked-parakeet/).
- **Rabbit:** native and introduced populations together span inhabited continents, including Australia/New Zealand introductions. [ADW — Leporidae](https://animaldiversity.org/accounts/Leporidae/), [Australian government — Leporidae](https://www.dcceew.gov.au/sites/default/files/env/pages/a117ced5-9a94-4586-afdb-1f333618e1e3/files/45-ind.pdf).
- **Seal:** coastal/marine distribution, mostly cold or temperate, with warm-water exceptions; uses Global coasts rather than a terrestrial Worldwide map. [NOAA — seals and sea lions](https://www.fisheries.noaa.gov/seals-sea-lions).
- **Snail:** broad terrestrial/aquatic group, retained as a worldwide continental overview. [ADW — Gastropoda](https://animaldiversity.org/accounts/Gastropoda/).
- **Swan:** broad temperate distribution in both hemispheres; full fact retains Arctic breeding exceptions. [ADW — black swan](https://animaldiversity.org/accounts/Cygnus_atratus/), [ADW — Anseriformes](https://animaldiversity.org/accounts/Anseriformes/).
- **Tarantula:** warm areas of all six inhabited continents. [San Diego Zoo — tarantula](https://animals.sandiegozoo.org/animals/tarantula).
- **Tortoise:** Americas, Africa, Europe and Asia, with island populations; not native to Australia. [ADW — Testudinidae](https://animaldiversity.org/accounts/Testudinidae/).
- **Turkey:** North American wild origin; worldwide domestic farming remains explicit in the full fact. [Cornell Lab — wild turkey range](https://www.allaboutbirds.org/guide/wild_turkey/maps-range).

## Assets and validation

- [Generation prompts and installed asset paths](region-map-prompts.json).
- [Encoded alpha checks](region-map-alpha-checks.json).
- Local visual review: `output/animal-region-review/maps.png`.
- Browser checks cover shared images/captions, successful loads, and single-line full-width bottom pills. Production build and animal/insect component tests are run with the final assets.
