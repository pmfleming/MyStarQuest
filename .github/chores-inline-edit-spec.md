# Chores Page Inline Editing Spec

## Goal

Move chore editing from the separate edit view into inline list editing on the Chores page, while unifying star display + star editing into a single reusable component.

## Why this change

- Current Chores flow switches between list mode and edit mode, creating extra navigation friction.
- Star display and star editing are split between `StarDisplay` and `StarCost`, causing duplicated behavior.
- Repeat toggle is only available in the edit view, not where chores are reviewed and acted on.

## Current baseline (discovered)

- Chores page: [src/pages/ManageTasksPage.tsx](src/pages/ManageTasksPage.tsx)
  - Uses `editingId` to switch between full-page list vs full-page form.
  - Uses `StandardActionList` for list rows, with `onEdit` opening edit mode.
  - Uses `StarCost` + `RepeatControl` in the edit section.
- Shared list rows: [src/components/StandardActionList.tsx](src/components/StandardActionList.tsx)
  - Renders star count using `StarDisplay`.
  - Always renders Edit and Delete utility buttons.
- Star components:
  - [src/components/StarDisplay.tsx](src/components/StarDisplay.tsx) (display only)
  - [src/components/StarCost.tsx](src/components/StarCost.tsx) (display + +/- controls)

## In-scope

1. Chores page inline editing (no separate edit subpage state).
2. Move repeat control into each editable list row.
3. Remove chore row Edit button and edit-entry workflow.
4. Create one unified star component that handles:
   - whimsical initial count animation
   - optional inline +/- editing mode
5. Apply unified star component where stars are shown/editable, except dashboard.

## Out-of-scope

- Dashboard star animation UI (`StarInfoBox`) behavior change.
- Firestore schema changes.
- Auth/routing changes outside removing chores edit-mode route behavior.

## UX behavior (target)

- Chores page remains list-first at all times.
- Each chore row can enter inline edit state (single row editing at a time).
- Row in inline edit state includes:
  - title input
  - star editor (animated count first, then +/- controls)
  - repeat toggle
  - save and cancel actions
- Edit utility button is removed from chore rows.
- Add chore action opens an inline “new row” editor in the list.

## Unified Star Component (proposed)

Create one reusable component (working name: `EditableStarDisplay`) to replace split responsibilities of `StarDisplay` + `StarCost`.

### Required capabilities

- `count` display with whimsical star animation on mount/value change.
- Optional editing controls (`+` / `-`) enabled by prop.
- Bounds support (`min`, `max`) for task/reward rules.
- Callback on change.
- Theme-aware styling consistent with existing tokens and list cards.

### Usage rules

- Use this component in list rows and forms where stars are editable.
- Keep dashboard excluded (still uses `StarInfoBox`).

## Technical design notes

- Refactor [src/components/StandardActionList.tsx](src/components/StandardActionList.tsx):
  - Make Edit action optional/removable.
  - Allow a row-level inline edit render path for chores.
- Refactor [src/pages/ManageTasksPage.tsx](src/pages/ManageTasksPage.tsx):
  - Remove full-page `editingId` mode split UI.
  - Keep validation and save/delete logic, but trigger from row-level controls.
  - Keep `editingId === 'new'` semantics for create mode if still useful, now rendered inline.
- Replace `StarCost` usage with unified star component in chores flow first; then update other non-dashboard star surfaces.

## Acceptance criteria

1. On Chores page, editing does not navigate to separate page/view; it occurs inline in list.
2. Chore row Edit icon/button is removed.
3. Repeat toggle is visible in inline row editing UI.
4. Star field animates first, then allows +/- edits in inline edit mode.
5. Star component is unified (no separate display/edit split for non-dashboard star UIs).
6. Existing save/delete/award behavior remains intact.

## Files expected to change (implementation phase)

- [src/pages/ManageTasksPage.tsx](src/pages/ManageTasksPage.tsx)
- [src/components/StandardActionList.tsx](src/components/StandardActionList.tsx)
- [src/components/StarDisplay.tsx](src/components/StarDisplay.tsx) and/or [src/components/StarCost.tsx](src/components/StarCost.tsx)
- Potential follow-up updates where stars are shown outside dashboard (e.g. rewards/children lists).

## Open confirmation points

1. Should inline edit mode be single-row only, or allow multiple rows editing concurrently?
2. For "wherever stars are displayed they can be edited": should this include Manage Children total-stars rows, or only task/reward authoring surfaces?
3. Should the old `StarCost` and `RepeatControl` components be fully removed, or kept as wrappers around the new behavior for compatibility?
