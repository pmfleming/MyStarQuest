# Theatre calendar

The 21 activities from the two user-supplied Amstelveens Poppentheater anniversary flyers are bundled in `src/data/calendar/theatre-2026.json`. They run from 27 September to 27 December 2026; the printed weekdays match 2026. Performance titles and company names retain their original Dutch spelling, including the labels in the month grid and activity cards.

The calendar marks dates with a custom activity illustration and lists each performance under the selected day, using the existing illustrated agenda cards and start-time clocks. Cards show age and price; expanding them reveals the performer and venue details. All times are local to Europe/Amsterdam: Discodip, Ro(c)k and Kiekeboe start at 10:30; the remaining 18 activities start at 14:30. The flyers provide no finishing times, so entries show one start clock and do not replace the child's routine with an invented duration.

All performances cost €10 except Alle dagen feest, which is free or a €10 donation and takes place at Openluchttheater Elsrijk. No street address is supplied for that outdoor venue. Other performances use the printed address: Wolfert van Borsselenweg 85a, 1181 PH Amstelveen.

These are fixed-date activities, available offline and independent of the school feed, its cache and weekly schedule overrides. School-feed refreshes cannot remove them or turn them into school closures. The source website is retained in the programme data; adding the activities does not make reservations.

## Artwork

21 simple transparent storybook illustrations are shared by both themes in `src/assets/calendar/theatre/`. Each performance has a distinct subject drawn from its flyer description. The built-in image generator produced these assets; `docs/assets/theatre-events-artwork.json` records the prompts, original generated files and final WebP exports. Generated transparency is retained during resizing; no background removal is used.

## Verification

19 focused calendar tests pass, along with ESLint, formatting and the production build. Browser review covered all 20 event dates in both themes at 390px and 1280px (80 combinations), including expanded details. No page errors, missing images, clipped expanded details or horizontal overflow were found. All 21 exported images preserve transparency and fit within 512 × 512 pixels, totaling 980,718 bytes. Local review screenshots are in the ignored output/theatre-review directory.
