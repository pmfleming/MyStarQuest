# Teenie Friends theme plan

Prepared and implemented 7 September 2026. The original brief below is retained; delivery and validation are recorded here.

## Implemented result

Teenie Friends is a selectable, persistent child theme with its own lilac/mint palette, Nunito typography, and a typed semantic asset registry. Chores, meals, rewards, navigation, quiz feedback, difficulty counters, hydration/toilet states, calendar and Time Explorer resolve the selected theme's artwork. Saved chore IDs, including `bravePrincess`, remain compatible. Princess remains selectable, and animal/insect factual content and quiz collection selection are unchanged.

Delivered 27 character scenes, 67 animal/insect ability illustrations, 16 seasonal landscapes and 16 SVG controls. Existing Heartsping and gift assets are reused by URL. All 94 character/ability raster exports have genuine alpha; scenery is deliberately opaque. Forty-six ability masters required local checkerboard removal, explicitly authorized by the user. See [artwork provenance and reproduction](../assets/teenie-theme-artwork.md).

Validation completed:

- `npm test`: 46 files, 193 tests passed, including theme switching/persistence, all semantic roles, saved keys, 67 ability mappings, and existing component regressions.
- Production TypeScript/Vite build passed; changed TypeScript/TSX files passed ESLint, and `git diff --check` passed. Vite retains its warning about chunks above 500 kB.
- Exporter accepted all 110 raster assets with zero rejected opaque masters, checked clear and opaque alpha endpoints, and verified exact resized-alpha preservation in WebP. All exported illustrations and landscapes were reviewed on contact sheets; locally corrected art was also checked on light backgrounds.
- Browser review used real app components at 320/390-pixel phone widths and 900 pixels: chore cards, create flow, all hydration levels, toilet states, calendar, Time Explorer, asset gallery and Princess switching. Checked image loading and horizontal overflow. A provider-level regression verifies switching between differently themed children and restoring the saved choice after remount.
- The previous web build was 171,749,838 bytes (163.8 MiB). The completed build is approximately 168.8 MiB, an increase of about 5.0 MiB. No current enforced 95 MiB package budget was found in scripts, tests or CI. No Android package or deployment was requested.

Add a fully populated `teenie` theme, displayed as **Teenie Friends**, using the existing Teenieping characters and castles. Selecting it for a child should change the artwork throughout chores, tests, rewards, profile controls, and Time Explorer. Princess remains a separate selectable theme.

## Existing material and implications

| Material inspected                             |                                                      Available | Planned use                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------: | --------------------------------------------------------------------------------------------------- |
| `src/assets/teenie/*.webp`                     |                                                   84 portraits | Character identity references; reuse suitable portraits for theme/profile decoration                |
| `src/assets/teenie/{looks,prop,theme,magic}`   |                             336 illustrations, 84 per category | Reuse clear objects and symbols where their meaning matches the UI                                  |
| `src/assets/teenie/castles`                    |                                      6 transparent castle PNGs | Scenery references and home decoration; create optimized derivatives only when consumed             |
| `src/assets/themes/princess`                   | Controls, chore scenes, activities, outcomes, seasonal artwork | Inventory of the visual roles the new theme must cover                                              |
| `src/assets/animal-abilities-generic/princess` |                                       52 ability illustrations | Replace the princess-bear alternatives for Teenie users                                             |
| `src/assets/insects/generic`                   |                            15 additional ability illustrations | Include these too: the inspected hover image and content notes identify the princess-bear treatment |

The folder named `teenie/theme` contains character-theme quiz clues, not an application theme implementation. Preserve its meaning and paths. Put new application artwork in `src/assets/themes/teenie/`.

Princess is currently the only theme with activity and seasonal background images in `ThemeContext`. Many other images bypass theme selection entirely: bottom navigation, chore choices, reward controls, calendar symbols, quiz feedback, and difficulty counters. Adding a palette and selector entry alone will leave princess artwork visible.

The insect ability resolver also prefers `insects/generic` before checking the selected theme, and the animal generic resolver falls back to princess. Both need explicit Teenie coverage.

## Visual direction

Use the rounded, softly glossy 3D style of the existing portraits and castles: large expressive eyes, pastel materials, clean silhouettes, restrained gold details, and soft lighting. New character scenes should retain each reference character's face, hairstyle, proportions, and signature accessories.

