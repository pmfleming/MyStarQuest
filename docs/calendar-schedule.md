# Calendar schedule

`src/data/calendarSchedule.json` is the versioned, offline default schedule shared by the calendar's day agenda and the clock activity picture. School starts at 08:30 every weekday (the supplied Wednesday `8.80` was interpreted as `8.30`). Monday, Tuesday and Thursday finish at 14:45, Wednesday at 12:15, and Friday at 12:00. Lessons use afternoon times except Saturday ballet at 10:45.

The existing breakfast, teeth, play, cooking, dinner, games, bath and bedtime routine is retained. The school journey now ends at 08:30. The existing 30-minute journey home follows each weekday's actual school finish. School and these journeys are omitted on weekends and dates marked as non-school days by the existing holiday service/cache. Lessons repeat during holidays too; no term-only rule was specified for them.

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
