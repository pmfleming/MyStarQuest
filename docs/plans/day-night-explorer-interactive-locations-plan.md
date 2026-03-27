# Plan: Day-Night Explorer Interactive Locations

This plan adds interactive location buttons to `DayNightExplorer` so the user can switch between a Sun-centered rotating-earth view and city-centered moving-terminator views for Amsterdam, Dublin, and Taipei.

The selected city should also become the basis for solar calculations such as sunrise, day, sunset, and night. Returning to Sun mode should change only the globe presentation mode, not the active calculation city.

This feature also supports teaching time zones. When the user chooses a different city, the displayed clock time should shift by the appropriate number of hours for that city. Because Taipei does not observe summer time while Amsterdam and Dublin do, the hour difference must change correctly between summer and winter dates.

The current codebase already contains:

- a render-mode abstraction in `DayNightExplorer`
- city ping data for Amsterdam, Dublin, and Taipei
- city SVG assets in `src/assets/cities`

This work should build on those existing pieces rather than introducing duplicate coordinate definitions or drifting sources of truth.

## 1. Product Behavior

- **Sun view**:
  - Uses `rotating-earth` mode.
  - Keeps the current behavior where the earth rotates under the subsolar point.
  - Remains the default initial presentation mode.
  - Continues using the last selected city as the basis for solar calculations.
- **City views**:
  - Use `moving-terminator` mode.
  - Keep the globe visually centered on the selected city.
  - Allow the terminator to move relative to that fixed globe view.
  - Make the selected city the active basis for solar calculations.
- **Solar phase semantics**:
  - The active calculation city should drive solar calculations and clock phase coloring.
  - Selecting Amsterdam, Dublin, or Taipei should update sunrise/day/sunset timing to that city.
  - Switching back to Sun mode should preserve the most recently selected city for those calculations.
- **Time-zone teaching behavior**:
  - Selecting a city should also update the displayed clock to that city's local time.
  - The hour offset should be derived from real time-zone rules for the selected date, not from a hardcoded difference.
  - Seasonal daylight saving time differences must be respected.
  - Taipei should remain on its fixed local offset all year, while Amsterdam and Dublin may shift between summer and winter offsets.
- **Session default**:
  - A new session should begin with Amsterdam as the active calculation city.
  - A new session should begin in Sun mode.

## 2. State Model

Use two pieces of state because presentation mode and calculation city now have separate responsibilities:

- **`activeFocusId`**: `'sun' | 'amsterdam' | 'dublin' | 'taipei'`
- **`activeCalculationCityId`**: `'amsterdam' | 'dublin' | 'taipei'`

Derive the rest from those values instead of storing additional overlapping state:

- `renderMode = activeFocusId === 'sun' ? 'rotating-earth' : 'moving-terminator'`
- `viewLocation = activeFocusId === 'sun' ? activeCalculationCity location : selected city location`
- `calculationLocation = activeCalculationCity location`

Rules:

- Clicking a city button updates both `activeFocusId` and `activeCalculationCityId` to that city.
- Clicking the Sun button updates only `activeFocusId` to `'sun'`.
- The last chosen city remains the calculation basis until another city is explicitly selected.
- Initial state should be `activeFocusId = 'sun'` and `activeCalculationCityId = 'amsterdam'`.

## 3. Shared Data Structure

Replace ad hoc city definitions with a shared descriptor list that drives both the buttons and the globe pings.

Each descriptor should include:

- `id`
- `label`
- `icon`
- `location` with `latitude` and `longitude`
- existing ping styling such as `color`, `angle`, `ttl`, and `strokeWidth`

Recommended entries:

- `sun`
- `amsterdam`
- `dublin`
- `taipei`

Amsterdam should continue using `DEFAULT_LOCATION` so the solar default and the city button cannot drift apart.

## 4. Interaction Components

Add a location selector beside the globe using the existing icon assets in `src/assets/cities`:

- `sun.svg`
- `amsterdam.svg`
- `dublin.svg`
- `taipei.svg`

Interaction styling should match the motion language of `BottomNav.tsx` rather than copying it mechanically:

- **Active state**: `scale(1.15)`, `opacity: 1`, `drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))`
- **Inactive state**: `scale(1)`, `opacity: 0.6`
- **Transitions**: `transform 200ms ease, opacity 200ms ease`

Accessibility requirements:

- Each button should be a real `<button>` element.
- Add a meaningful `aria-label`.
- Use `aria-pressed` or another explicit active-state signal.

## 5. Layout Strategy

The current explorer is a centered single-column layout. The location selector should fit that structure without making the globe feel off-center.

Recommended responsive behavior:

- **Wider layouts**: place the selector vertically to the left of the globe.
- **Narrower layouts**: collapse to a horizontal row above or below the globe.

Goals:

- keep the globe visually centered
- preserve large tap targets
- avoid squeezing the globe on narrow widths

## 6. Globe Logic Updates

Promote the existing render-mode abstraction from a constant to UI-driven derived state.

### `renderMode`

