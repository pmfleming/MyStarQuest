# Plan: Water & Toilet Check Activity Monitor (`watertoiletcheck`)

## Overview

The `watertoiletcheck` chore is a new preset Activity Monitor designed for the `princess` theme. It allows children to track their water intake and toilet breaks during school time.

### Core Mechanics

- **Water Flask (Left)**: Cycles through 4 states: `full`, `twothirds`, `onethird`, `empty`.
- **Princess Toilet Status (Right)**: Cycles through 2 states: `notpeepee`, `didpeepee`.
- **Stars**:
  - `empty` flask: +1 star
  - `didpeepee`: +1 star
  - `full` flask: -1 star
  - `notpeepee`: -5 stars
  - intermediate flask states (`twothirds`, `onethird`): 0 stars (implied)

## 1. Data Model Changes (`src/data/types.ts`)

### Task and Todo Types

- Add `'watertoiletcheck'` to `TaskType`.
- Define `WaterToiletTask` (extends `TaskBase`).
- Define `WaterToiletTodo` (extends `TodoBase`):
  - `waterLevel: 'full' | 'twothirds' | 'onethird' | 'empty'`
  - `toiletStatus: 'notpeepee' | 'didpeepee'`
- Update `TaskRecord` and `TodoRecord` unions.

### Ephemeral State

- Add to `TaskEphemeralState`:
  - `manageWaterLevel?: 'full' | 'twothirds' | 'onethird' | 'empty'`
  - `manageToiletStatus?: 'notpeepee' | 'didpeepee'`
  - `manageWaterToiletCompletedAt?: number | null`
- Update `TaskWithEphemeral` union.

### Type Guards

- Add `isWaterToiletTask` and `isWaterToiletTodo`.

## 2. Shared Logic (`src/lib/choreLogic.ts`)

### Star Calculation

- Implement `calculateWaterToiletStars(waterLevel, toiletStatus)`:
  - Water: `empty` (+1), `full` (-1), others (0).
  - Toilet: `didpeepee` (+1), `notpeepee` (-5).
  - Returns sum of both.

### Completion Patch

- Update `calculateAwardTaskPatch` to handle `watertoiletcheck` by returning `manageWaterToiletCompletedAt`.

## 3. UI Implementation

### Assets (`src/assets/themes/princess/assets.ts`)

Export the following SVG assets:

- `princessFlaskFullImage`, `princessFlaskTwoThirdsImage`, `princessFlaskOneThirdImage`, `princessFlaskEmptyImage`
- `princessNotPeePeeImage`, `princessDidPeePeeImage`

### Component (`src/components/WaterToiletMonitor.tsx`)

- A presentation component with two columns.
- Left column: Clickable flask image that cycles state.
- Right column: Clickable princess image that cycles state.
- Interactive feedback showing current star impact.

### Preset Renderer (`src/ui/presetChoreRenderers.tsx`)

Add `renderWaterToiletChore` to handle both `manage` and `today` contexts, wiring up the `WaterToiletMonitor` with appropriate handlers.

## 4. Chore System Integration

### Mode Definitions (`src/ui/choreModeDefinitions.ts`)

- Add `watertoiletcheck` to `ChoreModeType`.
- Set `hidePrimaryButtonInChore: false` (to allow finishing the activity).

### Actions (`src/ui/presetChoreActions.tsx`)

- Ensure primary action label is "Finish" or "Done" for this activity.

### Descriptors (`src/ui/unifiedChoreDescriptors.tsx`)

- Add `case 'watertoiletcheck'` to `renderItem`.
- Wire up state from `TaskWithEphemeral` (ephemeral fields) or `TodoRecord` (persistent fields).
- Handle `onUpdateEphemeral` and `onUpdateTodoField` for state changes.

## 5. Cloud Functions (`functions/src/index.ts`)

- Update `generateDailyTodos` to initialize `watertoiletcheck` chores with:
  - `waterLevel: 'full'`
  - `toiletStatus: 'notpeepee'`

## 6. Verification Plan

- **Unit Tests**:
  - Update `src/ui/choreModeDefinitions.test.ts`.
  - Add tests for `calculateWaterToiletStars`.
- **Manual UI Test**:
  - Add a `watertoiletcheck` chore in Manage Chores.
  - Open it from the Today page.
  - Verify cycling images works.
  - Verify "Finish" button records the correct stars.

## Delta Notes: Divergences from Current Implementation

### 1. Dynamic Star Calculation & Penalties

- **Current**: Chores award a fixed `starValue` (e.g., `mathTotalProblems` is configured, but the star reward is fixed upon completion). The `awardStars` and `completeTodoAndAwardStars` functions in `starActions.ts` currently throw errors if `delta <= 0`.
- **Divergence**: `watertoiletcheck` introduces dynamic star rewards (sum of water + toilet state) and **penalties** (e.g., -5 stars for `notpeepee`).
- **Required Change**: `starActions.ts` must be updated to support negative deltas (decrementing `totalStars`), and `useChores.ts` must calculate the delta at the moment of completion instead of reading a static `item.starValue`.

### 2. State-Based Completion vs. Outcome-Based

- **Current**: Tests (Math, Alphabet) have a binary `success` or `failure` outcome. Activity monitors (Dinner) have a binary `completed` state once bites reach zero.
- **Divergence**: `watertoiletcheck` completion depends on the _current state_ of two independent variables (`waterLevel` and `toiletStatus`).
- **Required Change**: The `completeChore` handler in `useChores.ts` will need a specialized branch (similar to how `eating` has its own handlers) to compute the final star delta based on the task's specific state before calling the award transaction.

### 3. Primary Action Interaction

- **Current**: `eating` has a specialized primary action (`createPresetDinnerPrimaryAction`) that toggles between "Start" and "Bite".
- **Divergence**: `watertoiletcheck` doesn't have a "timer" or "bites" but needs a "Finish" action that is always available once in-chore, but behaves like a terminal "Check Answer".
- **Required Change**: A new `createPresetActivityPrimaryAction` (or extending `createPresetTestPrimaryAction`) should be used to provide a consistent "Finish/Done" label that triggers the state-aware completion logic.