Proposed palette: pale lilac background `#F5F0FF`, white surfaces, deep plum text `#3C2856`, violet primary `#7751C9`, teal secondary `#287F7A`, and light mint accent `#BDEBE0`. Reserve rose and warm yellow for illustrations and celebration. Check actual text/button combinations before finalizing the tokens; pale accents are decorative, not text colors.

Use the already bundled Nunito for readable, rounded headings and body text. Keep existing control sizes and interaction patterns. Use stars, hearts, and small sparkles for celebration, with the same star currency and learning rules.

Use Heartsping (`heart.webp`) as the main welcome and encouragement character, with a small recurring supporting cast. The following task assignments are proposed app art direction, not new claims about character powers.

| Role             | Character reference | New composition                                                                    |
| ---------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Tidying          | `tidy.webp`         | Tidyping placing a toy into a tidy basket                                          |
| Writing          | `art.webp`          | Artping writing with a pencil in a notebook; the action must read as writing       |
| Being brave      | `mighty.webp`       | Mightyping standing confidently with a small star shield                           |
| Getting dressed  | `hurry.webp`        | Hurryping fully dressed, pulling a cardigan sleeve into place, with a small clock  |
| Dinner           | `yumyum.webp`       | Yumyumping taking a bite of vegetables at a compact table                          |
| Water and toilet | `scrub.webp`        | Scrubping with a blue water bottle and a small toilet beside them                  |
| Bedtime          | `sleep.webp`        | Sleeping tucked into a small bed                                                   |
| Playing          | `toy.webp`          | Toyping actively playing with blocks                                               |
| Rewards          | `gift.webp`         | Giftping presenting a reward; reuse the existing separate gift prop where suitable |

## Artwork to produce

Create a manifest before generation. For each semantic role, record its current princess asset/consumer, reuse decision, reference paths, prompt, intended dimensions, output path, and visual-review status. Count unique outputs rather than generating the same picture separately for every screen.

| Set                                    | Deliverables                                                                                                                                                                      | Treatment                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Main chore scenes                      | Six scenes listed above                                                                                                                                                           | Six custom illustrations, matching the readable close framing of the current chore cards                                    |
| Daily activities                       | Bedtime, breakfast, commute, schooltime, playing, dinner, computer games, bathing, cooking, teeth brushing                                                                        | Ten roles; reuse the new dinner scene if it fits, giving nine additional images                                             |
| Lunch                                  | Lunch action image                                                                                                                                                                | One additional scene for the dashboard's time-dependent meal icon                                                           |
| Eating and hydration                   | Empty plate; eating complete/incomplete; full, two-thirds and one-third bottles; drink success; toilet pending/done                                                               | Nine images; preserve the existing use of drink-success art for the empty-water state                                       |
| Quiz feedback                          | Correct and try again                                                                                                                                                             | Two supportive character scenes with clearly different expressions/poses                                                    |
| Calendar                               | School day and four seasonal non-school days                                                                                                                                      | Five compact illustrations; reuse the activity school scene if its crop remains clear                                       |
| Time Explorer scenery                  | Spring, summer, autumn, winter × sunrise, daytime, sunset, night                                                                                                                  | Sixteen coordinated backgrounds derived from the castle visual language                                                     |
| Animal and insect ability alternatives | 52 shared abilities and 15 insect-specific abilities                                                                                                                              | Up to 67 custom action illustrations, with one-to-one semantic coverage and reuse only after checking the action            |
| Navigation and controls                | Chores, tests, rewards, calendar, clock, thermometer, children, exit, edit, delete, reset, save, active/select, buy/locked reward, give-star, counter/difficulty, theme thumbnail | Reuse fitting portraits/props; draw simple controls as coordinated native SVG; generate new dimensional scenes where needed |

The scene/state/background rows represent about **115 illustration outputs before further reuse**, plus the navigation/control set. This is a full-theme planning allowance, not 115 guaranteed image-generation calls. The 67 ability alternatives are the largest portion. Existing clue art can reduce the count only when it actually demonstrates the required action; a themed symbol or portrait is insufficient.

