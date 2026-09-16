# Who am I: dinosaur learning collection

Ten paired creatures from the Bad Dinosaurs image collection are available under **Dinosaurs**. Eight are dinosaurs; Pteranodon and Quetzalcoatlus are labeled pterosaurs. This is a partial collection: the supplied creature checklist has six additional entries, including pilot-only Allosaurus and the unidentified mammal Donnie. See the [completeness audit](2026-09-16-bad-dinosaurs-completeness.md) for omissions and identification qualifications.

Learn mode uses the same compact portrait as the other creatures: cartoon first, scientific name underneath, and a click or tap on the card switches to the realistic reconstruction and back. There are no separate picture-style buttons. Four illustrated clue cards cover food, habitat, ability and geological period; see [the updated clue catalogue](2026-09-16-dinosaur-clues.md). Easy solo mode uses cartoon choices; Hard uses reconstructions. Both modes use real-animal facts, not character trivia. Two-player mode retains the hide/reveal portrait interaction. Learning is unscored.

The 20 PNGs under `src/assets/dinosaurs/` are unchanged copies of the images created earlier in this task using built-in image generation. Alpha transparency is preserved. Both styles are illustrations: the cartoon side recreates show references and the realistic side is speculative paleoart, not a photograph. Quentin's unseen body was reconstructed. Brontosaurus, Parasaurolophus, Velociraptor and Pteranodon are tentative cartoon-to-genus matches. These qualifications and pronunciation/comparison content are retained in the collection data. Character designs remain those of their respective owners.

The collection module is loaded on selection, and image URLs are bundled locally so no external image host is required. The original PNG set is about 32 MB; individual pictures load when used. Generation prompts are retained in [the prompt manifest](2026-09-16-dinosaur-prompts.json).

## References

- [Starting creature list — Dinopedia](https://dinopedia.fandom.com/wiki/Bad_Dinosaurs)
- [Production art — Jan Esparza Monrós](https://www.artstation.com/artwork/PXP9zn)
- [Show stills and character names — Romper](https://www.romper.com/entertainment/netflix-bad-dinosaurs-characters-names)
- [Director's Quentin post indexed by Pictame](https://pictame.com/en/discover/hashtag/the-dinosaurs-netflix-quetzalcoatlus)
- [NHM dinosaur directory](https://www.nhm.ac.uk/discover/dino-directory/index.html): anatomy, diet and period for the dinosaur entries; per-animal source links are in `dinosaurKnowledge.ts`.
- [NHM Brontosaurus](https://www.nhm.ac.uk/discover/brontosaurus-reinstating-a-prehistoric-icon.html)
- [AMNH Pteranodon](https://www.amnh.org/explore/ology/ology-cards/358-pteranodon-longiceps)
- [UT Austin Quetzalcoatlus](https://news.utexas.edu/2021/12/08/worlds-largest-pterosaur-leaped-aloft-to-fly/)
- [AMNH Velociraptor feather evidence](https://www.amnh.org/explore/news-blogs/velociraptor-feather-evidence)

Pachycephalosaurus's diet is qualified as probable, and Quetzalcoatlus's exact prey is left uncertain. No claims about dinosaur colors, pack hunting, head-butting behavior or exact sizes are taught as established facts.
