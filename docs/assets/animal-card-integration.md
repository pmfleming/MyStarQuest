# Animal card image integration

All 15 selected images are installed in the project and used by the animal or insect games. Original generated previews remain available separately.

The built-in image tool removed baked-in frames and captions from the card artwork. Local background extraction then produced real alpha transparency, checked after WebP encoding and against pink and dark backgrounds. The game supplies its own themed border and one live single-line text pill aligned to the bottom of each square. Map, food, and habitat artwork uses contain fitting to prevent cropping. Exports use 768 × 768 WebP, quality 90. See the transparency audit for final encoded sizes.

## Installed artwork

- [Grass](../../src/assets/animal-foods/grass-card-art.webp)
- [Leaves](../../src/assets/animal-foods/leaves-card-art.webp)
- [Fruit](../../src/assets/animal-foods/fruit-card-art.webp)
- [Seeds & Nuts](../../src/assets/animal-foods/seeds-and-nuts-card-art.webp)
- [Roots](../../src/assets/animal-foods/roots-card-art.webp)
- [Flowers & Nectar](../../src/assets/animal-foods/flowers-and-nectar-card-art.webp)
- [Rodents](../../src/assets/animal-foods/rodents-card-art.webp)
- [Birds](../../src/assets/animal-foods/birds-card-art.webp)
- [Antelopes](../../src/assets/animal-foods/antelopes-card-art.webp)
- [Reptiles](../../src/assets/animal-foods/reptiles-card-art.webp)
- [Coastline](../../src/assets/animal-habitats/coastline-card-art.webp)
- [The Andes of South America](../../src/assets/animal-locations/andes-card-art.webp)
- [North America, Europe, and Asia](../../src/assets/animal-locations/north-america-europe-asia-card-art.webp)
- [Africa & Iran](../../src/assets/animal-locations/africa-iran-card-art.webp)
- [Trunk](../../src/assets/animal-abilities-generic/princess/trunk.webp)

## Assignments

- Andes: alpaca and llama.
- North America, Europe, and Asia: bear, beaver, and vole.
- Africa & Iran: cheetah. The display caption is shortened; the detailed geographic fact is retained.
- Coastline: crab.
- Grass, Leaves, Roots, Fruit, Seeds & Nuts, and Flowers & Nectar replace the broad plant food image. Assignments follow each profile's existing diet examples. Nectar, grass, and leaf insect profiles share the new artwork.
- Rodents, Birds, Antelopes, and Reptiles replace broad meat/prey images. Fish, Deer, and other existing specific food cards remain in use.
- Princess Bear's Trunk ability uses one trunk growing from his nose.

## Validation

- Production build passed (existing bundle-size warning remains).
- Animal and insect component suites: 13 tests passed.
- ESLint passed for changed TypeScript/TSX files.
- All 15 WebP files have real alpha transparency, with no embedded frame or caption.
- Browser layout checks cover 420 animal and insect labels at 320px: all remain on one line, fit within the card, and align with the bottom of a square card. Accessible names retain the full facts.
- Browser review: seven animal screens checked at desktop and mobile sizes, plus the elephant's switched Trunk ability. No browser errors or failed artwork loads.
- [Artwork gallery](../../output/animal-card-review/gallery.html).
- [Generation prompts and final asset paths](animal-card-integration.json).
