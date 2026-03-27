# Day-Night Explorer: Clock, Calendar, and Earth

This note is the source of truth for how the Day-Night Explorer is supposed to work conceptually after the refactor.

## Core Model

The explorer combines three separate concerns:

- **Clock**: the user-controlled local time being displayed.
- **Calendar**: the selected date that determines season, solar declination, DST offsets, and sunrise/day/sunset timing.
- **Earth**: the globe presentation that visualizes either a sun-centered or city-centered view.

These concerns interact, but they should not be collapsed into one piece of state.

## 1. Clock

The clock is the displayed local civil time for the active calculation city.

Responsibilities:

- hold the currently displayed minutes and seconds
- support hand dragging and stepper adjustments
- keep ticking forward every second when not being dragged
- re-label the same absolute instant when the calculation city changes

Important rule:

- The clock is not the source of truth for the sun's position by itself. It becomes meaningful only when combined with the selected calendar date and the active calculation city.

## 2. Calendar

The calendar provides the selected date.

Responsibilities:

- determine the active day of year
- determine season-based visuals
- determine DST-sensitive timezone offset rules for the selected city and date
- provide the date used to build the observer-local instant for solar calculations

Important rule:

- The selected date is global app state. The Day-Night Explorer consumes it; it should not own an isolated date model.

## 3. Earth / Globe Presentation

The globe is only a visualization layer.

Responsibilities:

- render the earth projection
- draw the moving terminator overlay using the current subsolar position
- show pings for supported cities
- support presentation mode changes between Sun view and city view

Important rule:

- The globe does not decide solar physics. It consumes already-derived render inputs.

## 4. Absolute Instant Construction

The explorer should always derive the sun from an absolute instant.

That instant is built from:

- selected calendar date
- current displayed clock minutes and seconds
- active calculation city timezone

This is why the calendar and clock must stay separate in code: the displayed clock time alone is ambiguous without a date and timezone.

## 5. Calculation City vs Focus City

The explorer uses two related but different location concepts.

### Calculation city

The calculation city drives:

- local displayed time
- sunrise/day/sunset phase boundaries
- DST-aware timezone conversion
- the observer-local instant used for solar calculations

### Focus city

The focus city drives:

- where the globe is visually centered in city mode
- which city the user is currently exploring spatially

Important rule:

- Returning to Sun mode should change presentation mode only. It should not discard the last selected calculation city.

## 6. Sun Mode vs City Mode

### Sun mode

- render mode: `rotating-earth`
- the earth rotates under the current subsolar point
- the current calculation city still determines local time and solar phase calculations

### City mode

- render mode: `moving-terminator`
- the globe stays centered on the chosen city
- the terminator moves as the clock changes
- choosing a city also makes it the active calculation city

Important rule:

- In city mode, moving the clock must visibly move the terminator. If the terminator appears frozen, the globe redraw path is wrong.

## 7. Solar Data Flow

The intended data flow is:

1. Read selected date from `SelectedDateContext`.
2. Read displayed clock time from the explorer clock hook.
3. Read active calculation city from explorer state.
4. Build the observer-local instant.
5. Compute `getSunPosition(instant)`.
6. Compute `useSolarTimes(calculationLocation)` for phase boundaries.
7. Convert those results into globe render inputs with `getExplorerRenderScene(...)`.
8. Let the Planetary.js layer render the latest scene.

## 8. Folder Responsibilities

Current intended separation:

- `src/components/DayNightExplorer.tsx`: orchestration only
- `src/components/dayNightExplorer/*`: UI pieces and explorer-specific hooks
- `src/data/dayNightExplorer/*`: explorer support data, math, options, backdrop logic, and calendar helpers
- `src/lib/solar.ts`: solar physics and timezone-aware observer time helpers

Important rule:

- Solar physics belongs in `src/lib/solar.ts`. Explorer-specific derivation and presentation helpers belong in the explorer support modules, not in the main component.

## 9. Guardrails For Future Changes

- Do not mix observer location, focus location, and subsolar position into a single variable.
- Do not compute expensive solar math inside the Planetary `onDraw` callback.
- Do not let the globe layer become the source of truth for time or date.
- Do not reintroduce hardcoded Amsterdam-specific logic into generic helpers.
- When changing explorer behavior, preserve the clock/calendar/earth separation unless there is a strong reason to redesign the model.