Do not recreate unused legacy files merely because they exist in the princess directory. Verify runtime consumers for duplicates such as PNG/WebP toilet variants, old exit images, `flask-empty.svg`, and legacy backgrounds. All active visual roles need coverage.

For the ability set, show a Teenie character demonstrating the ability with an appropriate prop or magical analogy. Preserve teaching clarity for unusual actions such as trunk, silk, shell, camouflage, and carrying spiderlings. These are illustrative analogies, not changes to animal facts or the Teenieping knowledge catalog. Keep actual animal/insect portraits and factual clue artwork.

### Production requirements

1. Generate three representative pilot assets first: Tidyping tidying, Yumyumping eating, and a spring daytime castle background. Inspect them beside the existing portraits and in the actual UI before using their prompts as the batch standard. This is a quality checkpoint, not a mandatory user approval pause.
2. Use the built-in image-generation tool for custom raster artwork, one requested asset per call. Inspect local reference images before passing them as references. Use the matching Teenie portrait for identity and princess artwork only for the role/framing where helpful; explicitly specify the Teenie rendering style.
3. Generate square transparent character scenes, preferably with 1024-pixel masters. Export chore images at 768 × 768 to match the recent princess work, and smaller control/clue derivatives appropriate to their rendered size. Preserve true generated alpha; inspect pale and dark backgrounds for fringes, clipped accessories, or painted checkerboards.
4. Make the plate a true top-down circle with a clean center and transparent exterior. The app draws portions, so the illustration must not include wedges or division lines. Keep bottle silhouette, framing, and liquid scale consistent across levels.
5. Keep incomplete/try-again scenes encouraging and visually distinct from success. Use clothed characters and simple bathroom props for toilet states; clarity comes from the state presentation and accompanying label.
6. Build seasonal backgrounds from one consistent castle scene and camera. Vary season and light while retaining landmarks. Measure the current rendered crop and aspect ratio before generating. Keep space for clock/activity overlays and avoid baking in clocks, labels, or sun/moon elements already drawn by the UI.
7. Save accepted production files into the repository, with prompts and an output/review manifest in `docs/assets/teenie-theme-*`. Retain raw masters outside production imports. Inspect each final export at its actual display size.

Pilot chore prompt template:

> Use case: stylized-concept. Asset type: transparent chore-card illustration for MyStarQuest. Use the supplied Teenie portrait as the character identity and rendering reference. Show [character] clearly [action], with [essential props]. Preserve the reference face, hair, body proportions, and distinctive accessories. Rounded glossy 3D materials, soft lighting, crisp silhouette. Close framing with the action and all essential props visible, matching the visual weight of the existing chore card. Genuine transparent background. No text, watermark, painted checkerboard, or unrelated scenery. Square composition, requested 1024 × 1024 master.

## Application changes

1. **Create a semantic theme asset registry.** Add a typed contract such as `ThemeAssets` with navigation, controls, chore choices/overviews, meals, water/toilet states, quiz feedback, calendar, activities, and backgrounds. Wrap the existing princess mappings first. Require complete assets for princess and teenie; preserve explicit generic behavior for the other themes. Shared components resolve roles rather than importing a theme's files directly.
2. **Register the theme.** Extend `ThemeId`, theme metadata, `isThemeId`, and `ThemeContext`; add the Teenie Friends carousel option in `ManageChildrenPage`. Prefer one shared metadata list over the two current selector definitions. Reuse Nunito's existing font registration. Check child selection, persistence, reload, and switching between children with different themes. Existing child records need no bulk migration: their theme IDs are stored as strings.
3. **Preserve saved chore choices.** Make `getChoreImage` and chore image options theme-aware. Keep stored keys, including `bravePrincess`, compatible; resolve that legacy key to the Teenie bravery scene and show a theme-appropriate label such as “Being brave.” Change the presentation without rewriting saved chores or rewards.
4. **Replace hard-coded consumers.** Update the modules listed below, passing the active theme into resolvers. Replace princess-only gates such as `princessAsset` with semantic asset availability. Keep routing, task state, reset behavior, awards, and learning logic intact.
5. **Complete the learning artwork.** Add `src/assets/animal-abilities-generic/teenie/` for the 67 required role names, or an equivalent typed mapping. Update animal and insect resolvers so Teenie-specific assets win over princess defaults. Update “princess bear” labels and accessibility text where they describe the selected mascot. Do not force the Animals activity to switch its selected collection just because the app theme changes.
6. **Apply and package the visuals.** Wire palette and button styles, preserve focus/disabled/selected states, and load only needed image resources. Reuse URLs instead of copying the 84 portraits or 336 clue images. Compress new production derivatives and compare the output/Android package size against the existing build and any current size checks. Earlier content notes report a build near a 95 MiB budget; verify the current limit before accepting this larger art set. Lazy loading alone does not reduce packaged asset bytes.

