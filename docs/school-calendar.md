# School calendar

The live Parro feed provides dates and original event names. `functions/src/schoolEventCatalog.ts` is shared by the service and client: only recognised holidays and teacher training days close school. All-day activities remain school days, and noon finishes retain the morning. Unknown names display as **School Event** without assuming school closure. The original Dutch names remain internal; all calendar labels, image descriptions and month names display in English. Event labels contain at most two words.

The selected date lists every source event separately, with its illustration, activity/day-off status and Amsterdam-local times when available. The month grid shows an event illustration and the theme's standard royal symbol for additional entries: the Princess crown or Royal Teenieping emblem. Generic group and class-specific versions share the corresponding activity illustration. Dates with both a closure and a meeting retain both entries and remain days off.

The service retains event IDs, titles, all-day flags and start/end timestamps. Date expansion respects exclusive iCal ends across daylight-saving changes. The client also classifies older summary-only service responses, so the all-day bug is fixed before the updated function is deployed. These older responses cannot supply event times, so none are invented. The persistent snapshot migrates valid version 10 caches, including their event names.

## Offline calendar and background updates

`src/data/calendar/school-calendar.json` is the shared bundled fallback. The 21 September 2026 snapshot contains 144 dates from 6 July 2026 to 20 August 2027. It loads synchronously even on the first offline launch. Calendar artwork is packaged with the Android web assets. Run `npm run calendar:snapshot` before a release to refresh the seed from the service; the command validates the response before writing and refuses an empty seed. Gradle packages this same source file as an Android asset.

The app displays the newest saved or bundled copy immediately, then checks for updates without blocking the UI. Successful responses replace the full calendar, including changed or removed events, and are saved with their check timestamp in one storage operation. HTTP errors, malformed JSON, invalid event data and timeouts leave the last valid copy untouched. Saved data has no offline expiry. A failed foreground update shows **Saved calendar** and **Try again** while keeping the entries visible.

The shared web store starts after the first paint of a signed-in session, independently of the calendar screen. The Android background worker is scheduled at native application startup and does not depend on this deferred web initialization. It checks every six hours while visible and when the app becomes visible or regains connectivity; closely repeated resume checks are coalesced. Subscribers share requests and timers. Browser persistence uses `schoolCalendarSnapshot:v1` in localStorage.

Android additionally uses a unique six-hour [WorkManager job](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work) with a connected-network constraint. It runs outside the WebView lifecycle and retains its schedule across process exit and reboot. Android battery restrictions can delay execution; force-stopping the app prevents work until it is opened again. Downloads run off the UI thread with bounded network timeouts. A private SharedPreferences snapshot is committed only after native validation, with foreground and worker downloads serialized to prevent older requests overwriting newer ones. The Capacitor bridge sends updates to the open app and reads the saved native copy on resume.

Verification: 88 focused web tests and three native Java tests pass. Browser checks exercise first-launch fallback, reconnect changes and deletions, invalid-response fallback and persistence across reopening. The debug APK and Android instrumentation test APK build successfully. Device instrumentation was not run: the configured local emulator has no installed system image.

Early finishes cap the configured school blocks and move the journey home earlier when necessary; weekly lessons remain in place. The default Friday already ends at noon, so its school hours stay the same on the two reviewed early-finish dates. Meetings and other school notices are displayed separately from the child's routine, rather than replacing its timed activities.

## Artwork

44 transparent WebP illustrations live under `src/assets/themes/{princess,teenie}/school-events/`, each at most 512 × 512. Princess artwork uses the existing royal storybook style. Teenie characters are chosen using the repository's `src/data/teeniepingProfiles.json` profiles. The pictured actions are app-specific adaptations. Teacher training, all five seasonal breaks and the three named public holidays have distinct artwork in both the month grid and selected-day details. Christmas Break and Christmas Party use separate images. Generic unnamed holidays retain the seasonal day-off fallback.

| Display label    | Teenie character         | Match                         |
| ---------------- | ------------------------ | ----------------------------- |
| School Starts    | Bonnyping                | Confidence                    |
| Parent Meeting   | Dadaping                 | Book and careful explanations |
| Start Meeting    | Memoping                 | Organisation and diary        |
| School Trip      | Silkyping                | Adventure                     |
| School Photos    | Gogoping                 | Camera                        |
| Sibling Photos   | Chocoping and Heartsping | Caring and love               |
| Parent Welcome   | Okeydokeyping            | Peace and friendship          |
| Christmas Party  | Doremiping               | Music                         |
| School Reports   | Goodping                 | Stamp                         |
| King’s Games     | Mightyping               | Strength                      |
| School Party     | Happying                 | Happiness                     |
| Noon Finish      | Hurryping                | Pocket watch                  |
| Council Meeting  | Trueping                 | Honesty                       |
| Teacher Training | Dadaping                 | Book and learning             |
| Summer Break     | Tangyping                | Refreshment                   |
| Autumn Break     | Weeping                  | Leaf umbrella                 |
| Christmas Break  | Giftping                 | Presents                      |
| Spring Break     | Snowping                 | February ski holiday          |
| May Break        | Dewping                  | Flowers and spring picnic     |
| Good Friday      | Heartsping               | Love and a peaceful lily      |
| Easter Monday    | Artping                  | Painting Easter eggs          |
| Whit Monday      | Flitterping              | Wings and a white dove        |

`docs/assets/school-events-artwork.json` records the built-in image generator prompts, identity references, source masters and output paths. Alpha was preserved during WebP export; no local background removal was used. The superseded repeated-character drafts are not included in the application.

## Review scope

The initial review contained 33 entries. The subsequent live-feed snapshot on 21 September 2026 contained 38, adding five **MR vergadering** events; those now use **Council Meeting**. MR refers to the school's participation council ([Dutch government background](https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/kamerstukken/2023/07/06/eindrapport-breed-gesprek-governance-en-mede-zeggenschap-regioplan/eindrapport-breed-gesprek-governance-en-mede-zeggenschap-regioplan.pdf)). Good Friday follows the reviewed day-off classification; the feed does not provide a separate closure description.

Preview screenshots, artwork contact sheets and the live-feed review snapshot are local artifacts in the ignored `output/school-calendar-review/` directory. Changes require the normal frontend and calendar-function deployment to reach the hosted application.

Validation: 76 focused unit/component tests passed, including all reviewed source titles, English labels of at most two words, legacy cache compatibility, mixed events, holidays, early finishes and DST expansion. The latest browser review covered 36 combinations of nine day-off event types, both themes and 390px/1280px widths with no page errors, missing images or horizontal overflow. All 44 exports have transparent alpha and a maximum dimension of 512px. Changed TypeScript files pass ESLint; frontend and function builds pass (the frontend retains its existing large-chunk warning).
