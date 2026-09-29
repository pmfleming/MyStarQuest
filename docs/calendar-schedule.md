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
