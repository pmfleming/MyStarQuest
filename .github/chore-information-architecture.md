# Chore Information Architecture Proposal

## Goal

Clarify the Chores area so it scales cleanly as new preset chore types are added.

The key distinction is:

- custom chores
- preset chores

Preset chores should then be organized first by interaction family, and tests should be organized by learning domain.

## Proposed top-level structure

- Chores
  - custom chores
  - preset chores

## Chore mode model

All chores should be understood as having three modes:

- overview mode
  - shown on the Today page / dashboard list
  - surfaces a simple summary of the chore
  - shows the chore name, the star value as read-only, an enter-chore button, and a delete button
- editing mode
  - shown on the Manage Chores page
  - surfaces the editable configuration for the chore
  - includes the enter-chore button and delete button alongside the edit controls
- in-chore mode
  - shows only the UI needed to perform the chore itself
  - hides the chore title and hides the star display
  - replaces the delete button with a reset button

The in-chore mode should be identical whether it is entered from the Today list or from the Manage Chores list.
The Today page and Manage Chores page should differ in overview/editing context, not in the active in-chore experience itself.

The final terminal state should also be identical across chore types:

- success and failure end states show only an outcome image and a Reset button
- the final state must hide the title, star display, delete action, and primary action button
- outcome images may vary by chore type or learning domain, but the end-state image size and the list-card dimensions containing it must come from shared resources

For preset chores, this should be enforced structurally in code rather than by convention alone:

- shared stage rules in `src/ui/choreModeDefinitions.ts`
- shared preset chore renderers in `src/ui/presetChoreRenderers.tsx`
- shared preset chore action builders in `src/ui/presetChoreActions.tsx`
- shared final-state sizing tokens in `src/ui/tokens.ts`

Today and Manage should pass state and handlers into those shared modules rather than redefine in-chore behavior separately.

## Proposed preset-chore structure

- preset chores
  - Tests
    - Maths
      - Arithmetic Tester
      - Positional Notation
      - future maths tests
    - Language
      - Alphabet Tester
      - future language tests
    - Other
      - future tests in other domains
  - Activity Monitors
    - Dinner Countdown
    - future monitoring-style preset chores

## Mapping to the current task model

Current implementation-level task types in `src/data/types.ts` map to product categories like this:

- `standard` = custom chore
- `math` = test / maths
- `positional-notation` = test / maths
- `alphabet` = test / language
- `eating` = activity monitor

## Rationale

### 1. Separate authored chores from guided preset experiences

Custom chores are user-authored and configuration-first.

Preset chores are guided interactive experiences with dedicated behavior and UI.

### 2. Group preset chores by interaction family first

Tests and activity monitors are structurally different.

Tests involve:

- setup
- active play
- checking answers or validating outcomes
- success/failure states
- reward completion
- **session uniqueness**: using `useProblemHistory` to prevent repeated random questions in a single run

Activity monitors involve:

- time or progress tracking
- observed completion
- monitoring-style interactions rather than question/answer flow

### 3. Group tests by learning domain

Arithmetic Tester and Positional Notation are both maths-oriented tests.
Alphabet Tester belongs to a language domain.

This gives the IA room to grow cleanly as more maths, language, or other-domain tests are added.

### 4. Recognize commonality at two levels

Tests therefore have commonality at two levels:

- all tests share test-level interaction patterns
  - setup, run, complete/fail, rewards, descriptor orchestration
- domain-level commonality
  - maths tests may share counters, numeric answer patterns, difficulty, and mathematical iconography
  - language tests may share letter, word, image-recognition, phonics, or vocabulary patterns

Tests should therefore not be modeled mentally as a flat list of current components.
They should be modeled as:

- test-level commonality
- domain-level commonality
- concrete test types within a domain

## Proposed add-flow wording

Recommended multi-step model:

- Add Chore
  - Custom Chore
  - Preset Chore

If Preset Chore is selected:

- Choose Preset Chore Category
  - Tests
  - Activity Monitors

If Tests is selected:

