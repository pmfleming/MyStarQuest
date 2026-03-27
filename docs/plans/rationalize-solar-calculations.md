# Rationalize Solar Calculations & Terminator Visualization

## Background & Motivation

Currently, `src/lib/solar.ts` contains precise astronomical formulas (including Equation of Time and Zenith calculations) to compute sunrise and sunset. However, `src/components/DayNightExplorer.tsx` computes the terminator line using a simplified model—rotating the globe at a constant rate based on a 12:00 PM local time assumption, without accounting for the Equation of Time. It also relies on hardcoded Amsterdam coordinates that slightly differ from the library defaults.

## Scope & Impact

This plan synchronizes the 3D globe visualization with the precise astronomical calculations, establishing a single source of truth for the sun's position. This ensures accurate alignment of the terminator with the declared daylight phases. It also refactors the solar functions to readily support any observer location in the future, moving away from Amsterdam-specific function name.

The current product behavior should continue to default to Amsterdam. The refactor should introduce location-aware APIs now so a future location selector can be added without reworking the solar core again.

## Proposed Solution

### 1. Refactor `src/lib/solar.ts` for Shared Core Math

- **Introduce a shared location model:** Export a `SolarLocation` type and `DEFAULT_LOCATION` containing Amsterdam values: `latitude: 52.3676`, `longitude: 4.9041`, `timeZone: 'Europe/Amsterdam'`. Keep Amsterdam as the default behavior everywhere for now, but route all solar APIs through this shared type so a future location picker can be added cleanly.
- **Unify Declination Math:** Refactor `getSolarDeclinationDegrees` to use the more accurate Spencer formula currently embedded in `getSolarDeclinationRadians`. This ensures both the terminator angle and sunrise/sunset times use the precise same seasonal tilt.
- **Shared Equation of Time:** Ensure that the underlying `getEquationOfTimeMinutes` is identically applied to both the time calculations and the new position calculations.
- **Rename** `getAmsterdamSolarTimes` to `getSolarTimes`.
- **Clarify phase semantics:** Keep the current UI concept where sunrise and sunset are teaching periods rather than single instants. Either preserve the current naming with explicit documentation, or rename the boundary fields to better reflect twilight-window semantics while preserving the current user-facing behavior.
- **Add `getSunPosition(date: Date)`**: Implement a function that calculates the exact geographical subsolar point at any given UTC time, explicitly reusing the shared declination and equation of time functions mentioned above.
- **Add a time-construction helper:** Introduce a helper that builds the correct instant for a selected calendar day and clock minutes in the observer location's time zone. Avoid relying on the browser-local time zone when constructing the date passed into solar calculations.
- **Keep astronomy independent from rendering mode:** The solar module should expose physical values only, such as phase boundaries and subsolar latitude/longitude. It should not encode whether the globe rotates under a fixed sun or the globe remains fixed while the terminator moves.

### 2. Update Context `src/contexts/SelectedDateContext.tsx`

- **Rename hook**: Rename `useSelectedDateSolarTimes` to `useSolarTimes` and update its underlying implementation to call the renamed `getSolarTimes`.
- **Location parameters**: Ensure `useSolarTimes` accepts an optional `SolarLocation` parameter, falling back to `DEFAULT_LOCATION`.
- **Preserve Amsterdam defaulting**: Do not introduce any user-facing location switching yet. The hook should simply make the future extension path straightforward.

### 3. Synchronize `src/components/DayNightExplorer.tsx`

- **Use Common Functions (`getSunPosition`)**: Remove the independent simplified local math (`degreesRotated = currentMinutes - 720`). Build the current observer instant using the shared time-construction helper and pass it to `getSunPosition`.
- **Keep observer location separate from sun position**: Replace hardcoded Amsterdam coordinates with `DEFAULT_LOCATION`, but treat the observer location and the subsolar point as distinct concepts. The observer location should still drive the default teaching viewpoint, while the subsolar point should drive the terminator orientation.
- **Prepare for two render modes**: Structure the globe code so it can later support either of these presentation modes without changing solar math:
  - earth rotates under a fixed sun
  - earth remains fixed while the terminator moves
- **Avoid heavy work inside `onDraw`**: Compute the current sun position only when the selected date, displayed time, or location changes. Cache the latest result in component state or a ref, and let `onDraw` consume the cached values so dragging the clock stays responsive.

## Implementation Plan

1. Update `solar.ts` with `SolarLocation`, `DEFAULT_LOCATION`, the renamed `getSolarTimes`, the time-construction helper, and `getSunPosition`. Keep Amsterdam as the implicit default location.
2. Update unit tests in `tests/unit/lib/solar.test.ts` to reflect renamed functions, preserve the existing twilight-window behavior, and add concrete regression tests for `getSunPosition` and time-zone-sensitive dates.
3. Apply the renamed `useSolarTimes` in `SelectedDateContext.tsx`, accepting an optional location parameter while still defaulting to Amsterdam.
4. Refactor `DayNightExplorer.tsx` to use cached outputs from the shared solar helpers rather than computing simplified sun motion inside the draw loop.
5. Separate rendering concerns so the explorer can later support either rotating-earth mode or moving-terminator mode without changing the solar library API.

## Verification

- Run existing and new unit tests for `solar.ts`.
- Open the application and view the Time Explorer. Ensure the clock UI correctly colors the daytime phases based on `getSolarTimes`.
- Verify the 3D Globe renders the terminator properly at solar noon, with the subsolar point aligned with the expected longitude for the Amsterdam default location and date.
- Verify that toggling between Summer and Winter dates visually shifts the terminator tilt correctly on the globe.
- Verify that dragging the clock still feels responsive after the refactor and that solar calculations are not being recomputed every animation frame.
- Add at least one verification case around a DST transition date to confirm the selected day and clock time map to the correct observer instant.