- Replace the hardcoded `DEFAULT_RENDER_MODE` usage with the mode derived from `activeFocusId`.

### `getExplorerRenderScene`

- Keep this function as the central rendering adapter.
- In `rotating-earth` mode:
  - keep the current sun-centered globe behavior.
  - use the active calculation city as the observer basis for time and phase calculations.
- In `moving-terminator` mode:
  - derive `viewLongitude` and `viewLatitude` from the selected city.
  - derive `overlayCenterLongitude` and `overlayCenterLatitude` from the selected city-centered view.

### Observer vs sun position

- Keep the calculation city as the observer basis for solar calculations.
- Keep the focus city as the view target when a city button is selected.
- In Sun mode, use the active calculation city as the observer basis while retaining sun-centered presentation.
- Keep `getSunPosition(...)` as the source of the actual subsolar point.
- Do not conflate selected city coordinates with the physical sun position.

### Solar calculations

- Feed `activeCalculationCityId` into the `useSolarTimes(...)` location parameter.
- Feed `activeCalculationCityId` into any helper that constructs observer-local instants.
- Ensure the clock background phases, sunrise/day/sunset timing, and other derived day/night visuals follow the active calculation city.

### Time-zone conversion

- Feed `activeCalculationCityId` into the displayed clock-time calculation as well as the solar calculations.
- Derive local time from the selected city's IANA time zone for the selected date.
- Do not treat city switching as a simple fixed-hour offset.
- Ensure date-sensitive offsets are respected so summer and winter behavior remains correct.
- In particular, verify that Taipei's offset remains stable across seasons while Amsterdam and Dublin may change.

## 7. Drag Behavior Decision

This needs to be explicit before implementation.

Recommended choice for the first version:

- **Sun mode**: preserve the current drag behavior.
- **City mode**: disable manual globe drag so the selected city remains stably centered.

Reasoning:

- the render loop already reapplies projection rotation every frame
- a stationary city-centered globe is easier to understand if drag does not fight the selected focus
- this avoids ambiguous behavior about whether drag should temporarily offset or permanently redefine the chosen location

If a later version wants draggable city views, that should be treated as a separate interaction design task.

## 8. Performance Constraints

Keep the current solar-performance approach intact:

- continue computing sun position outside `onDraw`
- continue caching the latest render scene in refs or memoized values
- keep button clicks limited to light state updates

Do not introduce per-frame recalculation of location-specific solar math.

## 9. Implementation Steps

1. **Define shared focus descriptors**: Create a single descriptor list for `sun`, `amsterdam`, `dublin`, and `taipei`, using existing SVG assets and shared location data.
2. **Add focus and calculation state**: Introduce `activeFocusId` and `activeCalculationCityId` with initial values of `sun` and `amsterdam`.
3. **Derive render mode, view location, and calculation location**: Compute them from the two source-of-truth state values.
4. **Build the location selector UI**: Render responsive buttons using the shared descriptors and the existing active/inactive motion language.
5. **Refactor the globe container layout**: Add the selector beside or around the globe while preserving centered composition on all screen sizes.
6. **Wire the existing render abstraction**: Feed the derived render mode and selected view city into `getExplorerRenderScene(...)`.
7. **Wire solar calculations**: Feed `activeCalculationCityId` into `useSolarTimes(...)`, observer-local time construction, and other phase-dependent explorer visuals.
8. **Wire displayed time-zone shifts**: Update the displayed clock and any related time labels so city selection uses the selected city's local time for the selected date, including DST-aware seasonal offset changes.
9. **Lock down drag behavior**: Disable or gate drag in `moving-terminator` mode so city-centered views remain stable.
10. **Verify interaction behavior**: Confirm that focus switching updates globe behavior, solar timing, and displayed clock time correctly.

## 10. Verification

- Verify that `sun` starts selected by default.
- Verify that Amsterdam is the default calculation city at session start.
- Verify that selecting `sun` restores `rotating-earth` behavior.
- Verify that selecting Amsterdam, Dublin, or Taipei switches to `moving-terminator` mode, centers the globe on that city, and makes that city the basis for solar calculations.
- Verify that returning to Sun mode preserves the last selected calculation city.
- Verify that sunrise/day/sunset coloring changes when switching among Amsterdam, Dublin, and Taipei.
- Verify that the displayed clock time shifts appropriately when changing cities.
- Verify that Amsterdam, Dublin, and Taipei show the correct relative hour differences for the selected date.
- Verify that those hour differences change correctly between summer and winter dates.
- Verify specifically that Taipei does not apply summer-time shifts while Amsterdam and Dublin do when appropriate.
- Verify that the active button styling updates correctly and remains stable while the clock continues ticking.
- Verify that clock dragging does not reset the selected focus.
- Verify that clock dragging in Sun mode still reflects the active calculation city rather than snapping back to Amsterdam.
- Verify that city mode disables or otherwise clearly constrains globe drag according to the chosen interaction rule.
- Verify that the globe remains centered and usable on narrow widths.
- Verify that solar calculations are still cached outside `onDraw` and that responsiveness remains good during clock dragging.
