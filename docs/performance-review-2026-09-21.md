# Performance changes — 21 September 2026

Implemented startup and rendering improvements in the shared web/Android frontend while retaining the original artwork and rendering settings. The baseline includes the calendar work already in progress at the start of this performance review; it is not the repository's last commit.

## Measured web startup

| Metric                                        |    Before |     After | Change |
| --------------------------------------------- | --------: | --------: | -----: |
| Login static JavaScript dependency graph, raw | 543,277 B | 434,406 B | −20.0% |
| Same JavaScript, gzip                         | 160,892 B | 132,780 B | −17.5% |
| Cold login first contentful paint, median     |   1.624 s |   1.460 s | −10.1% |
| Cold login largest contentful paint, median   |   1.624 s |   1.460 s | −10.1% |
| Requests observed through the settling period |        10 |         8 |     −2 |

These are local production-build measurements, not deployed-site or physical-phone timings. Each build was served with Vite preview. Three fresh Chromium contexts used a 390 × 844 viewport, disabled cache, 150 ms network latency, 1.6 Mbps download, 750 kbps upload, and 4× CPU slowdown. The script waited for the login button, fonts, and a 1.5-second settling period. Gzip sizes are calculated from the build's manifest dependency graph; preview transport need not use gzip. Normal run-to-run timing variation applies.

Before first-paint samples: 1.624, 1.612, 1.644 seconds. Final after samples: 1.476, 1.460, 1.440 seconds (an earlier repeat had a 1.464-second median). The before/after login screenshots are pixel-identical and neither build produced page errors. Raw measurements, screenshots and the measurement script are retained locally in the ignored `output/performance-review/` directory.

## Changes retained

- **Defer calendar synchronization at app level.** `SchoolCalendarSync` dynamically imports the calendar store after a signed-in paint and an idle opportunity. The calendar seed, validation and bridge no longer enter the signed-out login dependency graph. Cleanup handles sign-out/unmount and late imports. Calendar consumers can still initialize the shared store immediately when needed; Android's native background worker remains independent of this scheduling.
- **Scope the theme asset catalogue.** The shared Teenie catalogue includes its actual root, agenda and season roles. Weather and school-event URL catalogues stay with their feature resolvers. This avoids eager URL metadata in the common bundle; it does not imply all those images previously downloaded at login.
- **Load the calendar panel when selected.** Time Explorer lazy-loads the calendar UI with a loading fallback. Its clock and agenda still receive the school-calendar data they need, so this is a panel-code reduction rather than removal of all calendar logic from Time Explorer.
- **Avoid repeated globe layout reads.** A `ResizeObserver`, window resize notifications, visibility changes and pixel-density checks trigger layout updates. Stable frames skip `clientWidth`/`clientHeight` reads. Browsers without `ResizeObserver` retain the prior per-frame fallback. The sun-position calculation also reuses its vector. Geometry, textures, antialiasing, pixel-density cap, lighting calculations and animation cadence remain unchanged.

The layout test verifies one width/height read across 60 stable frames, followed by correct size and pixel-density updates and observer cleanup. This reduces recurring main-thread work in both browser and Android WebView; no device frame-rate or battery improvement is claimed.

## Artwork fidelity

A trial lossless WebP conversion reduced 75 PNGs from 116,971,531 to 77,587,192 bytes. Pillow confirmed identical dimensions, RGBA values and ICC profiles. Chromium canvas comparison nevertheless found differences in partially transparent pixels between the two decoder paths; opaque pixels and alpha values matched in the sampled diagnostics. The conversion was discarded and every original image remains in use. The trial's image-size saving is **not** part of the delivered changes.

## Validation and remaining opportunities

- Full Vitest suite: 211 tests across 60 files passed.
- Changed TypeScript passed ESLint; production TypeScript/Vite builds passed.
- Android Capacitor sync, debug APK assembly and Java unit-test tasks succeeded.
- Pixel-identical login screenshots; original artwork retained. New coverage checks deferred initialization, cancellation, resize, pixel density and scene disposal.

The updated APK is built locally at `android/app/build/outputs/apk/debug/app-debug.apk`. It has not been installed on the connected phone or deployed. Native runtime performance and authenticated cold-start timings remain unmeasured; the configured emulator lacks its system image. A useful next measurement is a physical Android cold/warm/offline trace using the existing `msq:auth-ready`, `msq:saved-data-ready`, `msq:route-mounted` and `msq:globe-scene-ready` marks. That would establish whether session restoration, saved-data loading, or globe initialization deserves further work without reducing visual quality.
