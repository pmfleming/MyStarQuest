# Refactor Water & Toilet Check for Unified UI and Code Reuse

The goal is to unify the UI for the Water & Toilet Check across different entry points (Dashboard and Manage Chores) and ensure consistent behavior for both in-chore and completed states. The success and failure screens should use the same component structure as the in-chore activity.

## Key Changes

### 1. Unify `WaterToiletMonitor` Component

- Modify `src/components/WaterToiletMonitor.tsx` to remove the use of `ChoreOutcomeView` on completion.
- Instead, render the same dual-tile layout for both in-progress and completed states.
- This ensures the success (empty flask) and failure (not pee'd) result screens look identical in structure (two tiles), fulfilling the "same page" requirement.
- Ensure tiles are non-interactive (`disabled`) when `isCompleted` is true or `isInteractive` is false.
- Ensure `StarDisplay` is always shown at the bottom.

### 2. Standardize In-Chore Behavior

- Ensure `src/ui/unifiedChoreDescriptors.tsx` correctly employs the updated `WaterToiletMonitor` for both `manage` and `today` modes.
- Ensure the cycling logic (onCycleWater, onCycleToilet) and star calculation are shared via `src/lib/choreLogic.ts`.

### 3. Visual Consistency & Asset Usage

- Use shared assets from `src/ui/waterToiletAssets.ts`.
- Ensure common tokens from `src/tokens` are used for spacing and layout.

## Implementation Steps

### Phase 1: UI Unification

1.  **`src/components/WaterToiletMonitor.tsx`**:
    - Remove the `if (isCompleted)` block that switches to `ChoreOutcomeView`.
    - Update the main render to handle `isCompleted` by disabling interactions and styling the tiles consistently.
    - Ensure `onCycleWater` and `onCycleToilet` are optional.

### Phase 2: Descriptor Alignment

1.  **`src/ui/unifiedChoreDescriptors.tsx`**:
    - Review the `watertoiletcheck` case in `renderItem` to ensure it passes all necessary props to `renderWaterToiletChore`.
    - Verify that `getWaterToiletRenderState` correctly provides the state for both `manage` and `today` modes.

### Phase 3: Tests & Validation

1.  **`tests/component/WaterToiletMonitor.test.tsx`**:
    - Update completion tests to expect the dual-tile layout instead of `ChoreOutcomeView`.
    - Verify that the correct images (empty flask, pee status) are still shown in the tiles upon completion.
2.  **Manual Verification**:
    - Check "Manage Chores" page: enter a water/toilet check, cycle values, and see the state saved.
    - Check "Dashboard" page: start the check, cycle values, complete it, and verify the "completed" state shows the same dual tiles.

## Verification & Testing

- Run `npm test tests/component/WaterToiletMonitor.test.tsx`.
- Run `npm test tests/unit/choreLogic.test.ts`.
- Confirm visual parity between success and failure states (both should show the two tiles with final values).
