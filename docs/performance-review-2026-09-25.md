# Performance review — 25 September 2026

The best opportunities are to stop rebuilding the globe on every panel toggle, remove validation code from signed-out startup, and avoid repeatedly downloading unchanged files during website offline preparation. These can preserve the existing artwork, animation, geometry, lighting, and interaction behavior. This review makes no production code or artwork changes.

## Evidence and scope

Reviewed the current working tree based on `16bb6ac`, including the uncommitted feature work. Built the application successfully with TypeScript and Vite, inspected production dependency graphs, ran six isolated web startup measurements, and exercised the real clock/globe components in a separate production-built fixture. No account actions were performed.

The connected Samsung Galaxy Note10+ (SM-N975F, Android 12, WebView 153.0.8010.36) runs a **debuggable, older APK**, last updated 25 September at 01:11. Its entry asset is `index-CqOjahni.js`; the current local build is `index-B1FIAXjg.js`. It still has the older 56px header artwork. Do not treat installed-app observations as measurements of today's new header.

After the user unlocked the phone, measured three foreground cold process starts, three hot task returns, clock increments and hand dragging, repeated globe toggles, weather adjustments, tab changes, list swipes, and online/blocked-network WebView reloads. Existing marks from the earlier locked session were discarded. No APK was installed, app data cleared, account credentials exported, or device connectivity changed. The original route, panels, city, weather draft, selected date and clock time were restored and verified after testing.

| Measurement                                             |                                                            Result | Interpretation                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------: | ----------------------------------------------------------------------------- |
| Local web login FCP/LCP, median of three fresh contexts |                                                           1.444 s | Signed-out laboratory measurement                                             |
| Same login with service workers blocked                 |                                                           1.428 s | Difference is too small to claim a paint improvement                          |
| Requests with offline preparation / without             |                                                           82 / 10 | Includes 72 requests initiated by the service worker                          |
| Offline core                                            |                                         70 files; 3,790,094 bytes | Uncompressed build bytes, excluding index HTML and subsequently cached images |
| Login static JS graph                                   |                                   526,418 bytes raw; 158,186 gzip | Includes shared chunks once                                                   |
| Protected Time Explorer static JS graph                 |                                 1,158,698 bytes raw; 346,639 gzip | Excludes deferred globe/weather/calendar modules and media                    |
| Twelve clock increment clicks, globe disabled           | 24 local-storage writes; 60 explicit date-formatter constructions | Actual production component/model in isolated fixture                         |
| Globe first opening in fixture                          |                                                898 ms to ready UI | Desktop laboratory result, not Android timing                                 |
| Three subsequent globe openings                         |                                                570 / 720 / 690 ms | Warm modules and session texture cache, but renderer rebuilt                  |
| Phone saved account record                              |                                        19,892 bytes; 36 documents | Aggregate only; no account content copied                                     |
| Phone IndexedDB open/read, one sample                   |                                                            5.7 ms | Read-only storage sample; excludes validation and startup writeback           |

Web startup used Chromium, 390×844 viewport, 4× CPU slowdown, disabled page cache, 150ms latency, approximately 1.6Mbps download / 750kbps upload, and six seconds of settling. Throttling was applied to the page CDP target, **not the worker target**; worker request counts are valid, but these runs do not establish slow-network service-worker download duration or contention. Preview transport is not deployed Firebase Hosting compression. No deployed-site or authenticated web end-to-end startup claim is made.

The globe fixture also used 4× CPU slowdown. It is isolated from authentication and account synchronization; desktop/headless GPU behavior is not representative of the phone. “Ready” means the current globe-ready UI state, not completion of the Earth texture or final visual settling.

### Physical phone results

