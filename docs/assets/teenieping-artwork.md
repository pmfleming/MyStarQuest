# Teenieping game artwork

The third collection in the Animals activity is Teeniepings. Its catalog follows the 84 portraits already in `src/assets/teenie`; castle scenery is excluded.

Each portrait requires four individually generated illustrations:

| Clue  | Picture                                                   |
| ----- | --------------------------------------------------------- |
| Looks | Recognisable hairstyle, headwear, or physical detail      |
| Prop  | The character's tool or accessory, shown separately       |
| Theme | A simple visual symbol for an emotion, activity, or motif |
| Magic | The researched magical effect in action                   |

The complete set contains 336 transparent WebP files under `src/assets/teenie/{looks,prop,theme,magic}/{id}.webp`. The selector is enabled only when the entire set is present. The [artwork preview](teenieping-artwork.html) reports the current exported count and offers coloured backgrounds for checking transparency.

## Generation and sources

Artwork uses the built-in `image_gen` tool, with one call per clue image. Looks, Prop, and Magic use the corresponding existing portrait as a style and identity reference. Theme uses a symbolic scene without a character reference, so it does not reveal the answer; early successful symbolic scenes retain their original reference-based generation. The requested prompts are in [teenieping-image-prompts.json](teenieping-image-prompts.json). Selected output paths and actual prompts are recorded in [teenieping-image-outputs.json](teenieping-image-outputs.json), assembled from the individual records in `teenieping-generation`. Source PNG copies are kept in the ignored `output/teenieping/raw` directory.

The [research table](teenieping-research.html) links the character sources. These fan-wiki facts were researched through search-indexed text; the selected short themes are editorial descriptions for children.

Romi's temporary Romiping form is included as a bonus exception. Her game prop is the ordinary pink belt bag visible in the existing portrait; it is not claimed to be a magical tool. Her Magic clue describes friends turning her tiny, rather than an innate power.

## Transparency and packaging

Run `python scripts/prepare-teenieping-images.py` to copy sources and encode accepted images as WebP. The script requires actual RGBA transparency, preserves the original dimensions, and compares every alpha value before and after encoding. Images with opaque backgrounds, including painted checkerboards, are rejected for correction. It also rebuilds the artwork preview.

Use the preview on lilac, white, dark blue, and mint to check light outlines, holes between accessories, and soft magical effects. Alpha presence alone does not establish good edge quality.

## Game behaviour

Learn shows all four clues beside each portrait. Solo reveals Theme, Prop, Magic, then Looks, with three choices on Easy and six on Hard. Alternate forms of the answer's underlying identity are excluded from its distractors: Happying/Giggleping and Henryping/Frogping. The two-player mode supports hiding and showing the main portrait while retaining the clue cards.

The component coverage in `tests/component/TeeniepingTester.test.tsx` verifies portrait coverage, 336 separate clue URLs, collection switching, clue order, answer handling, and two-player controls. All 16 tests across the Animal, Insect, and Teenieping suites pass. The phone preview was checked for Learn navigation, long captions, six-choice Hard mode, and the two-player hide/reveal control.
