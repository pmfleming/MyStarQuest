# Test reduction — 3 October 2026

## Result

**138 → 92 cases: 46 fewer, a 33.33% reduction.** The requested 67% target is 92.46 cases; 92 is the nearest whole number. Counts use runner-expanded cases, including each configured browser, matching the previous reduction reports.

| Runner                                            | Starting count | Final count |
| ------------------------------------------------- | -------------: | ----------: |
| Vitest                                            |            117 |          77 |
| Development Playwright: Chromium, Firefox, WebKit |             12 |           6 |
| Production offline Playwright                     |              2 |           2 |
| Node quality checks                               |              2 |           2 |
| Android JVM                                       |              3 |           3 |
| Android device                                    |              2 |           2 |
| **Total**                                         |        **138** |      **92** |

The baseline includes the existing uncommitted work. It comes from a fresh passing Vitest execution, Playwright discovery, Node tests and Android test declarations. Vitest's discovery output listed 103 declarations; the actual runner expanded parameterized cases to 117, which is the number used here. Production code, runner configurations, dependencies and browser projects were preserved. Tests were removed or consolidated, with no new skips, exclusions or disabled projects.

## Removed repetition and constraints

- **Fractions:** keep minimum/maximum generator boundaries, distinct answer choices, exactly one correct value, and reduced answers. Remove six intermediate maximum cases, four repeated simplification examples and the backward-compatibility assertion fixing the former level-three question sequence. The component suite retains limit persistence, reset cancellation, wrong-answer feedback, automatic hints, simplification and duplicate-completion protection. The full completion/phone-layout browser journey remains in all three browsers; a second simplification browser matrix was removed because the component and generator tests retain that behavior.
- **Calendar:** remove the three exact weekday poster-order cases. Keep early dismissal, contiguous agenda boundaries, interrupted lessons, weekends and school holidays. Validate rejected edits through the actual save boundary. The theatre/feed-replacement regression remains separate.
- **Action buttons:** remove synthetic callback-invocation counts and repeated shared-button fixtures. Real child deletion covers confirmation, cancellation, focus, failure and retry. The actual rewards page covers selected-child and balance requirements, pending-click suppression, failure and retry.
- **Concurrent activities:** retain the full native-frame activity-retention scenario and web Reset Today scenario. Remove the second copy of the full retention scenario that exercises the same shared activity controller in the web frame. Separate navigation, date/child isolation, duplicate activity types and queued-result reset regressions remain.

## Contracts retained in existing journeys

| Former separate checks                                                            | Remaining location and behavior                                                                                                                                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reward availability; shared deletion failure                                      | `RewardsPage.test.tsx`; `ManageChildrenPage.test.tsx`                                                                                                                                              |
| Expandable agenda keyboard controls; saved schedule updates; invalid editor input | `SchoolCalendar.test.tsx`: keyboard expansion/dismissal, rejected save, same-window save and cross-window update                                                                                   |
| Learning-navigation fixture                                                       | `TrainingPhotos.test.tsx`: keyboard browsing, unavailable letters, selection and focus restoration through `AnimalTester`; photo failure/retry retained                                            |
| StrictMode dialog replay                                                          | `AppMenu.test.tsx`: queued native close events, close/reopen, failed reset and retry                                                                                                               |
| Failed or zero-award celebrations                                                 | `TaskCelebration.test.tsx`: failed/no-op saves followed by one saved award, including duplicate calls while pending                                                                                |
| Stale-child offline completion; one-time reward consumption                       | `androidOffline.test.tsx`: rejection before a valid chore lifecycle; reward redemption, refreshed definition and child switching                                                                   |
| Pending action already included in a server snapshot                              | `offlineStore.test.ts`: day rollover followed by acknowledgement without double projection                                                                                                         |
| Old completion changing shared tasks                                              | `offlineSync.test.ts`: multi-device delivery/replay preserves the shared definition and date-specific activity records                                                                             |
| Built-in test creation                                                            | `starActions.test.ts`: initial creation, duplicate delivery, same-day reset and next-day completion                                                                                                |
| Exact clock instant across midnight; blocked storage; stalled geolocation         | `TimeExplorerReset.test.tsx`: session restore, city changes, read/write failure and late-location handling                                                                                         |
| Topology rejection; non-finite balances/costs                                     | Existing decoder and stored-document contract tests                                                                                                                                                |
| Overlapping/zero-duration calendar events                                         | Recurrence/DST feed test, retaining deduplication and prototype-name regression assertions                                                                                                         |
| Stale weather failure/retry                                                       | Weather subscription journey after cancellation and city isolation                                                                                                                                 |
| Offline worker cache/fetch routing                                                | Failed deployment followed by valid installation, offline serving and auth/API/mutation bypass                                                                                                     |
| Separate multi-tab persistence and lost-response browser setups                   | One browser journey queues concurrent credit/debit actions, reloads both tabs, checks IDs/sequences, loses the first acknowledgement, then verifies exact balance and durability after sync/reload |

Authentication, atomic disk failures, transaction conflicts, reset rollback, failed lazy imports, renderer/worker recovery, queued completion cancellation and production offline recovery tests remain.

## Validation and evidence

- Vitest: 77 passing; development Playwright: 6 passing across all three browsers; production offline Playwright: 2 passing; Node: 2 passing.
- Android device: 2 passing on connected `RF8M92YP5XX`. Gradle accepted the unchanged JVM task as up to date; its existing report records 3 passing cases.
- ESLint, TypeScript and production build passed. The build still reports its existing large-chunk warning.
- SHA-256 comparison verified 1,980 production/configuration files against the starting snapshot, with no changes.

[Machine-readable counts and source-line comparison](2026-10-03-test-reduction.json) include per-file changes. Local raw evidence and the pre-edit source archive are under `output/test-reduction-2026-10-03/`.

This is a review of behavioral coverage, not a claim of identical instrumented branch coverage. Consolidated journeys share setup and stop at their first failing assertion, so failure isolation is coarser. Intermediate fraction settings, exact curriculum order, decorative artwork details and the duplicate web-frame retention run have less direct coverage by design.
