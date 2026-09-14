# Who Am I: 22 additional animals

The animal collection grows from 71 to 93 entries. New animals are available in Learn, 1 Player and 2 Players through the existing catalog. All new media is bundled locally, including the photographs; viewing it does not require an internet connection once the app is installed.

Added: red panda, axolotl, seahorse, chameleon, toucan, peacock, platypus, walrus, ring-tailed lemur, porcupine, sea turtle, squirrel, puffin, ostrich, pelican, capybara, wombat, pangolin, anteater, jellyfish, lobster and clownfish.

Each entry provides location, environment, food and ability clues. The 22 transparent illustrations depict the teaching action, allowing the portrait and ability card to share one image. Existing princess and Teenieping ability illustrations support the hidden-answer views. The red squirrel uses a new Europe-and-Asia map derived from the bundled `public/data/world-50m-2024.json` geography.

The [asset manifest](2026-09-14-animal-expansion.json) records exact species, factual references, saved illustration/photo paths, and the full prompts used with built-in imagegen. Real photographs were downloaded from Wikimedia Commons. Their backgrounds were removed locally with [rembg](https://github.com/danielgatis/rembg) using BiRefNet-general segmentation, preserving the original animal pixels. Only the selected animal remains, centred on a transparent WebP canvas. Imagegen background-removal attempts were rejected and are not used in the final photographs. Photo credits and licences are recorded in [Who Am I photo credits](who-am-i-photo-credits.md) and the app's structured credit catalog.

Validation:

- All 22 illustration/photo pairs visually reviewed; every illustration and photograph has actual alpha transparency. Photo cutouts were also checked on light and dark backgrounds.
- All 22 entries checked in a mobile browser in both princess and Teenieping themes: local image loading, photo/drawing switching, themed ability switching and navigation.
- Existing animal, insect and photo collection tests pass; no tests were added or removed.
- Full Vitest run: 146 passed, with the existing weather-cycling test exceeding its five-second timeout. All four weather tests passed when rerun with a 15-second command-line timeout; test source and configured timeouts are unchanged.
- TypeScript, production build and lint checks pass.
