# PAW Patrol dinosaur additions

The existing Dinosaurs collection now has **18 creatures**, including all ten named dinosaur genera on the movie working checklist. Added **Brachiosaurus, Mahakala and Spinosaurus**. Ankylosaurus, Pachycephalosaurus, Parasaurolophus, Stegosaurus, Triceratops, Tyrannosaurus rex and Velociraptor were already available and retain their existing Bad Dinosaurs portraits. No duplicate genus entries were added.

The movie checklist is fan-maintained, not an exhaustive official species inventory. Unspecified “raptors” are not counted as a separate taxon. “Pterodactyl” is not enough evidence to assign a new genus or claim that the movie animal is the existing Pteranodon. It remains unresolved. Donnie remains excluded.

| Addition      | Food           | Habitat      | Ability            | Period          | Hidden-answer ability |
| ------------- | -------------- | ------------ | ------------------ | --------------- | --------------------- |
| Brachiosaurus | Plants         | River plains | High browsing      | Late Jurassic   | reach                 |
| Mahakala      | Small animals? | Dry dunes    | Curved foot claws  | Late Cretaceous | grip                  |
| Spinosaurus   | Fish           | Wetlands     | Fish-catching jaws | Late Cretaceous | bite                  |

Each new genus has one transparent cartoon portrait, one realistic reconstruction and one individual ability illustration. Food, habitat and period images are shared with existing entries. Hidden two-player answers and hard solo clues reuse the appropriate Teenie Ping or princess-bear generic ability image. Learn mode starts with cartoon and name, a click changes portrait and a double-click enlarges it. No new portrait text or style buttons were introduced.

## Artwork

Built-in imagegen created the nine final PNGs under `src/assets/dinosaurs/{cartoon,realistic,abilities}/`. They are copied unchanged with their generated alpha. Exact prompts, source masters, reference files and destinations are in [the generation manifest](2026-09-19-paw-patrol-dinosaur-prompts.json).

- Brachiosaurus cartoon: based on the gray-blue brachiosaurs at the right of the movie's island publicity still. This is a teaching recreation of that design, not a verified exact model of the named individual Nellie; unseen details are inferred.
- Mahakala cartoon: the orange, large blue-eyed dinosaur at the lower left of the Mahakala/Skye/Rex publicity poster. Its smooth cartoon skin is intentionally different from the feathered reconstruction.
- Spinosaurus cartoon: uses the licensed movie toy's dark teal body, cream underside and orange sail as a design reference. Toy seams, mechanisms, rider and slide rails are omitted. The recreation is approximate, not a studio render.
- Realistic portraits are speculative paleoart. Colors are illustrative. Mahakala's feather covering is inferred from relatives, not preserved plumage from its described fossil. Brachiosaurus and Spinosaurus proportions also involve reconstruction of incomplete skeletons.
- Spinosaurus's realistic portrait received a framing correction to keep its complete tail visible.

## Sources

Movie checklist: [PAW Patrol Wiki](https://pawpatrol.fandom.com/wiki/PAW_Patrol%3A_The_Dino_Movie).

Movie design references:

- [Mahakala, Skye and Rex publicity poster — Moviefone](https://www.moviefone.com/movie/untitled-third-paw-patrol-film/rvy0R5BkZIJoFEdwroVzx6/highlights/6PkdMCYtJiC7DpwJZ9ffD3/).
- [Movie island still — Telegraph India](https://www.telegraphindia.com/entertainment/paw-patrol-the-dino-movie-meet-the-stars-joining-voice-cast-for-the-dinosaur-adventure/cid/2175693).
- [Official licensed Spinosaurus toy — PAW Patrol](https://www.pawpatrol.com/shop/product/paw-patrol-the-dino-movie-rise-roll-dino-set-6076191).

Scientific references:

- [NHM Brachiosaurus](https://www.nhm.ac.uk/discover/dino-directory/brachiosaurus.html): Late Jurassic, plants, taller front limbs and high browsing. [NPS Morrison Formation](https://www.nps.gov/subjects/fossils/the-morrison-formation.htm): broad river-plain habitat.
- [Turner et al. 2007, original Mahakala description](https://doi.org/10.1126/science.1144066) and [Turner, Pol and Norell 2011, detailed anatomy](https://doi.org/10.1206/3722.2): small dromaeosaurid, short arms, Campanian Djadokhta Formation in Mongolia and long curved second-toe claw. Small-animal diet and gripping function are inferences; they remain qualified in the clues. The shared desert picture represents a broad Djadokhta landscape, not a claim of an exclusive habitat.
- [NHM Spinosaurus](https://www.nhm.ac.uk/discover/dino-directory/spinosaurus.html): Late Cretaceous, fish-catching jaws, coastal wetland habitat, short hind legs and deep tail. Swimming mode and sail function remain debated and are not taught as settled facts.

## Validation

The existing collection traversal test covers all 18 creatures and their portrait and clue assets, including generic abilities in both themes. Test case count is unchanged.

- Targeted Vitest run: DinosaurTester, AnimalTester and PictureGestures — 3 files, 10 tests passed. The first run alongside the production build exceeded the existing one-second collection-loading wait; the repeat passed without changing test timeouts.
- Production build passed; the existing large-chunk warning remains. Scoped ESLint and `git diff --check` passed.
- Browser preview at 420px content width: checked all three new cards, cartoon/realistic switching, double-click enlargement, all four clues, and the Spinosaurus generic ability in both themes.
- All nine final PNGs are 1254 × 1254 RGBA with transparent pixels and are byte-for-byte copies of their generated masters.
