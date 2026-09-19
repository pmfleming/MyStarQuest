# Startup performance review — 19 September 2026

The best first changes are to defer Firebase's popup helper until sign-in, stop loading a full weather wardrobe for the toolbar icon, and overlap the requested route's code loading with session restoration. These address distinct causes on mobile web, Android, and local development. Application behavior and assets were not modified during this review.

Reviewed commit: `da771cd8b1aaafa35ed323355348ac3e533cdd9b`.

## Measurements and limits

Three cold Lighthouse 13.5.0 runs against `https://mystarquest-1b6f8.web.app` used its default simulated mobile settings: 150 ms RTT, approximately 1.64 Mbps throughput, and 4× CPU slowdown. Each isolated browser was signed out and finished on `/login`. These are laboratory estimates, not actual phone timings or authenticated Time Explorer timings.

| Production run | First contentful paint | Largest contentful paint | Total blocking time | Performance score |
| -------------- | ---------------------: | -----------------------: | ------------------: | ----------------: |
| 1              |                 1.40 s |                   4.20 s |                8 ms |                86 |
| 2              |                 4.01 s |                   4.91 s |                0 ms |                72 |
| 3              |                 1.42 s |                   2.92 s |               13 ms |                95 |
| Median         |                 1.42 s |                   4.20 s |                8 ms |                86 |

Each production run transferred approximately 398 kB across 17 requests. The wide timing range makes a single score unreliable. Low blocking time on login does not establish that authenticated screens have little CPU work.

One equivalent audit of `http://localhost:5174/tabs/time-explorer` redirected to login and transferred **7.29 MB across 237 requests**, including **170 asset URL modules**. Its simulated first paint was 22.58 s and largest paint 44.33 s. Those throttled estimates should not be presented as normal desktop waiting times: they demonstrate the much larger development dependency graph. The development React DOM module alone transferred 2.82 MB, the router 1.43 MB, and one Firebase module 1.14 MB. Production preview is the appropriate baseline for user-facing performance.

The current production build passed with `npm run build -- --manifest`. Static JavaScript dependency sizes below count shared chunks once and include the protected data route for authenticated screens. Gzip is calculated locally; these are not actual Firebase Hosting transfer totals and exclude CSS, fonts, images, workers, APIs, and later activity imports.

| Route         | JavaScript, uncompressed | JavaScript, gzip |
| ------------- | -----------------------: | ---------------: |
| Login         |                 433.0 kB |         132.4 kB |
| Chores        |               1,147.6 kB |         346.2 kB |
| Tests         |               1,129.3 kB |         339.6 kB |
| Time Explorer |               1,678.4 kB |         475.5 kB |

The existing authenticated local browser was inspected to verify which artwork the clock's toolbar renders. It was restored to its original weather panel. The phone was absent from `adb devices -l`, so no physical-device cold-start or offline timing was possible. Android conclusions below are based on its shared source and installed Firebase SDK, with device impact still to be measured.

## Ranked findings

### 1. High priority: mobile session restoration waits for unnecessary popup initialization

[firebase.ts](../src/firebase.ts:32) calls `getAuth(app)`. The installed SDK supplies a popup/redirect resolver by default. On mobile browsers and Safari, `_initializeWithPersistence` awaits proactive resolver initialization before restoring the current user. [ProtectedRoute.tsx](../src/routes/ProtectedRoute.tsx:8) consequently remains on “Checking your session…” until authentication reports its state.

All three mobile audits fetched Google API helpers and a Firebase Auth iframe before any sign-in action, totaling approximately **137 kB**. The SDK's serial initialization is confirmed in source; the precise portion of paint delay attributable to it has not been measured by an A/B change. Android already signs in through the native Capacitor plugin and `signInWithCredential`, making a browser popup helper unnecessary for that flow.

