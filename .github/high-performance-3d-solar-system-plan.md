# Plan: Unified 3D Planetary & Solar System Integration

This plan describes how to evolve the Time Explorer from the current D3/Canvas globe into a unified planetary experience that supports both a close-up Earth view and a broader solar-system view without tying the product architecture to a single rendering technology too early.

## 1. Goal

Build one shared planetary experience with two presentation modes:

- **Earth Focus**: close-up globe for local time, day/night boundary, seasons, and city context
- **Solar Focus**: zoomed-out view showing the Sun, Earth, and Moon in one coordinated scene

The key requirement is that astronomy, time, and interaction state remain correct regardless of renderer.

### 1.1 Non-Negotiable Parity Requirement

The revised Earth view must retain all current Earth Explorer functionality before Solar Focus becomes the default experience.

The 3D rewrite is successful only if Earth Focus preserves:

- selected-date awareness
- DST-aware local time behavior per calculation city
- clock dragging, ticking, and time-step adjustments
- Sun mode and city mode semantics
- last-selected calculation city behavior when returning to Sun mode
- date-aware terminator movement
- city markers and city switching
- clock/background/day-phase synchronization
- responsive visual updates during dragging

The new Sun / solar-system view is an addition after Earth parity, not a reason to regress Earth behavior.

## 2. Recommended Render Path

### 2.1 Recommendation

Use a **renderer-agnostic scene model** with a **Three.js / WebGL implementation first**.

That is the recommended path because it gives the project:

- the lowest rewrite risk relative to the current web-first stack
- a practical route to a true 3D globe and camera transitions
- good tooling and mature integration in the browser and Capacitor
- a clean upgrade path if a future renderer needs to change

### 2.2 Why not make WebGPU the default now

Do not make `WebGPU` the primary implementation target for the first version.

Reasons:

- browser/platform availability is still less universal than the current WebGL path
- it adds shader and pipeline complexity before the product contract is stable
- this feature does not yet require the extra rendering headroom badly enough to justify the platform risk

WebGPU can remain a future optimization or second renderer once the scene contract is stable.

### 2.3 Why not pivot to React Native / Skia now

Do not use `React Native` or `React Native Skia` as the implementation path for this feature.

Reasons:

- this repo is currently web-first and Capacitor-based
- changing to React Native would be a presentation-platform rewrite, not just a rendering upgrade
- React Native Skia is only attractive if the product intentionally becomes native-first

That is a separate product decision and should not be bundled into this planetary work.

## 3. Architecture

### 3.1 Core Rule

The architecture must be:

`time/date model -> astronomy model -> scene model -> renderer adapter`

Not:

`UI -> Three.js scene logic -> astronomy`

### 3.2 Shared Layers

#### A. Time Model

Own the canonical inputs:

- `selectedDateKey`
- `displayedClockMinutes`
- `displayedClockSeconds`
- `calculationLocation`
- `instantUTC`

This layer must define how date, local time, time zone, and DST rules combine into a real instant.

#### B. Astronomy Model

Expose pure derived values only:

- subsolar latitude/longitude
- observer-local solar phase boundaries
- Earth axial tilt orientation
- Earth orbital progress through the year
- Moon orbital phase and relative position if needed

This layer must stay independent from rendering mode.

#### C. Scene Model

Convert astronomy into renderer-ready scene state:

- Earth rotation
- Earth axial tilt
- Sun position relative to Earth
- Moon position relative to Earth
- city marker positions
- camera target and zoom target
- current display mode: `EARTH_FOCUS | SOLAR_FOCUS`

This is the contract every renderer consumes.

#### D. Renderer Adapter

The renderer owns:

- meshes or draw primitives
- textures and materials
- lighting setup
- camera interpolation
- gesture handling specific to the renderer

The renderer must not become the source of truth for date, time, or solar math.

## 4. Renderer Strategy

### 4.1 Phase 1 Renderer

Implement the first renderer with **Three.js on WebGL**.

Use it for:

- Earth sphere
- Sun light source or sun proxy
- Moon mesh
- atmosphere shell
- day/night texture blending
- camera transitions between Earth Focus and Solar Focus

### 4.2 Fallback Strategy

Keep the current D3/Canvas explorer available until the new Earth Focus renderer reaches feature parity on:

- date-aware terminator
- city markers
- clock synchronization
- interaction responsiveness
- selected-date and DST-sensitive calculation behavior
- Sun mode vs city mode behavior

Do not replace the current explorer until the new renderer passes those checks.

### 4.3 Future Renderer Options

If the product later needs heavier shader effects or many more dynamic scene elements:

- evaluate `WebGPU` as a second renderer backend
- do not revisit `React Native` or `Skia` unless the entire app strategy changes to native-first

## 5. Product Behavior

### 5.1 Earth Focus

- Earth fills most of the viewport
- rotation reflects the active instant
- terminator reflects the true subsolar point
- axial tilt reflects the selected date
- city markers remain visible when appropriate
- interaction prioritizes globe understanding over free camera motion

### 5.2 Solar Focus

- camera pulls back to show Sun, Earth, and Moon in one scene
- Earth remains visually linked to the same time/date state used in Earth Focus
- the orbit view may be stylized for readability, but that must be explicit

### 5.3 Educational Accuracy vs Stylization

Keep these physically or educationally accurate:

- Earth rotation driven by time
- axial tilt direction
- subsolar point / terminator orientation
- local time and time-zone behavior
- seasonal progression through the year

These may be stylized for readability:

- orbital scale
- Moon orbit scale
- camera distance
- label placement
- orbit shape if needed for screen composition

If a stylized choice is used, document it in code comments and plan notes so it is not mistaken for astronomy.

## 6. Technical Plan

### 6.0 Reuse Review

Most of the current explorer should be reused above the renderer layer.

#### Reuse with little or no change

- `src/contexts/SelectedDateContext.tsx`
- `src/lib/solar.ts`
- `src/lib/seasons.ts`
- `src/lib/dayNightExplorer/dayNightExplorerCalendar.ts`
- `src/lib/dayNightExplorer/dayNightExplorerBackdrop.ts`
- `src/lib/dayNightExplorer/dayNightExplorerOptions.ts`
- `src/components/dayNightExplorer/useExplorerClock.ts`
- clock UI and related clock assets

These modules already represent the app's real product behavior:

- selected date ownership
- timezone-aware instant construction
- solar-time calculations
- city/focus selection semantics
- clock interaction model
- backdrop and phase behavior

They should remain the source of truth.

#### Reuse with adaptation

- `src/components/dayNightExplorer/useDayNightExplorerModel.ts`
- `src/lib/dayNightExplorer/dayNightExplorerMath.ts`
- `src/components/dayNightExplorer/SpinningPlanet.tsx`
- `src/pages/TimeExplorerPage.tsx`

These modules should be refactored so they emit or consume a renderer-agnostic scene snapshot rather than D3-specific render data.

Expected changes:

- replace D3-specific render-scene assumptions with a generic planetary scene contract
- preserve focus/calculation-city logic
- preserve direct-update strategy during clock drag where it still improves responsiveness
- keep the existing Time Explorer layout and UI overlay structure where practical

#### Replace

- `src/components/dayNightExplorer/usePlanetaryGlobe.ts`

This is the main module that should be replaced.

Reasons:

- it is tightly coupled to D3 projection, Canvas path rendering, and D3 drag behavior
- it loads map scripts and TopoJSON-specific assets directly
- it owns renderer-specific details that do not transfer cleanly to a true 3D scene

### 6.1 Parity Checklist Before Adding Solar Focus

Before adding Sun / solar-system mode work beyond a basic placeholder, Earth Focus must match current behavior on:

1. selected date changes from the global calendar
2. clock drag and live clock ticking
3. city switching and timezone relabeling
4. Sun mode vs city mode logic
5. city-centered vs sun-centered presentation
6. day/night boundary movement while dragging
7. backdrop and phase-color synchronization
8. city marker visibility and selection affordance