| Area                           | Main integration points                                                                                                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme definition and selection | `src/ui/themeOptions.ts`, `src/contexts/ThemeContext.tsx`, `src/pages/ManageChildrenPage.tsx`, `src/data/useChildren.ts`, `src/contexts/ActiveChildContext.tsx`                                                                                            |
| Navigation and page loading    | `src/lib/tabNavigation.ts`, `src/components/ui/BottomNav.tsx`, `src/routes/AnimatedTabLayout.tsx`, `src/pages/TestsPage.tsx`                                                                                                                               |
| Chores and meal states         | `src/assets/chores/assets.ts`, `src/ui/choreOverviewAssets.ts`, `src/ui/taskTypeIcons.ts`, `src/ui/unifiedChore*.tsx`, `src/ui/unifiedChoreState.ts`, `src/ui/unifiedEatingRenderer.tsx`, `src/pages/DashboardPage.tsx`                                    |
| Controls, editing, rewards     | `src/ui/themeActionAssets.ts`, `src/ui/definitionRowDescriptors.tsx`, `src/pages/dashboardChoreUi.tsx`, `src/pages/ChoreCreationFlow.tsx`, `src/pages/RewardCreationFlow.tsx`, `src/components/ui/InlineChoiceList.tsx`, standard action styles/animations |
| Feedback and difficulty        | `src/components/ChoreOutcomeView.tsx`, Alphabet/Spelling/Arithmetic/Animal/LargeNumbers testers, `src/components/ui/PositionalNotationPlayArea.tsx`, `src/components/ui/CrownDifficultyControl.tsx`                                                        |
| Water and toilet               | `src/ui/waterToiletAssets.ts`, `src/components/WaterToiletMonitor.tsx`                                                                                                                                                                                     |
| Time and calendar              | `src/ui/seasonAssets.ts`, `src/pages/TimeExplorerPage.tsx`, `src/components/SchoolCalendar.tsx`, `src/components/ui/ScheduleDayTypeControl.tsx`, DayNightExplorer theme consumers                                                                          |
| Creature ability alternatives  | `src/data/genericAnimalAbilityAssets.ts`, `src/data/insectKnowledge.ts`, creature collection descriptors and mascot labels                                                                                                                                 |

## Delivery order and completion checks

1. Finish the role-to-asset manifest and three pilot images; establish export sizes and palette.
2. Introduce the registry around Princess and verify its existing behavior. Add Teenie registration and complete the dashboard/chore art as the first end-to-end slice.
3. Finish controls, reward/profile screens, eating/water states, quiz feedback, and daily activities.
4. Complete calendar/scenery and the 67 ability alternatives. Use the manifest to track remaining artwork; do not call the theme fully populated while these still inherit princess art.
5. Run the production build and relevant existing component tests, with targeted regression coverage for theme selection/persistence, saved chore keys, per-theme asset resolution, meal/water states, and creature ability coverage. Check changed-file lint and current packaging limits.
6. Visually inspect both themes at 320/390-pixel phone widths and a wider desktop viewport: every tab, loading icon, create/edit flow, reward state, success/incomplete state, all water levels, both toilet states, quiz/difficulty controls, and all 16 seasonal backgrounds. Switch between two differently themed children and reload to catch stale cached artwork.

Done means Teenie Friends is selectable and persistent, every active custom princess visual role has a deliberate Teenie replacement, no princess character/bear leaks into Teenie screens, all existing saved chore choices resolve, the original Princess theme still works, and production artwork passes visual and packaging checks. Review remaining `princess` references by role: valid Princess registry entries and legacy stored keys can remain.
