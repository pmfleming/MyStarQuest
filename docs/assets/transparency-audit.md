# Transparency audit

All 15 active custom images listed in `animal-card-integration.json` now have real alpha transparency. Encoded WebP files were reopened to verify an alpha channel, fully transparent background pixels, and visible artwork. The files contain no embedded text pills or card borders.

The built-in image tool created the artwork. Its transparency attempts returned opaque RGB images, so the final exports use local background extraction through `scripts/prepare-animal-card-images.py`. Painted checkerboard variants were rejected.

The six superseded PNG previews have been moved from `src/assets` to `output/imagegen/card-source-references`. The game continues to import the borderless WebP artwork, and supplies its own frame and text pill.

White exterior backgrounds were extracted from food, coastline, and Princess Bear artwork; the maps' cyan ocean backdrops were extracted while preserving cream land and highlighted geography. All 15 cutouts were visually checked against pink and dark backgrounds. The game was rechecked with the final exports.

Detailed encoded file sizes and alpha measurements: [transparency checks](animal-card-transparency-checks.json). Review composites are saved locally at `output/animal-card-review/transparency-pink.png` and `output/animal-card-review/transparency-dark.png`.
