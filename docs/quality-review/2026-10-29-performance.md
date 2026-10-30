# Performance review — 29 October 2026

Tests now mounts a category's cards on its first visit and retains them afterward. Story pages now fit their available space with CSS rather than feeding every opening-animation resize back through React. Current-page artwork requests have high priority; adjacent-page prefetches have low priority and use asynchronous decoding. All artwork files, resolutions, encoding, and animation durations are preserved.

## Production measurements

Medians of three fresh-context Chromium runs per scenario, before and after this pass. Desktop used 1280 × 800 at device scale factor 1. The phone-sized context used 390 × 844 at scale factor 2 with touch enabled and CPU throttled 4×. Both phases used production Vite builds and the same local gzip server.

| Tests on first entry           |   Before |    After | Result                                   |
| ------------------------------ | -------: | -------: | ---------------------------------------- |
| Mounted cards                  |        8 |        4 | Only Numbers mounts initially            |
| Completed requests             |       52 |       34 | Other category artwork waits for a visit |
| Completed transfer             |  6.46 MB |  2.74 MB | 57.5% less                               |
| Desktop JavaScript time        |  82.1 ms |  59.5 ms | 27.5% less                               |
| Phone JavaScript time, CPU 4×  | 365.3 ms | 298.9 ms | 18.2% less                               |
| Phone main-thread task time    | 809.7 ms | 700.4 ms | 13.5% less                               |
| Phone first contentful paint   |   340 ms |   340 ms | Unchanged                                |
| Phone total long-task duration |   298 ms |   301 ms | No improvement established               |

This reduces work and transfer on entry, rather than making the first paint earlier. Transfers include HTTP overhead and completed requests at the sampling point. The normal scenario samples 1,500 ms after Arithmetic becomes visible. These are fixture-page measurements with seven default tests and real application components; auth, child, and test-data hooks supply deterministic local data.

With the same phone CPU throttle plus 1.5 Mbps download and 80 ms latency, JavaScript time fell from 417.2 to 305.9 ms. Completed transfer at the separate 2,500 ms sampling point fell from 608.6 to 546.5 kB. Unfinished image requests are absent from these bounded-window counts, so these figures are not the full eventual download size. Network first contentful paint was essentially unchanged: 2,348 versus 2,340 ms.

## Interaction responsiveness and tradeoffs

First visits now pay the cost of mounting the selected category. The phone-sized measurements include Playwright click dispatch, the section becoming visible, and two animation frames; they are synthetic interaction timings, not field INP.

| Phone category selection, CPU 4× |   Before |    After |
| -------------------------------- | -------: | -------: |
| Letters, first visit             | 136.4 ms | 188.4 ms |
| Trivia, first visit              | 100.0 ms | 131.7 ms |
| Stories, first visit             |  92.0 ms |  99.9 ms |
| Numbers, first return            | 106.7 ms | 110.1 ms |
| Trivia, repeat visit             |  95.3 ms |  99.5 ms |
| Numbers, repeat return           | 101.7 ms | 100.6 ms |

All sampled selections finished within 200 ms; the slowest individual after sample was 192.7 ms. Once visited, category components remain mounted, preserving puzzles, in-progress answers, and timers across category and main-tab changes. Existing child/day reset behavior is retained. This deliberately trades a small first-visit delay for substantially less initial work and artwork transfer.

Story opening no longer triggers a ResizeObserver → React state → inline size update on each frame. The browser computes the same aspect-ratio fit using container-relative dimensions. Desktop surface-style mutations during opening fell from a median of 56 to zero; phone mutations fell from 2 to zero. Cumulative desktop JavaScript time through opening fell from 34.6 to 24.6 ms. Phone JavaScript time was 124.4 versus 120.8 ms, too small a difference to claim a substantial phone speedup.

Both phases had no long tasks during measured story opening, no sampled opening frame gaps above 33.5 ms, and approximately 16.7–16.8 ms p95 frame spacing. The existing 1,200 ms phone-to-book morph and 1,000 ms page transitions remain intact, including reduced-motion behavior. Adjacent pages are still prefetched; requested artwork is decoded before replacing the current page, and a stale decode cannot replace a newer scrub selection.

## Image preservation

- SHA-256 comparison: all **1,846 files under `src/assets`** are unchanged, with no additions or removals during this pass.
- Before/after settled next-page screenshots are **pixel-for-pixel identical**: 1280 × 800 desktop and 780 × 1688 phone screenshot pixels, with zero changed pixels in either pair.
- Cover and landscape-page bounds are identical in the measured before/after scenarios. Images retain `object-fit: contain`; no lower-resolution source, recompression, canvas scaling change, or quality setting was introduced.
- Only loading order, decode scheduling hints, component mounting, and layout ownership changed. Fetch priority is a browser hint rather than a scheduling guarantee.

## Other reviewed paths

The existing main-tab layout already mounts activity pages on first visit and retains them to protect activity state. Time Explorer clock dragging coalesces pointer updates with animation frames and throttles React snapshot commits while updating the hands directly. Its 3D renderer already stops for hidden documents and offscreen canvases, and uses resize notifications to avoid routine per-frame size reads. Offline shell registration waits until after first paint/idle time; installation limits code/font fetch concurrency to three, and visited media is cached without recompression. These mechanisms were inspected and left intact. They were not GPU benchmarks or live Firestore latency measurements.

The public login startup sanity sample remained essentially unchanged: first contentful paint was 300 ms in both phases and main-thread task time was 403.6 versus 408.1 ms. One sample per phase supports only a basic regression check. Remaining cold-start tasks on the throttled Tests fixture include an approximately 160 ms task; this pass does not claim to eliminate startup blocking. A follow-up trace of module evaluation and a physical Android/GPU session would be needed before changing bundle boundaries or 3D rendering behavior.

## Validation and evidence

- Unit/component suite: **69 files, 178 tests passed**, including deferred category mounting, retained activities, image decode races, failures, and recovery.
- Story browser suite: **10 passed, 2 skipped** across Chromium, Firefox, and WebKit. Firefox's two mobile-context cases are unsupported. Desktop opening/reversal, page morphs, scrubbing, focus restoration, reduced motion, and supported phone landscape/swipe cases pass.
- ESLint, repository formatting, TypeScript and standard production web build: passed.
- `git diff --check`: passed.

The [machine-readable comparison](2026-10-29-performance.json) includes medians, geometry, visual comparison, and measurement limits. Raw runs, fixture hooks, profiling/server scripts, source snapshot, screenshots, asset hashes, and validation logs are available locally under `output/performance-2026-10-29/` (ignored generated output). The raw field `cold_ready_wall_ms` includes subsequent category switches and is excluded from startup conclusions.

The baseline was the working tree at the start of this pass, including pending story changes on top of `3ba9414`. The pass modifies four production files and two existing regression-test files, plus this review and its data. Earlier pending edits are preserved. These measurements use a browser emulation with CPU/network throttling; they are not measurements from the connected Android handset or authenticated production data. Changes remain local and have not been pushed or deployed by this review.
