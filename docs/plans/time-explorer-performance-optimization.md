# Plan: Time Explorer Performance Optimization

## Objective

Optimize the Time Explorer tab (Clock and Globe) to ensure smooth dragging (especially for hour hands) on Android devices. The goal is to achieve near-60 FPS visual updates during dragging by decoupling visual changes from React's render cycle.

## Analysis of Current Bottlenecks

1.  **Full Component Tree Re-renders**: Every clock drag (currently throttled to 15 FPS via `dragCommitIntervalMs`) triggers a full re-render of `TimeExplorerPage`, `Clock`, and `SpinningPlanet`. On Android, these React cycles often exceed the frame budget.
2.  **Synchronous Astronomical Calculations**: `sunPosition` and `renderScene` are recalculated within the React render path. While not extremely heavy, they add to the per-frame overhead.
3.  **Prop-to-Ref Sync Latency**: The Globe's `requestAnimationFrame` loop uses refs that are only updated when React re-renders. If React lags, the globe stutters even if the canvas loop is technically running.
4.  **Hour Hand Sensitivity**: Dragging the hour hand causes rapid changes in "minutes" (1 degree = 2 minutes), which triggers more frequent and visually significant updates to the globe and backdrop, magnifying any stutter.

## Optimization Strategies

### 1. Direct-to-DOM Updates (Bypassing React)

- **Clock Hands**: Continue using the existing ref-based `applyHandTransforms` in `useExplorerClock`.
- **Digital Clock**: Add refs for the digital clock's hour, minute, and second labels. Update their `textContent` directly during dragging.
- **Backdrop**: If feasible, update the backdrop container's background color directly via a ref.

### 2. Decouple Globe Updates from React

- Modify `usePlanetaryGlobe` to expose a "direct update" method or refs that can be modified outside of the React render cycle.
- Calculate "ephemeral" `sunPosition` and `renderScene` values inside the `pointermove` handler and push them directly to the Globe's render refs.

### 3. Throttled React State Commits

- Increase `dragCommitIntervalMs` during active dragging (e.g., to 250ms-500ms) or defer the `setMinutes` state update until `pointerup`.
- This ensures the heavy React tree only reconciles occasionally, while the visual elements (hands, labels, globe) update at the native refresh rate via direct DOM/Canvas manipulation.

### 4. Component Memoization

- Wrap `Clock`, `SpinningPlanet`, and `SchoolCalendar` in `React.memo`.
- Ensure that theme-related props are stable or handled via context to prevent unnecessary re-renders when only the time changes.

### 5. SVG Optimization

- Ensure the static parts of the clock face (numbers, ticks) are memoized and not re-generated.
- Check if `drop-shadow` filters on hands can be simplified or toggled off on low-power devices if performance remains an issue.

## Implementation Steps (Proposed)

1.  **Refactor `useExplorerClock`**:
    - Expose an `onUpdate` callback that fires on every `pointermove` (unthrottled).
    - Keep `setMinutes` throttled or deferred.
2.  **Enhance `useDayNightExplorerModel`**:
    - Implement the `onUpdate` callback to calculate ephemeral astronomical data.
    - Update digital clock refs and globe refs via this callback.
3.  **Update `Clock.tsx`**:
    - Add `RefObjects` for digital labels.
    - Apply `React.memo`.
4.  **Update `SpinningPlanet.tsx`**:
    - Apply `React.memo`.
5.  **Adjust Constants**:
    - Tune `dragCommitIntervalMs` specifically for mobile vs. desktop if needed.

## Success Criteria

- Hour hand dragging feels fluid on mid-range Android devices.
- Globe rotation and digital clock updates appear synchronized and stutter-free.
- React DevTools "Highlight updates" shows minimal activity during active dragging.
