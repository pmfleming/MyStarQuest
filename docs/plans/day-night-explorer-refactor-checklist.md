# Day-Night Explorer Refactor Checklist

## Goal

Reduce the size and complexity of `src/components/DayNightExplorer.tsx` by splitting it into smaller, easier-to-test units and removing duplicated rendering and helper logic.

The strongest separation points are:

- **Clock**: analog clock rendering, digital time display, hand dragging, stepper controls, time normalization.
- **Planet**: Planetary.js setup, script loading, pings, projection updates, night overlay rendering.
- **Calendar**: selected date, season, solar-times lookup, timezone-aware instant conversion, date-driven background selection.

Those three boundaries should drive the file layout so the main component becomes an orchestration layer instead of a monolith.

## Target Structure

Keep `src/components/DayNightExplorer.tsx` as the container that composes smaller parts.

Proposed files:

- `src/components/dayNightExplorer/ExplorerLocationSelector.tsx`
- `src/components/dayNightExplorer/ExplorerGlobe.tsx`
- `src/components/dayNightExplorer/ExplorerClockPanel.tsx`
- `src/components/dayNightExplorer/AnalogClockFace.tsx`
- `src/components/dayNightExplorer/DigitalClockDisplay.tsx`
- `src/components/dayNightExplorer/useExplorerClock.ts`
- `src/components/dayNightExplorer/usePlanetaryGlobe.ts`
- `src/components/dayNightExplorer/dayNightExplorer.constants.ts`
- `src/components/dayNightExplorer/dayNightExplorerBackdrop.ts`
- `src/components/dayNightExplorer/dayNightExplorerMath.ts`
- `src/components/dayNightExplorer/dayNightExplorerOptions.ts`

If the calendar/date concerns remain too spread out after that split, add one more helper module:

- `src/components/dayNightExplorer/dayNightExplorerCalendar.ts`

## Checklist

### 1. Extract static data and constants first

- Move clock sizing constants and geometry constants out of `DayNightExplorer.tsx`.
- Move `EXPLORER_CITY_OPTIONS`, `EXPLORER_FOCUS_OPTIONS`, and lookup helpers into `dayNightExplorerOptions.ts`.
- Keep these modules pure and free of React imports.
- Verify imports remain simple and there is no circular dependency back into `DayNightExplorer.tsx`.

### 2. Extract calendar/date-driven logic

- Move date-driven helpers into a dedicated module or clearly grouped utilities.
- Include season/background lookup concerns here if they are still mixed into the component.
- Keep these responsibilities together:
  - selected date interpretation
  - season derivation
  - solar-time lookup for the active calculation city
  - conversion between displayed clock values and absolute instants
  - timezone-aware relabeling of the same instant when the calculation city changes
- Aim for the container to ask for a prepared calendar/time view model instead of reassembling this inline.

### 3. Extract planet responsibilities

- Move script loading and Planetary.js lifecycle into `usePlanetaryGlobe.ts`.
- Move the canvas wrapper into `ExplorerGlobe.tsx`.
- Keep the planet boundary responsible for:
  - external script bootstrapping
  - planet creation and teardown
  - pings
  - render-scene application
  - night overlay drawing
  - canvas interactivity gating
- Ensure the planet layer receives precomputed render inputs as props instead of pulling app state directly.

### 4. Extract clock responsibilities

- Move drag refs, pointer math, throttled commits, and ticking behavior into `useExplorerClock.ts`.
- Move the analog face into `AnalogClockFace.tsx`.
- Move the digital readout into `DigitalClockDisplay.tsx`.
- Wrap the full lower control area in `ExplorerClockPanel.tsx`.
- Keep the clock boundary responsible for:
  - current displayed minutes/seconds
  - hand dragging
  - hand transforms or hand-angle output
  - stepper adjustments
  - digital readout formatting
- The container should only connect clock state to solar/calendar state.

### 5. Remove duplicated render structure

- Replace repeated absolute-positioned background image layers with a reusable helper component or a mapped layer renderer.
- Replace the three repeated clock-hand `<g>` blocks with a reusable `ClockHand` component or config-driven map.
- Replace repeated digital clock text spans with a smaller presentational component if that improves readability.
- Remove any repeated style objects that can be factored into helper functions without obscuring intent.

### 6. Reduce inline helper noise in the container

- Move pure geometry helpers into `dayNightExplorerMath.ts`.
- Move backdrop/color interpolation helpers into `dayNightExplorerBackdrop.ts`.
- Keep the container focused on orchestration, not math implementation details.
- Prefer named helper return objects over long sequences of one-off local constants when they belong to the same concern.

### 7. Reassess the remaining container

- After extraction, review `DayNightExplorer.tsx` and remove any remaining mixed-responsibility code.
- The final container should mainly do the following:
  - read theme and selected date context
  - derive active focus/calculation mode
  - derive solar/calendar inputs
  - wire clock outputs to calendar conversions
  - pass prepared props into selector, globe, and clock panel
- If the file still feels dense, the next split should be by concern, not by arbitrary JSX length.

## LOC Reduction Opportunities

- Collapse the repeated hand rendering into a config array plus a single reusable renderer.
- Collapse repeated backdrop layers into a declarative layer list.
- Move the inline `<style>` block into a scoped CSS file or a dedicated style helper.
- Centralize repeated sizing/style calculations in one constants module instead of recomputing them across render sections.
- Prefer small view-model builders when several derived values always travel together.

## Suggested Order Of Work

1. Extract constants and option data.
2. Extract pure math and backdrop helpers.
3. Extract the location selector and digital clock display.
4. Extract the analog clock and reusable hand renderer.
5. Extract `useExplorerClock`.
6. Extract `ExplorerGlobe` and `usePlanetaryGlobe`.
7. Review the remaining container and prune leftover duplication.

## Completion Criteria

- `src/components/DayNightExplorer.tsx` is substantially smaller and acts as a coordinator.
- Clock, planet, and calendar responsibilities are separated cleanly.
- Pure helpers are outside React component files.
- No behavior changes in time dragging, solar calculations, city switching, or globe rendering.
- Lint, targeted tests, and build still pass.
