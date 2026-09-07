# Teenie Friends artwork

Teenie Friends (`teenie`) uses the existing Teenieping portraits as identity references, with new action illustrations matching their rounded 3D style. Heartsping welcomes and encourages, while Tidyping, Artping, Mightyping, Hurryping, Yumyumping, Scrubping, Sleeping, Timidping and Toyping illustrate the daily routines.

The artwork inventory comprises 27 character scenes, 16 seasonal landscapes, 67 animal/insect ability analogies, and 16 native SVG controls. School-day and dinner scenes serve multiple roles. The existing Heartsping portrait and Giftping gift prop are reused by URL. The scenery uses the lilac castle as its architectural reference; production imports use optimized WebP scenery rather than the source castle PNG.

Character scenes, props, ability illustrations and SVG controls have transparent backgrounds. The seasonal landscapes are deliberately opaque. The exporter rejected 46 ability masters with painted checkerboards. After image-tool corrections also returned opaque files, the user explicitly authorized local background removal on 7 September 2026.

`scripts/remove-teenie-backgrounds.py` preserves the original masters and creates separate RGBA masters under `output/teenie-theme/local-alpha/`. It uses U2Net to protect white subject interiors, removes connected neutral checkerboard regions, repairs pale fur outlines, and removes the white matte along a narrow antialiased edge. The firefly's yellow aura uses chroma extraction to remove the checkerboard beneath its light. Each correction record retains its input source, method and user authorization. The cutouts were inspected against plum and pale lilac backgrounds, including ears, white fur, detached props, wings and web threads.

Files are installed under `src/assets/themes/teenie/` and `src/assets/animal-abilities-generic/teenie/`. `src/ui/themeAssets.ts` maps semantic UI roles to assets for Princess and Teenie Friends. The `bravePrincess` stored chore key remains compatible and is presented as “Being brave” in the Teenie theme. Animal and insect facts and the Teenieping quiz collection are unchanged; the new ability pictures are visual analogies performed by Mightyping.

The full prompts, reference paths, selected master paths, export dimensions, alpha checks and byte sizes are in [teenie-theme-artwork.json](teenie-theme-artwork.json). Original generation records are in `teenie-theme-generation/`; transparency corrections are in `teenie-theme-corrections/`. Generation used the built-in `image_gen` tool. Raw masters remain at their recorded original paths.

Run `python scripts/prepare-teenie-theme.py` to reproduce production WebP exports from the recorded masters. Pillow is required. The exporter checks that every transparent master has an actual alpha channel with fully clear and fully opaque pixels and sufficient clear area, then verifies that WebP encoding preserves the resized alpha channel exactly. It produces dark-background contact sheets and a rejection report under `output/teenie-theme/`, and exits unsuccessfully if the set is incomplete or an opaque master remains.

To reproduce local corrections first, run `python scripts/remove-teenie-backgrounds.py` with Pillow, NumPy, SciPy and `rembg[cpu]` installed. The script reuses cached U2Net masks under `tmp/teenie-alpha-masks/`; its model cache is `tmp/insect-bg-models/`. Production files are committed assets and do not require these Python dependencies at runtime.

Validation is recorded in the implementation plan after the final artwork and application checks.
