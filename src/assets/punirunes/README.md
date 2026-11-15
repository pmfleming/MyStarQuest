# Punirunes character assets

53 transparent PNGs: all **52 distinct characters** listed in Takara Tomy's
official character catalog on 15 November 2026, plus **Yuka** from the anime.
Each file is named after its character, for example `Airun.png` or `Jewerun.png`.
Names use official English spellings where verified, otherwise romanized Japanese
names; these romanizations are not confirmed English localizations.

The catalog includes baby and child stages, Puni Plus, Punitomo Tsushin,
Punistal, and Punistal Premium characters. Repeated appearances and color variants
are consolidated. Minirun's three figures and Ranrun's twins remain together.
This is complete for that catalog, not every anime guest, color variation, or
Sanrio crossover character.

## Artwork and provenance

- 10 PNGs are unmodified official standalone illustrations from the anime sites.
- 43 PNGs are AI-assisted background extractions using the official character
  cards as edit references. They are derived artwork, not pixel-exact extractions.
- `references/` preserves all 52 original downloaded cards with Japanese labels.
  These reference cards retain their backgrounds; use the root PNGs in the app.
- `manifest.json` records character names, stages, editions, source pages, direct
  image URLs, dimensions, hashes, and which images are derived cutouts.
- The prompt set is recorded in
  `docs/assets/2026-11-15-punirunes-cutouts.json`.

Original characters/artwork: TOMY and the respective anime production partners.
Source attribution does not establish a separate reuse license.

## Sources

- [Takara Tomy character catalog](https://www.takaratomy.co.jp/products/punirunes/character/)
- [Current anime characters](https://www.tv-tokyo.co.jp/anime/punirunes/chara/)
- [Season 2 characters](https://www.tv-tokyo.co.jp/anime/punirunes2/chara/)
- [Season 3 characters](https://www.tv-tokyo.co.jp/anime/punirunes3_kachikochi/chara/)
- [Official English season 3 release](https://cdn.takaratomy.co.jp/english/product_release/pdf/p250530_en.pdf)
- [Spin Master's English character guide](https://downloads.ctfassets.net/r3qu44etwf9a/EdWUn7bXzUYD2VjCM4i5x/784e309b33a3d1dae990bfaa031212ae/F24_Punirunes_Character_Guide_for_Website.pdf)

## Who am I? lore

Reviewed on 15 November 2026. `src/data/puniruneLore.ts` records three
short English clue paraphrases per character, each with its exact official
source URL. All 52 Japanese reference cards were read visually; TV Tokyo's
character profiles and episode overviews provide additional anime lore.
Episode-based hints record both season and episode number. The episode index
was checked across seasons 1-4, with aired season 4 episodes through episode 7.
The English PDF was not used for these lore clues.

Every character has exactly four cards, in the same order: ABOUT ME (personality
or identity), LIKES (interests, wishes or activities), SPECIAL (skills, story
events or growth), and LOOKS (the only physical-description card).
These are internal categories only; cards display no titles.
Where individual lore is sparse, verified growth stages and shared Punirune
traits fill the categories. Shared facts carry `scope: 'shared'`; they are not
presented as unique powers. One-off episode events remain past-tense events.
Powers retain their
conditions, such as Sushirun transforming when happy and Sanrun glowing when
having fun. The final portrait stays hidden in hard and hidden two-player rounds.
Munyarun's card only describes a sleepy appearance, so its earlier cards use its
verified adult stage and shared traits. Appearance stays on the LOOKS card.

Useful episode sources include Pikarun's classroom (S1E17), Ranrun's contrasting
temperaments (S1E23), Kapurun the pastry chef (S2E17) and forest shop (S3E22),
Gaorun's squishy roar (S3E18), Otorun's festival invitation (S4E4), and Ururun's
school plans (S4E3). No outcomes are inferred from cliffhanger summaries.

The variety pass also uses Enjerun chasing Toggyrun (S2E10), Hikarun's
friendship with Tomorun (S2E6), Komugi's jealousy of Nyarurun (S2E11),
Fearun appearing during the crystal hunt (S3E21), Ururun teaching drawing
(S4E5), and Tomorun searching for Yunirun in the forest (S2E23).
The internal LIKES category includes friendships and activities as well as
preferences; an episode activity is not claimed to be a favourite pastime.
Shared care and mealtime clues reduce repetition where biographies are short.
The feeding/cooking example in S1E2 supports mealtime care, without inventing
a favourite food or claiming that it distinguishes one character from another.

### Custom hint illustrations

`hints/` contains original, AI-generated object-and-scene illustrations for
selected distinctive clues. They are interpretive game art, not official
screenshots. No character faces or silhouettes are used in these hint pictures,
so they can remain visible in hard mode and while the two-player answer is hidden.
The LOOKS portrait alone follows the answer-reveal setting.
The built-in imagegen prompt set is saved in
`docs/assets/2026-11-15-punirunes-hints.json`.

`hints/generic/` replaces the remaining emoji clues with a matching pastel,
glossy jelly illustration set for feelings, growth, friendships, objects and
activities. Any little white jelly figures are anonymous visual metaphors,
not named Punirunes or new canon characters. These graphics are shared across
app themes. Internal legacy symbols select the artwork but are never rendered.
The hidden LOOKS card uses a neutral mystery illustration instead of a portrait.
Prompts and generation provenance are saved in
`docs/assets/2026-11-15-punirunes-generic-hints.json`.

Jewerun's dependable personality comes from the season 3 anime profile, matching
the saved anime portrait. The newer toy card describes a soft jewel, while that
anime profile describes a hard one; the game does not combine those details.
Japanese idioms are simplified for children (for example, Chokorun's prickly
exterior and sweet side). Unspecified foods, powers, and backstories are not
inferred from a character's design.

`python scripts/download-punirunes.py` refreshes missing official downloads with
Python and Pillow. It preserves existing final PNGs and their cutout metadata;
AI-assisted cutouts are not regenerated by that script.
