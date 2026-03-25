# Day/Night Explorer Date Awareness Plan

## Goal

Make the selected calendar date a global app concept so multiple components can become date-aware over time, starting with the Day/Night Explorer globe.

The immediate product goal is:

- A new session starts with the selected date set to today.
- The school calendar can change that selected date.
- The Day/Night Explorer uses the selected date to adjust the terminator tilt through the year based on seasonal solar declination.

## Why This Change

The current implementation has two separate limitations:

1. The chosen day is owned by the calendar UI instead of the app.
2. The globe shading responds to time of day, but not to the date, so the terminator does not tilt differently for equinoxes and solstices.

Moving date selection into shared app state fixes the first issue and creates the right foundation for the second.

## Proposed Architecture

### 1. Add a Global Selected Date Context

Create a new context under `src/contexts`, following the same shape as the existing shared app contexts.

Suggested API:

```ts
type SelectedDateContextValue = {
  selectedDateKey: string
  selectedDate: Date
  setSelectedDateKey: (dateKey: string) => void
  setSelectedDate: (date: Date) => void
  resetSelectedDate: () => void
}
```

Notes:

- Use `YYYY-MM-DD` as the canonical stored value.
- Derive `Date` objects from the date key instead of storing a mutable `Date` as the source of truth.
- Initialize the context to today at provider startup.
- Do not restore an old date across sessions unless we intentionally change that product decision later.

### 2. Mount the Provider at App Level

Wrap the app in the new provider inside `src/App.tsx`, alongside:

- `AuthProvider`
- `ThemeProvider`
- `ActiveChildProvider`

This avoids prop drilling and makes future date-aware components straightforward to build.

### 3. Refactor the School Calendar to Use the Shared Date

Update `src/components/SchoolCalendar.tsx` so it:

- Reads the currently selected date from context.
- Writes the selected date to context when a day is clicked.
- Keeps a distinct visual treatment for:
  - today
  - selected date
- Aligns the visible month with the selected date when appropriate.

This turns the calendar into one consumer and producer of global date state instead of the owner of it.

### 4. Refactor the Day/Night Explorer to Consume the Shared Date

Update `src/components/DayNightExplorer.tsx` so it:

- Reads the selected date from context.
- Combines that selected date with the explorer's current time-of-day control.
- Uses the resulting datetime input for sun-position math.

The component should no longer assume that the system date is the active date context.

## Terminator / Astronomy Work

### 5. Add a Small Solar Geometry Helper

Create a pure helper in `src/lib` for the astronomy inputs needed by the globe.

Minimum responsibility:

- Convert selected date plus explorer time into a datetime input.
- Compute solar declination for that datetime.
- Provide the orientation inputs needed to render the day/night boundary correctly.

This helper should stay pure and testable.

### 6. Replace the Fixed Globe Night Gradient

The current globe shading is effectively an east-west gradient that moves with time but does not tilt seasonally.

Replace that logic with date-aware shading driven by the computed solar geometry so that:

- Equinox dates produce a near-vertical terminator.
- June solstice tilts one direction.
- December solstice tilts the opposite direction.

The exact rendering approach can remain approximate as long as it is visually correct and stable.

## Data and Time Handling

### 7. Standardize Date Conversion Utilities

Add or extend helpers for:

- `Date -> dateKey`
- `dateKey -> Date`
- constructing a safe local datetime from:
  - selected date
  - selected minutes/seconds in the explorer

This is important to avoid timezone drift between calendar UI logic and globe math.

Recommended rule:

- Keep `dateKey` as the canonical app value.
- Create `Date` instances only at the edges where formatting or calculations require them.

## Verification Plan

### 8. Test the Pure Logic

Add focused tests for:

- selected date helper behavior
- date key conversion
- solar declination helper outputs around:
  - March equinox
  - June solstice
  - September equinox
  - December solstice

The goal is not astronomical perfection, but confidence that the seasonal direction and relative magnitude are correct.

### 9. Manual UI Verification

Check the following flows in the app:

1. Open a new session and confirm the selected date starts as today.
2. Click another day in the calendar and confirm the selection updates.
3. Confirm the selected date is visibly distinct from today.
4. Confirm the globe changes when moving between equinox and solstice dates.
5. Confirm the time controls still move the sun/day-night boundary through the day.

## Implementation Order

1. Add `SelectedDateContext`.
2. Mount the provider in `App.tsx`.
3. Refactor `SchoolCalendar` to use and update the shared date.
4. Refactor `DayNightExplorer` to consume the shared date.
5. Add the solar geometry helper.
6. Replace the globe shading logic with date-aware terminator rendering.
7. Add tests for pure helpers.
8. Run manual verification in the Time Explorer page.

## Non-Goals for This Pass

- Cross-session restoration of a previously selected date.
- Making every existing component date-aware immediately.
- High-precision astronomy beyond what is needed for a believable and correct seasonal terminator tilt.
