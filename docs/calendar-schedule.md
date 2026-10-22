# Calendar schedule

`src/data/calendarSchedule.json` is the versioned, offline default schedule shared by the calendar's day agenda and the clock activity picture. School starts at 08:30 every weekday (the supplied Wednesday `8.80` was interpreted as `8.30`). Monday, Tuesday and Thursday finish at 14:45, Wednesday at 12:15, and Friday at 12:00. Lessons use afternoon times except Saturday ballet at 10:45.

The existing breakfast, teeth, play, cooking, dinner, games, bath and bedtime routine is retained. The school journey now ends at 08:30. The existing 30-minute journey home follows each weekday's actual school finish. School and these journeys are omitted on weekends and dates marked as non-school days by the existing holiday service/cache. Lessons repeat during holidays too; no term-only rule was specified for them.

## Classroom activities (29 September 2026)

The supplied “Onze dag op school / Our day at school” poster now supplies the classroom sequence. The three bundled school blocks opt in with `schoolDayPlan: "classroom"`. The agenda and Time Explorer clock expand those blocks into Table work, Circle time, Play outside, Fruit snack, Choice time, and Play outside. Full days then continue with Lunch, Circle time, and Choice time. Going home has its own artwork and retains the existing 30-minute journey.

School starts at 08:30. Activity boundaries fall on :00, :15, :30 or :45, with time divided as evenly as quarter-hour slots allow. Full days and Wednesday use morning end times of 09:15, 09:45, 10:30, 11:00, 11:45 and 12:15 (alternating 45 and 30 minutes). Friday uses 09:00, 09:45, 10:15, 10:45, 11:30 and 12:00. Wednesday and Friday leave before the lunch activity. On full days, Lunch runs 12:15–13:00, Circle time 13:00–14:00, and Choice time 14:00–14:45, followed by Going home. Repeated activities remain separate agenda entries but share their matching artwork. Explicit lesson times and fixed school endpoints remain authoritative.

School-feed early finishes apply before this division, so all six morning activities fit the shortened day and the journey home moves with dismissal. School closures omit the entire school routine. Recurring lessons still take precedence over classroom activities. Saved schedules without `schoolDayPlan` retain their original generic school blocks; the schema remains version 1 and no saved override is overwritten.

Fourteen new transparent images (seven activities in each theme) live in `src/assets/themes/{princess,teenie}/agenda/`. The built-in image generator used existing character portraits as identity references. Exact prompts and output paths are in [school-day-artwork.json](assets/school-day-artwork.json). These are app-specific school scenes; character matches do not imply canonical school attendance or favorite foods.

