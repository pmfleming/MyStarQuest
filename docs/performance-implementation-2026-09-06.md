Performance implementation — 6 September 2026

All six selected opportunities from the performance review are implemented. Each stage has its own local Git commit on `main`. An additional validation fix preserves fallback texture filtering and disposes the shared sprite quad at full scene teardown. No asset files, dimensions, map data, texture resolution, or displayed artwork sizes changed.

| Stage | Implementation                                                                                                                                                                                               | Validation                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Navigate immediately after successful authentication; remove the 900 ms pause.                                                                                                                               | TypeScript and ESLint passed.                                                                                                                                                             |
| 2     | Import the login screen with the entry bundle. Keep authenticated pages, activities, and Firestore deferred.                                                                                                 | Production manifest and three cold browser runs confirmed the late login loading stage is gone.                                                                                           |
| 3     | Share one in-flight Earth build and one 8 MiB pixel buffer per application session. Retry failed builds; retain the worker path and idle fallback.                                                           | Concurrent/repeated loads, worker failure/timeout, fallback resolution, and retry tests passed. Browser globe revisits made only one map request.                                         |
| 4     | Dispose meshes, points, lines, label materials, and owned textures. Deduplicate shared resources; retain the shared sprite quad during label rebuilds and release it on final teardown.                      | Resource disposal, label replacement, repeated cleanup, and unmount-before-texture-ready tests passed. Browser geometry counts returned to zero after teardown.                           |
| 5     | Load the first list overview eagerly; keep later overviews lazy. Preload/decode the next animal and its clues at low fetch priority, with at most eight retained images.                                     | First/later card policy, bounded preload retention, retry, next-round preload, and existing activity tests passed.                                                                        |
| 6     | Keep default Animals available immediately; import Insects and Teeniepings only on selection. Cache successful collections and share pending requests. Show loading/retry states and ignore stale responses. | Existing collection modes plus cold loading, rapid switching, retries, starting play while loading, and shared request tests passed. Browser requests confirmed selection-driven loading. |

**Observed results**

The login lab used the production build in Chromium, 4× CPU throttling, 150 ms network latency, 200,000 bytes/second download throughput, a 390 × 844 viewport, and gzip for text resources. First contentful paint after stage 2 was 1,540 / 1,520 / 1,516 ms, with a median of 1,520 ms. The review's single baseline run was 2,236 ms. This is a local directional comparison, not a production percentile or measured Android startup time.

The main AnimalTester chunk decreased from approximately 156.2 kB / 43.9 kB gzip in the review to 86.4 kB / 25.2 kB gzip. Insects is a separate 23.9 kB / 7.2 kB gzip chunk; Teeniepings is 47.7 kB / 12.5 kB gzip. The final production manifest confirms neither optional collection is in AnimalTester's static dependency graph. These figures describe individual JavaScript chunks; shared application dependencies and image transfers are additional.

A temporary local browser harness rendered and navigated Animals, Insects, and Teeniepings and mounted/disposed the globe three times in both Earth and solar views. Optional collection requests were absent initially and appeared only after selection. There were no page errors. Across three solar-view visits the world map was fetched once, and renderer geometry counts were 21 while rendering and zero after each teardown. The reported texture count after teardown was a stable one; it is not a claim that browser/GPU memory reaches zero. The one CPU-side Earth pixel buffer is intentionally retained for the session.

**Final checks**

- `npm test`: 35 suites, 94 tests passed.
- `npm run build -- --manifest`: passed; the existing large vendor chunk warning remains.
- `npx cap sync android`: passed; the final web build is copied into the Android project.
- ESLint on changed files: passed. Repository-wide lint with `tmp/**` and `output/**` excluded: zero errors, eight existing Fast Refresh warnings in `presetChoreRenderers.tsx`.
- Plain `npm run lint` encounters unrelated nested checkout configurations under the already Git-ignored `tmp/` directory. No application lint errors were found when those scratch directories were excluded.
- Git comparison against the pre-implementation revision found no asset or map-data changes.

No deployment, remote Git push, APK installation, physical-device profiling, or authenticated production-data test was performed. The temporary browser harness is in the ignored `tmp/performance-browser/` directory; its Node script closes the browser and local Vite server when finished.
