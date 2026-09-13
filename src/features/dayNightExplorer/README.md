# Day/night explorer

The clock, scene manager, texture worker, and their calculations live together here. Pages consume `useDayNightExplorerModel`, `Clock`, and `SpinningPlanet`; weather also shares the city options. General solar and season calculations remain in `src/lib`.

- `useExplorerClock` owns the timer, pointer listeners, and pending drag frame. `commitExplorerTime` normalizes and commits adjustments, synchronization, and dragging. Pointer release flushes the final queued position before committing.
- `useSolarSystem3D` owns one `SolarSystem3DManager` per mounted canvas. The manager owns its animation frame, visibility listener, intersection observer, renderer, geometries, materials, and GPU textures. Disposal is idempotent and subsequent updates are ignored.
- `earthTextureCache` owns the shared pixel build for the application session. A scene unmount intentionally does not cancel that shared build. Its worker is terminated on success, failure, or timeout; disposed scenes cannot upload late results.

Regression coverage: `dayNightPerformance.test.tsx`, `SolarSystem3DManager.test.ts`, `earthTextureCache.test.ts`, and `disposeSceneObject.test.ts`.
