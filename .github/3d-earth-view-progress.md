# 3D Earth View Progress

## Current State

- The Day-Night Explorer globe has already been migrated from the previous 2D globe path to a Three.js-backed canvas through `useSolarSystem3D.ts` and `SolarSystem3DManager.ts`.
- `SpinningPlanet.tsx` is now a thin presentation shell that renders the canvas and the focus-mode buttons without owning any rendering logic.
- `useDayNightExplorerModel.ts` builds the scene inputs from the selected date, live clock state, active focus, and calculation city, then pushes them into the 3D manager.
- The page integration is live in both `TimeExplorerPage.tsx` and `DayNightExplorer.tsx`, so the 3D Earth view is part of the real app path rather than a separate prototype.
- The previous D3 globe hook is no longer the active renderer path, which means the current implementation baseline is the Three.js scene, not the old globe model.

## What Works

- The renderer creates a complete scene with a sun, Earth, moon, star field, orbital line, ambient lighting, and a camera that interpolates between Earth-focus and solar-focus views.
- Earth rotation is driven from the explorer clock, Earth orbit is driven from year progress, and moon orbit is driven from a lunar-cycle approximation built from the active instant.
- The Earth sphere receives a generated map texture, and the scene adds a separate atmosphere shell to give the planet more depth in the close view.
- City markers are projected onto the globe from latitude and longitude and visually emphasize the currently active focus city.
- During clock dragging, the scene can be updated directly through `updateSceneState` so the planet motion stays responsive without waiting for a full React rerender.

## Known Gaps

- The computed `sunPosition` is passed into the 3D scene state but is not yet used to drive lighting direction, the terminator, or any physically correct day-night shading on the globe.
- The Earth texture pipeline still depends on fetching `/data/world-50m-2024.json` and loading `topojson` from a CDN at runtime, which keeps the feature dependent on network success and browser-side script injection.
- Focus selection still mixes two concerns: view-mode switching (`earth-focus` vs `solar-focus`) and city selection, so the interaction model is serviceable but not yet cleanly separated.
- The current orbit system is visually effective but intentionally stylized; ellipse size, moon path, and camera offsets are presentation-driven rather than astronomy-grade values.
- There are no user camera controls, no labeled cities, and no explicit loading or failure state for texture/data initialization beyond a console error.

## Next Steps

- Apply `sunPosition` to scene lighting so the rendered globe reflects the selected instant with a real solar direction and visible day-night boundary.
- Replace the runtime CDN dependency with bundled map-processing assets or a prebuilt Earth texture so the scene is self-contained and predictable in production.
- Separate display mode from focus target in the explorer state so switching between Earth and Solar views does not overload the same focus-selection path.
- Add scene-level UX polish such as loading feedback, graceful fallback when map data fails, and optional labels or halos for focus cities.
- Decide whether this feature should remain a stylized educational view or move toward higher-fidelity astronomy, because that choice should drive the next round of renderer and interaction work.
