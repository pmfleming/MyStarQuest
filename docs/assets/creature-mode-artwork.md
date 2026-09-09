# Creature game mode artwork

The Learn, 1 Player and 2 Players controls follow the selected creature collection, independently of the Princess or Teenie Friends colour theme. Accessible labels and the selected game mode remain unchanged when switching collections. The matching pair also appears when hiding a two-player portrait and on its Next/Finish action.

| Collection  | Learn                        | 1 Player                   | 2 Players                             |
| ----------- | ---------------------------- | -------------------------- | ------------------------------------- |
| Animals     | Existing owl reading         | Existing fox investigating | Existing rabbit and raccoon guessing  |
| Insects     | Bumblebee reading            | Ladybird investigating     | Bumblebee and ladybird guessing       |
| Teeniepings | Existing studying Teenieping | Heartsping investigating   | Heartsping and Okeydokeyping guessing |

The five new illustrations use built-in image generation. The [prompt and source manifest](creature-mode-artwork.json) records their references and final destinations under `src/assets/creature-mode-icons`. Animal images remain under `src/assets/animal-mode-icons`; Teenieping Learn reuses `src/assets/themes/teenie/schooltime.webp`.

Run `python scripts/prepare-creature-mode-images.py` to encode the recorded PNG sources as WebP. It rejects opaque images and verifies that encoding preserves every alpha value. The generated art is interface artwork, kept outside the Spelling and Who Am I character catalogs.

Validation on 9 September 2026: all five new assets passed alpha checks. The actual controls were reviewed at 390px in both themes, including the matching hidden portrait and Next action. All 16 tests across the Animal, Insect, Teenieping and collection-loading suites passed, along with TypeScript, production build and lint checks. The existing collection-selector test now checks artwork switching and preserves the selected mode; no new test cases were added.
