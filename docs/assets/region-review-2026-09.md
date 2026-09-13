# Who Am I region review — 13 September 2026

Reviewed all 75 animal knowledge profiles (71 currently shown in Animals) and all 34 Insects entries. The animal registry is reduced from 29 to 20 categories; 15 profile assignments change. The complete before/after list, precise facts and insect audit are in [region-assignments.json](region-assignments.json).

## Consistent level of detail

Cards teach broad geography; the existing full fact supplies the precise range. A continent illustration means the animal occurs in part of that continent, not throughout every illustrated habitat. Scenery depicts the region, not an exact species distribution. Native ranges and human introductions remain distinguished in the original facts.

| Previous categories                                    | Current region         | Profiles changed                |
| ------------------------------------------------------ | ---------------------- | ------------------------------- |
| Central & West Africa, Central Africa, Southern Africa | Africa                 | Chimpanzee, gorilla, meerkat    |
| Eastern Australia                                      | Australia              | Koala                           |
| Central China, Central Asia                            | Asia                   | Panda, yak                      |
| Africa & Iran, Africa & India                          | Africa & Asia          | Cheetah, lion                   |
| Andes                                                  | South America          | Alpaca, llama                   |
| America, Central & South America                       | Americas               | Armadillo, skunk, jaguar, sloth |
| New Guinea & N. Australia                              | New Guinea & Australia | Green tree python               |

The green tree python's full fact still specifies New Guinea and **northern** Australia. Its broader two-landmass overview matches the level used for other animals. New Zealand stays distinct: it is not Australia. The Andes remain in the alpaca/llama fact and feature prominently in South America's scenery.

Overlap alone does not make categories interchangeable. Africa & Asia, Afro-Eurasia, Northern continents, Five continents and Africa/Asia/Americas retain different continental membership; merging them into Worldwide would imply extra continents. Similarly, coast, ocean, Arctic, warm and temperate categories express useful different geography. Compact card captions such as `N. Am. & Eurasia`, `Afro-Eurasia`, and `Aus. & N. Guinea` keep the existing single-line phone layout readable. The mild-climate card now says `Temperate zones`. Full descriptions remain in the accessible facts and the region list below.

## Region list

| Region                  | Profiles                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Africa                  | chimpanzee, giraffe, gorilla, hippo, meerkat, zebra                                                                                                                   |
| South America           | alpaca, llama                                                                                                                                                         |
| Asia                    | panda, tiger, yak                                                                                                                                                     |
| Australia               | kangaroo, koala                                                                                                                                                       |
| North America           | bluebird, raccoon, turkey                                                                                                                                             |
| Americas                | armadillo, jaguar, skunk, sloth                                                                                                                                       |
| Africa & Asia           | camel, cheetah, elephant, lion, rhino                                                                                                                                 |
| Africa, Europe & Asia   | hedgehog, jackal                                                                                                                                                      |
| Northern continents     | bear, beaver, mole, newt, vole, wolf                                                                                                                                  |
| Five continents         | deer, flamingo, otter, tortoise                                                                                                                                       |
| Africa, Asia & Americas | monkey                                                                                                                                                                |
| Australia & New Guinea  | green-tree-python                                                                                                                                                     |
| New Zealand             | kiwi                                                                                                                                                                  |
| Arctic                  | polar-bear                                                                                                                                                            |
| Global oceans           | blue-whale, dolphin, octopus, shark                                                                                                                                   |
| Worldwide               | ant, bat, bee, butterfly, cat, chicken, cow, dog, duck, eagle, fox, frog, gecko, goat, horse, ibis, mouse, owl, parrot, pig, rabbit, rooster, sheep, snail, tarantula |
| Warm regions            | crocodile                                                                                                                                                             |
| Temperate regions       | swan                                                                                                                                                                  |
| Global coasts           | crab, seal                                                                                                                                                            |
| Southern Hemisphere     | penguin                                                                                                                                                               |

## Insect collection

All 34 current insect/arachnid entries were inspected. They have HOME, FOOD, LOOKS and SPECIAL clues, and **no location field or region card**. Their representative species are illustration references; the game does not currently teach species-level geographic ranges. This update preserves those four clues. The shared legacy animal records for ant, bee, butterfly and tarantula still resolve to the new Worldwide image, but those location cards are not displayed in the Insects collection. Adding an insect region clue would be a separate change to its teaching/gameplay content, rather than an image replacement.

