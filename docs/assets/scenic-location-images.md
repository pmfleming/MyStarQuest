# Scenic location artwork

This set supersedes the earlier cutout continent maps. All 29 active location categories now use the same scenic treatment requested in the user's Africa/Australia examples:

- A large foreground geographic shape with vivid landscape scenes inside it.
- A warm gold edge on the selected geography.
- A soft, pale aqua world-map backdrop and subdued cream unselected regions.
- Transparent outer vignette edges, with no embedded caption, text pill or card frame.

The built-in image tool created an Africa style master, then used it as a reference for every other image. Final assets are under `src/assets/animal-locations/scenic/`. Original generated PNGs, exact prompts and exported paths are recorded in [the manifest](scenic-location-images.json). The exporter preserves genuine alpha when present, or extracts the exterior background while retaining the pale map and soft blue ocean vignette.

## Category consistency

`ANIMAL_LOCATIONS` is the single registry for both the displayed caption and image. Every active location category has one unique scenic asset. The old Earth/Australia/Africa/Asia/America catch-all assignments have been split where they previously put a mismatched region under a more specific caption:

- Chimpanzee → Central & West Africa; gorilla → Central Africa; meerkat → Southern Africa.
- Green tree python → New Guinea and northern Australia; kiwi → New Zealand; koala → Eastern Australia.
- Camel, elephant and rhino → Africa & Asia; lion → Africa & India.
- Jaguar and sloth → Central & South America; panda → Central China; yak → Central Asia.
- Mole, newt and wolf → the shared North America, Europe and Asia category.
- Penguin → Southern Hemisphere.

The factual range review remains in [animal-region-review.md](animal-region-review.md). These images are educational regional illustrations, not precise species-distribution polygons. Foreground enlargement is deliberate; the background map supplies context.

Scenery highlights follow the named regions: rainforest in Central/West Africa; rainforest in New Guinea, Aru Islands and Cape York; eucalyptus woodland along eastern Australia; bamboo mountain forest in central China; savanna in Africa with a small Gir/Gujarat highlight in India. Supporting references: [Smithsonian — giant panda range](https://nationalzoo.si.edu/animals/giant-panda), [San Diego Zoo — lions and Gir](https://adminblogs.sandiegozoo.org/zoonooz/saving-simba/), [San Diego Zoo — green tree python](https://library.sandiegozoo.org/wp-content/uploads/2020/03/python_green_tree.pdf).

## Review outputs

- `output/scenic-location-review/gallery-pink.png` and `gallery-dark.png`: all final assets composited on contrasting backgrounds.
- `output/scenic-location-review/alpha-checks.json`: encoded transparency and file-size checks.
- `output/scenic-location-review/browser-checks.json`: every active animal's matching category, caption and image, checked at 320px and 620px.

The game continues to supply its own themed border and full-width, single-line bottom text pill.

Validation: all 71 animal cards resolve to the expected 29 categories at 320px and 620px. All 420 animal/insect fact labels passed the narrow-screen checks for a single line, full width and bottom alignment. The AnimalTester and InsectTester component suites passed all 14 tests. Assets are exported as 512px WebP images with alpha; the full-resolution originals remain recorded in the manifest.