| Measurement                                         | Samples                                | Median / observation                          |
| --------------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| Native cold launch, `am start -W -S`                | 913 / 915 / 860 ms                     | 913 ms to initial native display              |
| WebView first contentful paint on those cold starts | 544 / 508 / 488 ms                     | 508 ms from web navigation                    |
| Auth ready on those cold starts                     | 1066 / 1005 / 925 ms                   | 1005 ms from web navigation                   |
| Saved-data ready on those cold starts               | 1406 / 1355 / 1271 ms                  | 1355 ms from web navigation                   |
| Chores route mounted on those cold starts           | 1751 / 1694 / 1615 ms                  | 1694 ms from web navigation                   |
| Return from Home, process retained                  | 76 / 71 / 74 ms                        | 74 ms native hot return                       |
| Globe warm reopening, CPU profiler attached         | 885 / 858 ms                           | Repeated 371 / 365 ms main-thread tasks       |
| Globe opening/reopening, profiler detached          | 1005 / 1080 ms                         | Still produced 313 / 271 ms main-thread tasks |
| Clock hand full-turn drag, profiler detached        | 118 observed animation-frame intervals | p95 16.8 ms; no long tasks                    |
| Three Chores list swipes, profiler detached         | 220 observed animation-frame intervals | p95 16.9 ms; no long tasks                    |
| Time Explorer WebView reload, online                | 1178 / 1159 / 1128 ms to route mount   | 1159 ms                                       |
| Same reload with external WebView requests blocked  | 1014 / 999 / 1046 ms to route mount    | 1014 ms; saved content remained usable        |

Native launch timing and web-navigation timing have different origins; do not add or substitute them. The route-mounted mark is not an image-complete/fully-drawn milestone. Hot task returns are not warm process restarts. Reload runs retain the process and caches. The blocked-request experiment blocked five external WebView requests per run while allowing packaged `https://localhost` resources; native-plugin networking was not disabled, so this is not an airplane-mode cold-launch test.

Touch input was sent through CDP to observed button/hand coordinates. UI-ready elapsed times include automation/USB and polling overhead; animation-frame intervals are a JavaScript scheduling proxy, not presented-frame measurements. Twelve clock increment clicks recorded click-to-next-paint event durations of 64–120ms and no long tasks; the first weather adjustment had a 280ms event duration, with later temperature adjustments at 64–72ms. These short diagnostic samples are not field INP statistics. Native `gfxinfo` recorded missed frame deadlines during the mixed, profiled interaction run; this is retained as diagnostic evidence rather than a steady-state FPS claim.

## Ranked opportunities

### 1. Preserve the globe renderer across panel toggles

**Priority: high for responsiveness; web and Android.** [useSolarSystem3D.ts](../src/features/dayNightExplorer/useSolarSystem3D.ts:29) disposes its manager whenever `enabled` changes, and [TimeExplorerPage.tsx](../src/pages/TimeExplorerPage.tsx) removes the canvas when the panel is hidden. Reopening creates a new WebGL context, all geometry, month-label textures, and GPU resources, even though the JS modules and Earth pixel buffer are already cached.

The three warm fixture openings took 570–720ms, with long tasks of 456ms, 147ms, and 140ms respectively during those observation windows. The phone reproduced the problem: approximately 0.86–1.08 seconds to the globe-ready UI across repeated openings, with 271–371ms main-thread tasks even after modules/pixels were cached. These are reopening observations, not isolated constructor timings.

The phone CPU profile accumulated about 622ms in Three.js shader-program diagnostics/initialization, 287ms in `getContext`, and about 271ms in renderer `setSize` across the mixed run. The hot minified function was checked against the actual installed asset: it calls `getProgramInfoLog`, `getShaderInfoLog`, and program link-status queries. This supports avoiding repeated context/shader setup rather than lowering visual quality. The installed and current builds have the same `vendor-three-BV_cp_X0.js` asset.