- Choose Test Domain
  - Maths
  - Language
  - Other

Then show the available chore type within that domain.

## Current UI-compatible fallback

If the add flow remains a single chooser for now, the labels should still be understood through the future IA:

- Custom Chore
- Arithmetic Tester
- Positional Notation
- Alphabet Tester
- Dinner Countdown

Internally, these options should still be treated as belonging to the broader preset categories above.

## Page-level recommendation

### Manage Chores

Prefer a conceptual structure of:

- custom chores
- preset chores

Manage Chores is the primary editing-mode surface for chores.
It should expose all configurable options for the selected chore while still allowing entry into the same in-chore mode used elsewhere.

Optional future enhancement:

- filters or grouping chips for:
  - All
  - Custom
  - Tests
  - Activity Monitors
  - Maths
  - Language

### Today page

Keep execution fast and simple, but consider small metadata labels or visual grouping for preset families and domains when the list grows.

Today is the primary overview-mode surface for chores.
It should provide a lightweight summary row for each chore, with entry into the same in-chore mode used from Manage Chores.

## Implementation guidance

The codebase should continue using concrete task types for rendering and persistence.
The product IA should use broader categories that remain stable as new preset chores are introduced.

Manage-page and Today-page row behavior for chore types should stay in descriptor modules rather than inside page components:

- `src/ui/unifiedChoreDescriptors.tsx`

This single entry point presents different overview/editing context via a `mode` parameter, but ensures both contexts converge on the same in-chore mode once a chore is active.

That convergence should be implemented through a layered shared preset-chore architecture:

- `src/ui/choreModeDefinitions.ts`
  - source of truth for `setup`, `activity`, and `completed`
  - defines title/star visibility and reset-vs-delete behavior
  - defines per-preset-type primary-button visibility in-chore
- `src/ui/presetChoreRenderers.tsx`
  - source of truth for rendering dinner, arithmetic, positional notation, and alphabet chore UIs
- `src/ui/presetChoreActions.tsx`
  - source of truth for shared Start, Check Answer, Bite, Again, Reset, and Delete action construction

The descriptor files should focus on wiring page-specific orchestration state and handlers into those shared modules.
They should not independently encode the same preset-chore interaction rules.

Current notable shared rule:

- alphabet hides the primary action button in-chore
- dinner, arithmetic, and positional notation keep their primary action button in-chore

Current final-state shared rules:

- `completed` is the shared terminal stage
- every preset chore hides its primary button in `completed`
- `completed` always switches the utility action to Reset
- standard chores should also enter the same image-only final-state shell, even if they currently support only success imagery

When adding or changing preset tests, keep the descriptor wiring domain-aware.

- Prefer grouping maths tests with maths-specific behavior and language tests with language-specific behavior.
- Avoid scattering domain logic across page components or `StandardActionList`.
- If a new test shares test-level behavior but introduces new domain conventions, extend the relevant descriptor structure instead of adding ad hoc page-level branching.

When adding a new preset chore:

1. decide whether it is a test or an activity monitor
2. if it is a test, assign it to a learning domain
3. define how the chore appears in overview mode, editing mode, and in-chore mode
4. ensure the in-chore mode is consistent regardless of whether entry came from Today or Manage Chores
5. add or extend shared stage rules in `src/ui/choreModeDefinitions.ts`
6. add or extend the shared renderer in `src/ui/presetChoreRenderers.tsx`
7. add or extend the shared action builder in `src/ui/presetChoreActions.tsx`
8. add the concrete task type to `src/data/types.ts`
9. add the component implementation
10. wire it into `src/ui/unifiedChoreDescriptors.tsx`
11. update or extend `src/ui/choreModeDefinitions.test.ts` so the shared mode contract remains protected

## Summary

Recommended durable taxonomy:

- Chores
  - custom chores
  - preset chores
    - Tests
      - Maths
      - Language
      - Other
    - Activity Monitors

This is clearer for users, more extensible for future preset chore types, and more robust than grouping only around the currently implemented components.