| Activity     | Teenieping selection                                                                 | Reason                                          |
| ------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Table work   | [Artping](https://catchteenieping.fandom.com/wiki/Artping)                           | Drawing and painting                            |
| Circle time  | [Dadaping](https://catchteenieping.fandom.com/wiki/Dadaping), Heartsping and Toyping | Dadaping shares a book with friends             |
| Play outside | [Hopping](https://catchteenieping.fandom.com/wiki/Hopping)                           | Canonical skipping rope and hopping             |
| Fruit snack  | [Tangyping](https://catchteenieping.fandom.com/wiki/Tangyping)                       | Refreshment and fruit-inspired appearance       |
| Choice time  | [Toyping](https://catchteenieping.fandom.com/wiki/Toyping) and Artping               | Choice between toys and drawing                 |
| Lunch        | [Yumyumping](https://catchteenieping.fandom.com/wiki/Yumyumping)                     | Food and eating                                 |
| Going home   | Heartsping and Dadaping                                                              | Familiar friends with backpacks, waving goodbye |

Character choices were checked against local profiles and the linked fan-wiki search excerpts on 29 September 2026. Yumyumping (hunger) is distinct from Yummyping (cooking).

Validation for this update: 29 focused tests pass across the schedule, calendar, theatre, school-calendar data and Time Explorer suites. Changed TypeScript files pass ESLint, formatting checks pass, and the production build succeeds with the existing large-chunk warning. Browser review covered 12 combinations of full/Wednesday/Friday schedules, both themes and 390px/1280px widths, plus four clock-image checks for short-day departure and full-day lunch. All images loaded without page errors or horizontal overflow. Each new WebP is 512 × 512 with transparent alpha; screenshots are in the ignored `output/school-day-review/` directory.

## Storage contract for a future editor

The root has `version: 1` and an `events` array. Each event has a stable `id`, display `title`, semantic `activity` artwork key, `kind` (`routine`, `school`, or `activity`), `start`/`end` as zero-padded local wall-clock `HH:mm`, `weekdays` (0 = Sunday through 6 = Saturday), and `schoolDaysOnly`. End may be `24:00`; start may not. Overnight events must be split at midnight. Intervals include their start and exclude their end.

`calendarScheduleSchema` in `src/lib/calendarSchedule.ts` validates JSON, including IDs, weekdays, artwork keys and time ranges. `saveCalendarSchedule` writes a validated override to localStorage key `msq.calendarSchedule.v1` and announces the change to mounted consumers. The hook also listens for changes in other tabs. Saves throw on validation or storage failure so an editor can report failures. Defaults are bundled rather than eagerly copied into localStorage, allowing later default updates to take effect until a user saves an override. Invalid or unsupported stored versions fall back to bundled defaults without overwriting the original data. A valid empty events array is an intentionally empty schedule.

Storage is currently browser/device-wide, with no per-child or cloud sync. The editor can consume this schema and persistence boundary later. No editor UI has been added.

`getAgendaForDate` filters recurrence and holidays and resolves overlaps: lessons take precedence over school, and school over routines. Ties prefer the later JSON entry. Adjacent segments from the same event merge; free play is split around lessons. Both consumers use that resolved timeline. Missing custom-schedule intervals show no clock activity picture rather than inventing events.

## Artwork

Princess routine pictures reuse the existing princess illustrations. New princess ballet, swimming, judo and piano pictures live in `src/assets/themes/princess/agenda/`. Teenie uses the existing Balletping dance portrait, with new Mightyping judo, Doremiping piano and Splashping swimming pictures in `src/assets/themes/teenie/agenda/`.

Character choices follow the local profiles and research: [Mightyping](https://catchteenieping.fandom.com/wiki/Mightyping) represents strength, [Doremiping](https://catchteenieping.fandom.com/wiki/Doremiping) music, and [Splashping](https://catchteenieping.fandom.com/wiki/Splashping) swims in mermaid form. Judo and piano poses are app-specific adaptations, not claims about their canonical hobbies. The Splashping identity reference was retrieved from [this image](https://i.pinimg.com/originals/69/c9/1b/69c91bdc13ca2e6e4ba9bcd215cd21a0.png) and saved in `docs/assets/calendar-references/splashping.png`.

The built-in image generator produced seven new illustrations. Exact prompts, reference paths, original masters and final asset paths are in `docs/assets/calendar-agenda-artwork.json`. Production WebP exports fit within 512 × 512 pixels; generated alpha is preserved. No local background removal was used.

## Verification

37 focused tests passed across the schedule/storage, school calendar data, rendered calendar, clock timer, and Time Explorer weather suites. Changed TypeScript files pass ESLint and the production build succeeds. Browser review checked all four lesson images in both themes at 390px phone width and the calendar at 1280px desktop width, with no horizontal overflow or page errors. The full Time Explorer page also scrolls through bedtime and updates the clock picture when the selected date changes. Review screenshots are in the ignored `output/calendar-review/` directory.

## Completed activities and rewards (22 October 2026)

The calendar now shows the active child's history alongside the selected day's plans. Day cells mark completed chores, completed tests, and granted rewards with the existing theme artwork. The history controls switch between all activity for a day, completed chores and tests (together or separately) for a day/week/month, and rewards for a day/month/year. Weeks run Monday through Sunday. Period arrows and the calendar day cells share the selected date. Filtered views hide scheduled agenda items, group history by day, and show artwork with numeric completion/grant counts and signed star totals. History has no visible prose or multiword labels: dates are numeric, period controls use calendar pictograms, and activity rows show the clock, artwork and stars. Full names and descriptions remain in accessible labels.

History reads immutable `starEvents` and `redemptions`, scoped to the active child. New records retain the title and artwork key so deleting or renaming a definition does not rewrite past entries. Task records retain their completion date key; reward days and displayed times use the child's timezone and the original offline occurrence time when available. Older records fall back to their current definition or a generic label; details that were never recorded cannot be recovered.

The offline store caches history separately from editable definitions, includes queued completions and rewards with a waiting-to-sync label, and reconciles authoritative receipts and snapshots by operation ID. Shared-parent receipts contain the server's title and award values. Revoking access clears cached history. Preparing a legacy child for sharing also copies its existing audit records. Shared calendars also read the child-scoped legacy audit records, so children who were already shared retain their earlier history. Migrated and legacy entries use matching IDs to avoid duplicate counts. The shared-history changes require deploying the updated Cloud Functions and Firestore rules with the client.

Checks cover timezone boundaries, Monday-first weeks spanning years, leap dates, zero-star completions, deleted definitions, child switching, offline acknowledgement/restart, and shared-parent deduplication. The browser fixture in `tests/fixtures/calendar-history.html` exercises both themes at 320px phone width using `tests/e2e/calendar-history.spec.ts`.

## Shared calendar controls and weekday meanings (22 October 2026)

One read-only date display and one previous/next pair above the calendar grid now show and navigate the selected date. The calendar grid itself is the only day picker. The single period selector chooses the arrow step and history range: day/week/month for activity and completions, day/month/year for rewards. Switching back from rewards remembers the activity period. Calendar cells and the read-only date display use the same selected date; month/year steps clamp to valid dates. The repeated month heading and separate history navigation/range heading have been removed. Scheduled details still belong to the selected day.

Weekday headers retain short, single-word labels beneath artwork. The Teenie theme reuses seven existing character portraits, with small meaning badges. The Princess theme uses the same seven pastel SVG symbols at full size. No new characters are invented and no character portraits are altered.

The English weekday origins follow the [Viking Ship Museum's weekday guide](https://www.vikingeskibsmuseet.dk/en/professions/education/viking-age-people/the-names-of-the-weekdays). These character pairings are visual mnemonics, not canonical deity identities:

| Day       | Origin / symbol         | Existing Teenieping                                                | Visual connection                                                                            |
| --------- | ----------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Monday    | Moon                    | [Twinkleping](https://catchteenieping.fandom.com/wiki/Twinkleping) | Crescent-moon hat and magic                                                                  |
| Tuesday   | Tyr / courage shield    | [Gogoping](https://catchteenieping.fandom.com/wiki/Gogoping)       | Courage                                                                                      |
| Wednesday | Odin / knowledge book   | [Dadaping](https://catchteenieping.fandom.com/wiki/Dadaping)       | Reading, teaching and knowledge; a wisdom association, not a claim that Dadaping is a father |
| Thursday  | Thor / lightning hammer | [Giggleping](https://catchteenieping.fandom.com/wiki/Giggleping)   | Canonical hammer fires lightning                                                             |
| Friday    | Frigg / heart           | [Heartsping](https://catchteenieping.fandom.com/wiki/Heartsping)   | Love                                                                                         |
| Saturday  | Saturn / ringed planet  | [Hulaping](https://catchteenieping.fandom.com/wiki/Hulaping)       | Ringed hair buns and hula hoop                                                               |
| Sunday    | Sun                     | [Happying](https://catchteenieping.fandom.com/wiki/Happying)       | Sun-shaped hair and sunshine                                                                 |

Character details were checked against the existing local profile catalog and fan-wiki results on 22 October 2026. The seven small vector symbols are authored in `src/assets/calendar/`; portraits remain in `src/assets/teenie/`. Accessible descriptions retain weekday names, origins and character associations without adding explanatory prose to the visible calendar.

Period controls now use four matching SVG calendar pictograms (`period-day/week/month/year.svg`): one day, a seven-day row, a month grid, and twelve month tiles. Numerals reinforce the pictures; Day/Week/Month/Year remain accessible names only. Both themes use the existing segmented image-control selection treatment.

### Integrated weekday lettering

Weekday abbreviations now live inside the artwork itself. Seven new transparent Teenieping portraits show the character holding a plaque marked Mon, Tue, Wed, Thu, Fri, Sat or Sun, with the meaning ornament integrated into the illustration. Princess icons use the existing native vector symbols above a matching labelled plaque. CalendarWeekdays renders one image per day, without separate captions or overlaid badges; full weekday descriptions remain accessible.

Final assets live in `src/assets/calendar/weekdays/`. The built-in image generator produced the Teenie artwork; exact prompts and reference identities are recorded in `docs/assets/calendar-weekday-artwork.json`. PNG masters are retained in `output/calendar-weekdays/raw/`. WebP encoding preserves the original dimensions and every alpha value; no background removal or lettering overlays were used. Princess SVGs were edited directly as native vector artwork.