This parity gate should be treated as a formal milestone.

### 6.2 Scene Controller

Create a controller module that consumes the shared app state and emits a scene snapshot.

Suggested responsibility:

- read selected date/time/location inputs
- compute astronomy outputs via existing solar helpers
- derive Earth/Sun/Moon transforms
- derive mode-specific camera targets
- expose immutable scene data to the renderer

### 6.3 `SolarSystem3DManager`

Use the manager as a renderer implementation, not as the owner of solar logic.

Responsibilities:

- create and dispose renderer resources
- build scene graph objects
- apply scene snapshots to objects each frame
- animate transitions between display modes
- handle renderer-specific input behavior

### 6.4 Assets

Start with the minimum viable set:

- Earth day texture
- Earth night texture
- optional cloud texture

Defer these until the core interaction is stable:

- specular map
- high-end atmosphere scattering
- premium night-lights pass

### 6.5 Input

Earth Focus:

- allow controlled globe rotation
- keep the educational orientation readable

Solar Focus:

- prefer constrained camera orbit or guided camera motion
- do not start with unconstrained free-fly controls

## 7. Implementation Phases

### Phase 1: Stabilize the Shared Contract

1. Finalize canonical time/date/location state.
2. Finalize pure astronomy outputs.
3. Define the scene snapshot interface.
4. Add deterministic tests for time-zone and solar correctness.

### Phase 2: Replace Earth Rendering

1. Add `three`.
2. Build a `ThreePlanetaryRenderer` or equivalent adapter.
3. Implement Earth mesh, lighting, and terminator.
4. Render city markers from shared location data.
5. Adapt the current explorer model to emit a renderer-agnostic scene snapshot.
6. Sync renderer updates from the scene snapshot.

### Phase 3: Reach Earth-View Parity

1. Match current clock/date behavior.
2. Match current city and time-zone semantics.
3. Validate responsiveness on Android devices.
4. Match current backdrop/day-phase behavior and UI overlay expectations.
5. Keep old explorer as fallback until parity is confirmed.

### Phase 4: Add Solar Focus

1. Add Sun and Moon bodies.
2. Add Earth orbit visualization.
3. Add mode toggle and camera transition.
4. Ensure Earth Focus still uses the exact same shared time/date/astronomy inputs.
5. Add clear visual cues that distinguish stylized orbit layout from strict scale.

### Phase 5: Optional Visual Upgrades

1. Atmosphere shell.
2. Cloud layer.
3. Night lights.
4. Month and season overlays.
5. Optional WebGPU investigation if rendering demands justify it.

## 8. Verification

### 8.1 Correctness

- verify subsolar longitude/latitude on fixed regression timestamps
- verify Earth tilt direction on equinox and solstice dates
- verify city local times across DST boundaries
- verify Earth Focus and Solar Focus use the same underlying instant
- verify Earth Focus retains current calculation-city and focus-city semantics
- verify returning to Sun mode preserves the last selected calculation city
- verify clock dragging still updates the Earth view continuously

### 8.2 Performance

Target on Android:

- stable interaction with no obvious frame drops during clock drag
- acceptable startup and texture-load time
- no excessive memory spikes from textures

### 8.3 Product Quality

- mode toggle is understandable and responsive
- Earth Focus remains easier to read than the current implementation, not just prettier
- Solar Focus reinforces the teaching goal rather than distracting from it
- no currently-supported Earth Explorer behavior is lost when the new renderer ships

## 9. Recommendation Summary

Recommended implementation path:

1. Keep the app web-first.
2. Preserve the current Time Explorer model and move only the renderer boundary first.
3. Reuse the existing date/time/solar/city/clock logic wherever possible.
4. Implement the first high-performance renderer in `Three.js` on WebGL.
5. Reach full Earth parity before making Solar Focus the headline mode.
6. Keep `WebGPU` as a future option, not the default.
7. Do not use `React Native` or `React Native Skia` for this feature unless the whole app moves to a native-first strategy.
