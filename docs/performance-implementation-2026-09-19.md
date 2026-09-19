# Startup performance improvements — 19 September 2026

Implemented the five main findings from [the startup review](performance-review-2026-09-19.md). Returning users can load their requested page sooner, and the clock appears before its deferred globe work. The weather toolbar now uses the existing themed thermometer icon; the full illustrated weather panel loads when opened.

## Changes

- **Auth initialization:** replaced `getAuth` with explicit `initializeAuth`, retaining the existing IndexedDB/localStorage/sessionStorage persistence order. The browser popup resolver is supplied only when web Google sign-in is requested. Native sign-in continues through Capacitor and `signInWithCredential`.
- **Requested-route imports:** protected data code and the requested page import together. A non-sensitive local boolean hint enables imports during saved-session restoration on later launches. Without a hint, imports begin once Auth supplies a user. A stale hint only downloads code: `ProtectedRoute` still controls rendering and user-data access. Storage failure disables this optional optimization.
- **Weather:** replaced the always-mounted compact scene with the existing thermometer artwork and made `WeatherPanel` lazy. Clock/calendar entry no longer renders the 1.68 MB princess or 2.11 MB Teenieping wardrobe. Weather exploration state remains in the page, so switching panels preserves it. Full artwork files are unchanged.
- **Globe:** Three.js and the scene manager load after two animation frames, giving the existing clock/agenda shell a paint opportunity. The canvas retains its dimensions. Initialization uses the latest scene state, including clock dragging while code loads. Unmount cancels pending initialization; completed scenes retain their existing disposal. Loading and retry states handle deferred initialization without blocking the rest of the page.
- **Font:** removed the unused Space Grotesk preload, eliminating approximately 49 kB of startup transfer.
- **Diagnostics:** local User Timing marks record `msq:start`, `msq:auth-ready`, `msq:saved-data-ready` (Android), `msq:route-mounted`, and `msq:globe-scene-ready`. Each records the first occurrence per document. These are lifecycle markers, not guarantees that all remote data, Earth texture pixels, or painted content are ready. There is no telemetry upload. `msq:start` runs after entry imports execute; use navigation timing for total startup time.

## Bundle results

Static dependency sizes include shared modules once and the protected data route for authenticated pages. Gzip is calculated locally. Images, styles, fonts, API traffic, workers, and deferred chunks are excluded.

| Route         | Before, gzip | After, gzip |
| ------------- | -----------: | ----------: |
| Login         |     132.4 kB |    132.9 kB |
| Chores        |     346.2 kB |    346.9 kB |
| Tests         |     339.6 kB |    340.4 kB |
| Time Explorer |     475.5 kB |    333.2 kB |

Time Explorer's initial JavaScript graph is **29.9% smaller**. The globe's code still loads shortly afterward; this is a reduction in the dependency chain needed to mount the page, not removal of globe functionality or equivalent savings in total session bytes. The weather chunk loads only when selected. Small increases elsewhere cover the preloader, loading states, and timing markers.

## Deployed mobile measurements

Three new cold Lighthouse 13.5.0 runs used the same Firebase URL and default simulated mobile settings as the review. Each isolated session was signed out and landed on `/login`.

| After deployment | First contentful paint | Largest contentful paint | Total blocking time | Performance score |
| ---------------- | ---------------------: | -----------------------: | ------------------: | ----------------: |
| Run 1            |                 1.92 s |                   2.04 s |               20 ms |                97 |
| Run 2            |                 1.43 s |                   1.83 s |             24.5 ms |                99 |
| Run 3            |                 1.45 s |                   2.00 s |             28.5 ms |                99 |
| Median           |                 1.45 s |                   2.00 s |             24.5 ms |                99 |

Median largest contentful paint improved from **4.20 s to 2.00 s** (about 52%). First contentful paint was essentially unchanged: 1.42 s before and 1.45 s afterward. Total blocking time remained low, though the median rose from 8 ms to 24.5 ms. Transferred bytes fell from approximately **398 kB to 212 kB**, a **47% reduction**, and requests fell from 17 to 10–11. None of the three runs requested the popup helpers, Auth iframe, or unused font.

These small-sample lab results establish a useful improvement in signed-out mobile startup; they do not quantify saved-session or physical Android startup. Raw results are retained locally in `output/performance-fixed-live-{1,2,3}.json` and `output/performance-fixed-summary.json`. Reports contain no audit errors or warnings. As in the baseline, the CLI returned exit code 1 after writing complete results because Windows denied temporary Chrome-profile cleanup.

## Verification

- Production TypeScript/Vite build and full ESLint check passed.
- All **153 tests across 56 suites** passed. Focused final tests were repeated after test-harness formatting/lint adjustments.
- New tests cover preserved Auth persistence configuration, saved-session restoration, web popup cancellation, native credential sign-in, blocked hint storage, protected-route isolation during speculative loading, deferred globe cancellation/state synchronization/retry, and wardrobe absence from both themes' clock/calendar entry.
- The authenticated local browser restored its existing session, rendered the globe and clock, displayed the calendar and agenda, and opened the full Teenieping weather scene. No browser warnings/errors were reported during the final weather check. Princess wardrobe behavior is covered by component tests.
- A cold mobile Lighthouse audit of the production preview made no proactive popup-helper/iframe requests and no unused font request. Production-host measurements are recorded below.
- Capacitor sync and Android `assembleDebug` passed. All **1,424 packaged web files** were compared byte for byte with the production build and matched. The phone is currently absent from ADB, so installation and physical-device startup/offline verification remain pending.
- Firebase Hosting deployment succeeded. The deployed HTML and all six linked startup assets were byte-verified against the build and returned HTTP 200. Cloud Functions and Firestore rules did not change.

The review's secondary possibilities—development catalog module traffic, calendar request sharing, and offline-record growth—remain separate profiling opportunities. No account-storage redesign or artwork quality reduction was introduced.