Use `initializeAuth` without an eagerly configured popup resolver. Preserve the current persistence hierarchy—IndexedDB, local storage, then session storage—and pass `browserPopupRedirectResolver` explicitly to the web `signInWithPopup` call. Firebase documents this way of deferring mobile iframe work: [custom Auth dependencies](https://firebase.google.com/docs/auth/web/custom-dependencies). This moves work to an actual web sign-in attempt; it does not eliminate legitimate token refresh traffic.

Validate existing saved sessions, fresh web and native sign-in, popup cancellation, sign-out, and Android airplane-mode reopening. Keep authorization gating intact.

### 2. High priority: a 34 × 34 weather button loads the full wardrobe atlas

[TimeExplorerPage.tsx](../src/pages/TimeExplorerPage.tsx:109) always renders a compact `WeatherScene`, including while the clock is selected. In [WeatherScene.tsx](../src/components/weather/WeatherScene.tsx:176), compact styling still renders the full character atlas through an SVG image.

The princess atlas is **1,683,375 bytes** and the Teenieping atlas is **2,113,747 bytes**. The authenticated browser's clock panel contained the Teenieping wardrobe image in this tiny button. Only the active theme is required; imported image URLs do not themselves download every theme's images. Opening the full weather panel can reuse the same cached resource.

Use the existing themed thermometer icon, or a dedicated small preview, in the header and defer the full weather scene until selected. This removes the atlas request from cold clock/calendar entry on the website and avoids early image decoding on Android. The packaged atlas can retain its full quality. Confirm the cold request waterfall contains no wardrobe image until weather is opened, and compare the weather panel afterward.

### 3. Medium priority: protected startup loads dependencies in successive stages

[App.tsx](../src/App.tsx:13) lazily loads both the protected data route and individual pages. Because [ProtectedRoute](../src/routes/ProtectedRoute.tsx:20) renders its outlet only after session resolution, the data module starts afterward; the page's lazy loader starts only when its parent renders it. Android also waits for [OfflineBoundary](../src/offline/OfflineBoundary.tsx:26) to open saved data. The global Suspense fallback is an empty full-screen element.

Start imports for the requested destination and its data boundary while authentication restores, without rendering protected data or starting user queries early. Preserve lazy loading for other destinations. A persistent shell or meaningful loading state will also make this wait visible. Module loading, session restoration, and opening saved data should have separate timing marks to establish which gate dominates.

Time Explorer's initial graph is 475.5 kB gzip, including the 132.7 kB Three.js chunk and shared data infrastructure. Renaming or splitting vendor files without changing when they are needed will not remove this total.

### 4. Medium priority: Time Explorer initializes its 3D scene before a lightweight page is usable

[useSolarSystem3D.ts](../src/features/dayNightExplorer/useSolarSystem3D.ts:16) constructs `SolarSystem3DManager` synchronously on mount. Three.js is a static dependency, and the globe mounts regardless of which lower panel is selected. Cold texture generation still needs the world dataset and worker rasterization; the existing pixel cache helps subsequent visits.

Place scene code behind a separate deferred boundary so the clock and agenda can become usable first, with the globe retaining its reserved space and full visual quality. Profile renderer construction, first frame, and texture readiness separately before choosing additional changes. A pre-generated equivalent Earth texture is another experiment if cold worker generation proves significant. This is a source-based opportunity, not a measured device bottleneck.

### 5. Low effort: remove an unused font preload

[index.html](../index.html:6) preloads Space Grotesk, but application typography uses Nunito, Merienda, and fallback fonts. Every production audit fetched approximately **49 kB** for this unused font. Remove its preload; measure any replacement preload against the actual initial theme. This is a definite small transfer saving, not the main explanation for multi-second startup.

## Secondary opportunities

- **Development-only module traffic:** [themeAssets.ts](../src/ui/themeAssets.ts:76) eagerly imports many image URL wrappers. Scope theme/catalog mappings to the features that use them, or evaluate generated lightweight URL manifests if local cold starts remain disruptive. Count module requests after a change and preserve production asset hashing. The measured 170 URL requests do not mean 170 full images were downloaded.
- **Calendar request sharing:** the Time Explorer model and calendar component each call `useSchoolCalendar`. A cold, still-pending holiday fetch can be repeated when the calendar opens. Share pending work and retain the existing seven-day cache and stale fallback. A bounded request timeout would improve failure handling. This background request does not gate the initial route, so it ranks below the startup findings.
- **Android saved-data growth:** offline startup reads and validates a whole-account IndexedDB record; updates clone and persist the full state. Measure account size and open/validation time on the phone before redesigning storage. There is no evidence here that the user's stored data is currently large enough to dominate startup.

Earlier improvements remain present: the deliberate post-login delay was removed, LoginPage is eager, Earth texture work is shared and cached within the session, scene resources are disposed, and optional creature collections are lazy. The APK's total asset size is install/package size, not an initial website download or a measured startup cost.

## Implementation and verification order

Implement Auth initialization and the compact weather icon first, then requested-route preloading and the unused font removal. Measure again before restructuring the globe or offline store. Add startup marks for auth-ready, saved-data-ready, first usable route, and globe-ready. Compare cold and warm signed-in launches in both themes on production web and the physical phone, including offline Android reopening. Preserve sign-in persistence, agenda times, and the full-size themed artwork.

Raw Lighthouse JSON and logs are retained locally in `output/performance-live-1.*`, `output/performance-live-2.*`, `output/performance-live-3.*`, and `output/performance-dev.*`, with extracted results in `output/performance-summary.json`. Lighthouse wrote complete reports without audit errors or warnings, then returned exit code 1 because Windows denied temporary Chrome-profile cleanup. No runtime changes or new tests were needed for this review, and no performance fixes were deployed.