## Artwork contract

- Regional insets have a small world atlas behind/above a much larger foreground region. Worldwide, Five continents and Global coasts instead show only one large highlighted map, without a background atlas or connecting lines.
- The source region is removed from the small atlas: the empty position and fine dotted projection lines explain where the enlarged shape came from. An empty cutout rim is allowed; a second filled continent is not.
- Foreground geography contains recognizable landscape scenes appropriate to the region, with a warm gold edge. No animals, baked-in captions or card borders.
- Multi-continent insets lift the selected land group. Worldwide shows the six inhabited continents, including Australia and New Zealand; Five continents omits Australia and New Zealand. Both omit Antarctica and have transparent oceans. Global oceans uses a standalone sea cutaway with a surface wave, sunlight, open water, coral, kelp and seafloor; it contains no map or continent shapes. Coasts select shorelines; climate belts and the Arctic use region insets.
- Real alpha transparency is required. A painted checkerboard is rejected by the exporter. No local background extraction is used in this set.
- The app supplies the caption and theme. Precise place facts remain accessible as each location card's accessible name.

Final WebP files are in `src/assets/animal-locations/expanded/`; [expanded-region-images.json](expanded-region-images.json) records exact prompts, generated source paths, and installed destinations. Images were made with the **built-in image_gen tool**. [prepare-expanded-region-images.py](../../scripts/prepare-expanded-region-images.py) performs format/size conversion while preserving alpha.

## Evidence

The [earlier factual review](animal-region-review.md) remains the source record for existing animal ranges. The following sources were checked again for the consolidation decisions:

- [San Diego Zoo — cheetah](https://animals.sandiegozoo.org/animals/cheetah): African distribution and the Iranian population support the broad Africa & Asia category while retaining Iran in the precise fact.
- [San Diego Zoo — lion](https://animals.sandiegozoo.org/animals/lion): African and Indian populations support Africa & Asia, with India retained in the precise fact.
- [San Diego Zoo — koala](https://animals.sandiegozoo.org/animals/koala): eastern/southeastern Australia remains the precise fact behind the Australia overview.
- [Smithsonian — giant panda](https://nationalzoo.si.edu/animals/giant-panda-faqs): central Chinese mountain bamboo forests remain the precise fact behind the Asia overview.

## Verification

All 20 installed maps passed alpha and 512-pixel export checks; together they total 1,693,566 bytes (the previous 29 scenic assets totalled 1,733,708 bytes). The three existing animal/insect/session component suites passed all 10 tests. The production build passed, with the existing large-chunk advisory; ESLint passed for the changed TypeScript files.

The South America, Australia & New Guinea, and New Zealand images were subsequently revised to match the standard cream world-map backdrop. Their blue ocean panels were replaced with transparent space between the cream land silhouettes. The enlarged regions remain absent from the small atlas. All 20 exports were revalidated and both gallery backgrounds were refreshed after these three replacements.

Worldwide and Five continents were then simplified to single scenic maps, removing their background atlases and projection lines. Their distinct continental membership is preserved. Global coasts was likewise simplified to a single shoreline map, retaining pale cream interiors and narrow illustrated coasts. Global oceans was subsequently replaced by an ocean environment illustration with no map. The Southern Hemisphere was redrawn with a clear equator cut, scenic southern land and oceans, and a plain cream northern reference map above an empty transparent source gap. All 20 exports passed transparency checks again, and the revised artwork was inspected in the refreshed pink and dark galleries.

The browser traversed all 71 visible animals at 320px and 620px: all 20 categories were encountered, every caption matched its registered image, all images loaded, and all caption pills fitted on one line at full card width. There were no browser errors. Final artwork was also visually inspected on pink and dark backgrounds.

The [gallery](../../output/expanded-region-review/gallery.html), [pink contact sheet](../../output/expanded-region-review/gallery-pink.png), [dark contact sheet](../../output/expanded-region-review/gallery-dark.png), `export-checks.json`, and `browser-checks.json` are local review outputs under `output/expanded-region-review/` (not production assets).