This phone reports **no `KHR_parallel_shader_compile` extension**. Three.js provides [compileAsync](https://threejs.org/docs/pages/WebGLRenderer.html), but its parallel-compilation benefit depends on that extension; it is not a sufficient standalone solution for this device. On capable browsers, investigate precompilation after the real materials/lighting are configured. Preserve shader-error handling. Month-label generation may also be deferred until needed and cached per font, but it was not the dominant identified profile hotspot.

Keep the canvas/manager mounted for the lifetime of the Time Explorer route, explicitly pause rendering while its panel is hidden, and resume with the latest scene state. Continue disposing on route exit and handling context loss/retry. The tradeoff is retaining GPU memory while the hidden panel is reusable. Verify that hiding really stops the animation loop, and that repeated toggles do not accumulate contexts or textures. Keep star motion, city pulses, antialiasing, pixel ratio, materials, tessellation, and texture resolution unchanged.

### 2. Remove the validation library from the login path

**Priority: high confidence, modest startup saving; strongest for signed-out web.** [ActiveChildProvider.tsx](../src/contexts/ActiveChildProvider.tsx:2) imports Zod to parse two nullable strings in a local preference. Because this provider wraps the whole app, the production login graph contains `vendor-validation-CIKO5oBb.js`: **91,352 bytes raw / 24,858 gzip**, about 17% of its raw JS graph.

Use a small equivalent parser for this preference or move the validating state provider behind the protected boundary. Preserve its existing malformed-input fallback, nullable fields, extra-field handling, account isolation, and initial theme selection. Do not weaken document or offline-state validation. Signed-in Android will still need validation for its protected data, so this is primarily a scheduling/login improvement, not a claim that all authenticated startup JS disappears.

The entire validation chunk is the current avoidable entry dependency; exact net savings require a rebuild after the change.

### 3. Make offline installation reuse unchanged assets and yield to foreground loading

**Priority: medium-high; website only.** [registerOfflineShell.ts](../src/lib/registerOfflineShell.ts:37) begins preparation after a first-paint/idle opportunity. [offline-worker.js](../scripts/offline-worker.js:50) then fetches every core file with `cache: 'reload'`, three at a time, including optional features and the world dataset. The current core is 3.79MB uncompressed. Every new build repeats this work, including files whose content-hashed names have not changed.

During installation, copy matching immutable files from the previous shell cache into the new version before fetching missing files. Prioritize the shell and requested route, and schedule the remaining preparation after foreground route loading has settled. Keep the complete offline core and existing atomic activation/version guarantees. Avoid merely dropping optional code from the cache, which would change offline behavior.

Measured first paint barely changed when disabling service workers; this finding is about unnecessary background work and possible navigation contention, not a demonstrated FCP regression. Service-worker precaching consumes bandwidth, CPU, and storage, as described in [web.dev's precaching guidance](https://web.dev/learn/performance/prefetching-prerendering-precaching).

### 4. Remove duplicate clock persistence and repeated date setup

**Priority: medium/low; both platforms, especially dragging.** The persistence effect in [useDayNightExplorerModel.ts](../src/features/dayNightExplorer/useDayNightExplorerModel.ts:165) saves on setup and again on cleanup. Its clock dependencies make each adjustment run both paths. Twelve increment clicks produced **24 writes and 60 explicit `Intl.DateTimeFormat` constructions** in the current production model, with the globe disabled. The direct `setItem` calls totaled only about 2ms in that desktop sample; do not call storage itself the dominant bottleneck.

Separate lifecycle flushing from reactive saving, skip unchanged serialized snapshots, and coalesce intermediate drag saves while flushing the final pointer release, route exit, and background transition. Retain reload restoration and midnight reset behavior. [today.ts](../src/lib/today.ts:19) can reuse formatters by timezone; a date-key-only helper should not also format an unused display label. The argument to the date-restore `useRef` is also evaluated on every render even though only its initial value is retained.

These changes remove work without reducing live clock or globe update frequency. Recheck daylight-saving transitions and all three cities. Avoid caching a timezone offset across arbitrary dates.

### 5. Keep spelling catalogues out of unrelated list startup

**Priority: medium; both platforms.** [assets/rewards/assets.ts](../src/assets/rewards/assets.ts:6) now imports all spelling sets for reward overlays. The shared reward celebration is also imported by [useTaskCelebration.tsx](../src/hooks/useTaskCelebration.tsx:2), so Chores and Tests load reward/spelling catalogue code before any LEGO reward needs it. Their production graphs include `assets-B8ptPhWZ.js` (36,549 bytes) and `animalAssets-DSjLmpml.js` (6,486 bytes).

Separate the generic celebration renderer from reward artwork resolution, or supply the already resolved image/overlay from the reward feature. Keep the exact spelling-match behavior and resolve/preload the overlay before a reward is displayed. The chunk sizes above include other catalogue code and are an upper bound, not promised savings. These are URL/catalogue modules: importing them does **not** mean every referenced image downloads.

### 6. Investigate oversized toolbar artwork under a strict visual-parity check

**Priority: potentially high for cold media loading; experiment before implementation.** The current four Teenie PNG header assets—clock, globe, reset, and weather character—total **5,274,998 bytes**. Each is 1254×1254, giving roughly 24MiB of combined full-resolution RGBA pixels, although actual decoder/GPU allocations vary. They are displayed in roughly 64px slots. The installed older app confirms the same general mismatch at 56px slots on a DPR 2.625 display.

Start with lossless PNG recompression and request/decode scheduling, preserving dimensions, alpha, color profiles, and browser-decoded pixels. Correctly sized high-DPI variants are a separate experiment only if screenshots prove no visible detail is lost at supported sizes and zoom levels; retain originals wherever larger rendering needs them. The earlier review already rejected a WebP conversion because translucent browser-decoded pixels differed, so do not repeat it as an assumed safe saving.

This review has not converted assets or demonstrated compression savings. Do not replace detailed illustrations, reduce globe quality, or remove animation to achieve a smaller number.

### 7. Trim Android offline-store work without redesigning persistence

**Priority: low at the current account size.** [OfflineStore.open](../src/offline/store.ts:32) invokes a read/write transaction with an empty mutation, validating and writing back the entire account before publishing it. [useUserCollection](../src/data/useUserCollection.ts:69) remaps a collection after every store publication and every 30 seconds, even for unrelated collection changes. Server snapshots similarly merge/write complete collections.

A read-only validated startup path for existing records, atomic initialization for absent records, unchanged-snapshot detection, and collection-specific revisions could avoid redundant work. Preserve strict durability for real mutations, pending-operation ordering, cross-tab/device behavior, midnight progress projection, and account separation. The connected account has only ~20KB of data and no pending operations; its one raw read took 5.7ms. That evidence does not justify a database schema rewrite or weaker durability.

## Validation required for implementation

The connected-device baseline above is complete for this review. Compare the same current APK/build before and after implementing a change; the measured installed APK is older and debuggable. Repeat cold launches, hot returns, panel toggles, dragging, scrolling, and network-failure checks, then validate a release build and a genuine airplane-mode cold launch. Preserve data and restore temporary exploration selections as done here. No improvement percentage is claimed before an implementation/A-B comparison.

Record both native launch timing and web marks. Android's first activity frame is not the same as usable application content; [Android's startup guidance](https://developer.android.com/topic/performance/issues/launch-time) distinguishes initial display from fully drawn content. The existing `globe-scene-ready` mark fires after manager construction, before asynchronous texture readiness, and marks are recorded only once. Add separate texture/first-render and per-navigation measurements before using them as completion metrics. Long tasks over 50ms can delay input; split avoidable work rather than hiding it behind an unchanged long task in a later callback ([web.dev guidance](https://web.dev/articles/optimize-long-tasks)).

Recommended order: globe retention with memory/frame verification first, because the phone confirms repeated long stalls; validation dependency and offline-cache reuse next; catalogue isolation and duplicate clock work afterward. Treat media variants as a separately validated experiment. Normal clock dragging and Chores scrolling were comparatively healthy, so avoid broad rendering rewrites or visual simplification there.

Raw evidence is retained locally in ignored `output/performance-2026-09-25/`: `build.json`, `web.json`, `clock-adjustments.json`, `globe-toggles.json`, `phone-storage.json`, `phone-startup.json`, `phone-interactions.json`, `phone-interactions.cpuprofile`, `profile-summary.json`, `phone-gestures.json`, `phone-reloads.json`, `phone-gfxinfo.txt`, and `phone-restoration.json`. `phone-initial.json` contains the discarded locked-session observations. Reproduction scripts and the isolated fixture are in ignored `tmp/performance-*.mjs`, `tmp/performance-explorer.tsx`, and `tmp/performance-fixture.config.ts`. The fixture is not shipped in the app.
