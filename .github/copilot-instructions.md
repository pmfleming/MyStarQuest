# Copilot instructions (MyStarQuest)

## Project quickstart

- Install: `npm install`
- Dev server: `npm run dev` (Vite)
- Typecheck + build: `npm run build` (runs `tsc -b` then `vite build`)
- Unit tests: `npm test` / `npm run test:watch` (Vitest + Testing Library)
- Lint/format: `npm run lint`, `npm run format` (Husky + lint-staged runs on commit)
- Format check (CI-friendly): `npm run format:check`
- Preview prod build: `npm run preview`
- E2E tests: `npx playwright test` (see `playwright.config.ts`)
- Android sync: `npx cap sync android` (after `npm run build`)
- Open Android Studio project: `npx cap open android`
- Cloud Functions install: `cd functions && npm install`
- Cloud Functions build: `cd functions && npx tsc`

## Android (Capacitor) workflow

- This app ships as a web app and an Android wrapper via Capacitor.
- Source of truth for product behavior/UI remains in `src/*` and web config files.
- Typical Android update flow:
  1. Make web changes in React/Tailwind/theme files.
  2. Run `npm run build`.
  3. Run `npx cap sync android`.
  4. Open/run from Android Studio (`android/` project) as needed.
- Treat `android/app/src/main/assets/public` as generated output from sync; do not hand-edit it.
- Native-only changes (permissions, Gradle, manifest, plugins) belong under `android/*` and should be kept minimal/surgical.
- Keep Firebase web config in `src/firebase.ts` for shared app logic; Android-specific Firebase files (for native services) live under `android/app/`.

## Performance & Bundle Optimization

- **Route-based Code Splitting**: All top-level pages in `src/App.tsx` are lazy-loaded using `React.lazy` and `Suspense`. This keeps the initial bundle size small and improves "Time to Interactive".
- **Component-based Code Splitting**: Heavy activity components (e.g., `AlphabetTester`, `ArithmeticTester`) are lazy-loaded in `src/ui/presetChoreRenderers.tsx`. This is critical because some components (especially the Alphabet Tester) import dozens of large SVG assets that would otherwise bloat the main bundle.
- **Manual Chunking**: The Vite config (`vite.config.ts`) is configured to split large third-party libraries (like Firebase and React) into separate vendor chunks.
- **Loading States**: Use `<Suspense>` boundaries with appropriate fallbacks. For page-level transitions, a simple themed background fallback is preferred to avoid jarring flashes.

## High-level architecture

- Single-page React app with React Router routes defined in `src/App.tsx`.
- App-wide layout is managed by `PageShell.tsx` (frame/viewport) and `TabbedPageShell.tsx` (navigation + touch swipe).
- Scroll regions use `DragScrollRegion.tsx` for hidden scrollbars and click-to-drag behavior.
- Auth gating is handled by `src/routes/ProtectedRoute.tsx` using `<Outlet />`.
- Global providers are composed in `src/App.tsx` in this order:
  - `AuthProvider` (`src/auth/AuthContext.tsx`) — Firebase Auth (Google sign-in)
  - `ThemeProvider` (`src/contexts/ThemeContext.tsx`) — theme palette + styles
  - `ActiveChildProvider` (`src/contexts/ActiveChildContext.tsx`) — selected child persisted in `localStorage` per user

## Source folder layout

Three non-component folders under `src/`:

- **`src/data/`** — Domain types (`types.ts`) and Firestore-coupled data hooks (`useChildren`, `useRewards`, `useChores`).
- **`src/ui/`** — Visual configuration: layout tokens (`tokens.ts`), theme options (`themeOptions.ts`), and row-descriptor factories (`unifiedChoreDescriptors.tsx`, `definitionRowDescriptors.tsx`, `listDescriptorTypes.ts`).
- **`src/lib/`** — Shared non-UI logic: Firestore transaction helpers (`starActions.ts`), pure utilities (`celebrate.ts`, `today.ts`), unified chore parsing (`choreParser.ts`), and unified chore business logic (`choreLogic.ts`).

## Firebase + data model (important)

- Firebase is initialized in `src/firebase.ts` and requires `VITE_FIREBASE_*` env vars.
- Firestore is user-scoped. Collections follow:
  - `/users/{uid}/children`, `/tasks`, `/rewards`, `/starEvents`, `/redemptions`, `/todos`
  - Security rules are in `firestore.rules` (only the owning `uid` can read/write).
- **Snapshot Parsing**: Firestore documents are converted to domain types via `src/lib/choreParser.ts`. This centralizes parsing for both task templates and daily todos.
- **Cloud Functions** live in `functions/` (Node 20, firebase-functions v2, firebase-admin).
  - `generateDailyTodos` — scheduled function (`onSchedule`) that runs at 00:05 Europe/London to create daily `TodoRecord` documents. It iterates users → children → tasks, deduplicates via `(childId, dateKey)` query, and batch-creates only type-relevant fields per task type.
  - The `functions/` directory has its own `package.json` and `tsconfig.json`; it compiles to CommonJS in `functions/lib/`.

## Data model — discriminated unions

All core domain types use **discriminated unions** (tagged unions) so TypeScript narrows correctly when you check `taskType` or `sourceTaskType`.

### TaskRecord (stored in `/users/{uid}/tasks`)

- Discriminant: `taskType`
- Variants: `StandardTask`, `EatingTask`, `MathTask`, `PositionalNotationTask`, `AlphabetTask`
- Type-specific fields only exist on their variant:
  - `EatingTask` has `dinnerDurationSeconds`, `dinnerTotalBites`
  - `MathTask` has `mathTotalProblems`
  - `PositionalNotationTask` has `pvTotalProblems`
  - `AlphabetTask` has `alphabetTotalProblems`
  - `StandardTask` has no extra fields.

### TodoRecord (stored in `/users/{uid}/todos`)

- Discriminant: `sourceTaskType`
- Variants: `StandardTodo`, `EatingTodo`, `MathTodo`, `PositionalNotationTodo`, `AlphabetTodo`
- Same pattern — dinner fields on `EatingTodo`, math fields on `MathTodo`, etc.

### TaskWithEphemeral (Manage page)

- Each `TaskRecord` variant is paired with only its matching ephemeral fields:
  - `StandardTaskWithEphemeral` has `manageCompletedAt`
  - `EatingTaskWithEphemeral` has `manageDinnerRemainingSeconds`, `manageDinnerBitesLeft`, `manageDinnerTimerStartedAt`, `manageDinnerCompletedAt`
  - `MathTaskWithEphemeral` has `manageMathCompletedAt`, `manageMathLastOutcome`
  - `PVTaskWithEphemeral` (Positional Notation) has `managePVCompletedAt`, `managePVLastOutcome`
  - `AlphabetTaskWithEphemeral` has `manageAlphabetCompletedAt`, `manageAlphabetLastOutcome`
- Ephemeral state is held in-memory only (not in Firestore), auto-resets after 15 minutes (`MANAGE_STATUS_RESET_MS`).

### Type guards

- `isEatingTask`, `isMathTask`, `isPositionalNotationTask`, `isAlphabetTask` — generic guards that narrow any `{ taskType: TaskType }`.
- `isEatingTodo`, `isMathTodo`, `isPositionalNotationTodo`, `isAlphabetTodo` — narrow `TodoRecord` by `sourceTaskType`.
- These are defined in `src/data/types.ts` and imported where needed.

### Key rule: never access type-specific fields without narrowing first

- Always use the type guard or a `switch` on the discriminant before accessing fields like `dinnerDurationSeconds`, `mathTotalProblems`, etc.
- Handler functions accept the narrowed type (e.g., `dinnerApplyBite(task: EatingTaskWithEphemeral)`), not the full union.

## Data access & UI patterns used in this repo

- Pages read live data with Firestore `onSnapshot(...)` inside `useEffect` (often via custom hooks in `src/data/`).
  - Always verify `user` exists before setting up subscriptions.
- Star-award and redemption logic is centralized in `src/lib/starActions.ts` using Firestore transactions:
  - writes an audit doc (`starEvents`/`redemptions`) with `serverTimestamp()`
  - updates `children/{childId}.totalStars` with `increment(...)`
- **`src/data/useChores.ts`** is the unified data hook. It manages:
  - `tasks`: definitions of chores (Manage page) merged with local ephemeral state.
  - `todos`: daily instances of chores (Today page) persisted in Firestore.
  - Consistent handlers (e.g., `applyBite`, `completeChore`) that work across both contexts.
  - Midnight rollover logic to keep the "Today" list current.
  - Ephemeral state auto-reset (15 minutes) for the Manage page testing experience.
- `src/components/StandardActionList.tsx` is the shared whimsical list shell used by Children, Rewards, Chores, and Dashboard (Today).
  - It owns shared card structure, animations, action-row layout, add-row behavior, inline-new-row behavior, and common action rendering.
  - It should stay presentation-focused. Do not push task-type-specific branching into this component.
- Descriptor modules in `src/ui/*` are the primary way to configure row behavior for `StandardActionList`.
  - `listDescriptorTypes.ts` defines the row-descriptor contract.
  - **`unifiedChoreDescriptors.tsx`** centralizes row behavior for both Manage and Today contexts via a `mode` parameter.
  - `choreModeDefinitions.ts` is the shared source of truth for preset-chore stage rules such as title visibility, star visibility, reset-vs-delete behavior, and per-type primary-button visibility.
  - `presetChoreRenderers.tsx` centralizes preset-chore component rendering so Today and Manage invoke the same chore-specific renderer.
  - `presetChoreActions.tsx` centralizes preset-chore primary and utility action construction so Today and Manage use the same Start, Check Answer, Bite, Again, Reset, and Delete flows.
  - `definitionRowDescriptors.tsx` centralizes non-task definition rows for Children and Rewards.
- When changing Chores or Today behavior, prefer editing the relevant descriptor module instead of adding new `if (isEating...)` / `if (isMath...)` branches inside the page component.
- When changing preset chore behavior, treat the shared UI choreography as a layered system:
  - `choreModeDefinitions.ts` for stage rules
  - `presetChoreRenderers.tsx` for chore-specific rendering
  - `presetChoreActions.tsx` for primary/reset/delete action behavior
  - `unifiedChoreDescriptors.tsx` only for page-specific orchestration state and handler wiring
- Descriptor wiring for preset chores should stay domain-aware.
  - Keep test-family behavior in descriptor modules rather than page components.
  - When adding new tests, group them with their learning domain conventions instead of treating them as unrelated one-off branches.
- Page components (e.g., `DashboardPage.tsx`, `ChoresPage.tsx`) hold orchestration state and handlers, then pass them into descriptor factories.
- Layout sizing should reference `uiTokens` (not hard-coded values).
- User feedback often uses `src/lib/celebrate.ts` (confetti) for positive actions.
- Dinner timer uses a `timerStartedAt` approach — the client computes remaining time from `Date.now() - startedAt`. Both ChoresPage (ephemeral `manageDinnerTimerStartedAt`) and DashboardPage (`dinnerTimerStartedAt` in Firestore) follow this pattern.
- Maths test behavior lives in `src/components/ArithmeticTester.tsx`:
  - Parent action button triggers answer checks through `checkTrigger`.
  - Failure threshold is 3 mistakes with persisted task outcome (`mathLastOutcome`).
  - Uses `useProblemHistory` to ensure random equations do not repeat within a session.
- Positional notation behavior lives in `src/components/PositionalNotation.tsx`:
  - Builder layout uses a `2fr/1fr` Tens/Ones split; ones use `maths-counter` icons, and tens render as 10 stacked smaller `maths-counter` icons.
  - Uses `useProblemHistory` to ensure random target numbers do not repeat within a session.
- Alphabet test behavior lives in `src/components/AlphabetTester.tsx`:
  - It follows the shared test lifecycle of setup, active play, and success/failure states with capped mistakes.
  - Uses `useProblemHistory` to ensure random letters do not repeat within a session.

## Component inventory

The component layer is easiest to reason about in four groups:

### Shared UI primitives and shells

- `src/components/ActionButton.tsx` — large themed CTA used for page-level navigation and actions.
- `src/components/ActionTextInput.tsx` — inline editable text field used in list rows and settings-style editors.
- `src/components/Carousel.tsx` — stepped visual selector used for child theme selection.
- `src/components/DragScrollRegion.tsx` — hidden-scrollbar scroll container with mouse drag support and bottom fade.
- `src/components/PageHeader.tsx` — title row with optional right-side actions.
- `src/components/PageShell.tsx` — page frame, header, bottom tab bar, swipe navigation, and scroll-region wrapper.
- `src/components/StepperButton.tsx` — shared increment/decrement button used across setup and activity UIs.
- `src/components/TopIconButton.tsx` — compact top-right utility button for navigation and page actions.

### Reusable UI with domain semantics

- `src/components/StandardActionList.tsx` — shared whimsical card-list shell used by Children, Rewards, Chores, and Dashboard.
- `src/components/StarDisplay.tsx` — star field display with optional editable +/- controls.
- `src/components/StarInfoBox.tsx` — animated total-star summary used on the Dashboard.
- `src/components/RepeatControl.tsx` — reusable yes/no repeat toggle used by chores and rewards.

### Concept teaching components

- `src/components/DayNightExplorer.tsx` — time-of-day and world-time teaching widget.
- `src/components/SchoolCalendar.tsx` — school-day versus non-school-day calendar teaching widget.

### Chore system components

Chores should be understood as two layers:

- Custom chores
  - Simple user-authored chores using shared controls such as `ActionTextInput`, `StarDisplay`, and `RepeatControl`.
- Preset chores
  - Specialized interactive chore types rendered by dedicated components.

All chores should also be understood as having three UI modes:

- overview mode
  - used on the Today page / dashboard list
  - shows the chore title, read-only stars, an enter-chore action, and a delete action
- editing mode
  - used on the Manage Chores page
  - shows the editable chore configuration together with the enter-chore action and delete action
- in-chore mode
  - shows only the UI relevant to performing the chore itself
  - hides the title and star display
  - replaces the delete action with a reset action

The in-chore mode should be identical whether it is entered from the Today list or the Manage Chores list.
Today and Manage should differ in overview/editing context, not in the active chore experience itself.

The preset-chore in-mode contract is implemented through shared `src/ui/*` modules rather than duplicated per page:

- `src/ui/choreModeDefinitions.ts`
  - defines shared stage semantics (`setup`, `activity`, `completed`)
  - controls when preset chores hide title and stars
  - controls when reset replaces delete
  - controls per-type primary-button visibility in-chore
- `src/ui/presetChoreRenderers.tsx`
  - ensures the active chore UI for dinner, arithmetic, positional notation, and alphabet is rendered through one shared entry point
- `src/ui/presetChoreActions.tsx`
  - ensures shared primary action construction for dinner and test chores
  - ensures shared reset/delete utility action construction

This means Today and Manage should not independently redefine preset in-chore UI behavior.
They should provide state and callbacks, then call the shared mode, renderer, and action helpers.

Preset chores currently fall into two interaction families:

- Tests
- Activity monitors

Tests should be grouped by learning domain rather than treated as a flat list of one-off components.

#### Tests

All test components share a common pattern:

- setup state
- running/activity state
- completion and failure handling
- parent-controlled orchestration via descriptor modules
- score/progress feedback
- star reward configuration

Current test domains:

- Maths
  - `src/components/ArithmeticTester.tsx`
  - `src/components/PositionalNotation.tsx`
- Language
  - `src/components/AlphabetTester.tsx`

Future test types should be added under the appropriate domain, and new domains may be introduced as needed.

Tests therefore have commonality at two levels:

- all tests share test-level interaction patterns
- tests within a domain share domain-specific conventions and UI patterns

Tests should therefore not be modeled mentally as a flat list of current components.
They should be modeled as:

- test-level commonality
- domain-level commonality
- concrete test types within a domain

#### Activity monitors

Current activity-monitor preset chore:

- `src/components/DinnerCountdown.tsx`

Activity monitors differ from tests in that they track timed or observed completion rather than presenting question/answer interactions.

The underlying task model in `src/data/types.ts` uses concrete task types, while product language may group them into broader families:

- `standard` = custom chore
- `eating` = activity monitor
- `math` = test / maths
- `positional-notation` = test / maths
- `alphabet` = test / language

Manage-page and Today-page row behavior for chore types should stay in descriptor modules rather than inside page components:

- `src/ui/manageTaskDescriptors.tsx`
- `src/ui/todayTodoDescriptors.tsx`

These entry points should present different overview/editing context, but they should converge on the same in-chore mode once a chore is active.

In practice, convergence for preset chores currently means:

- shared stage rules come from `src/ui/choreModeDefinitions.ts`
- shared renderer selection comes from `src/ui/presetChoreRenderers.tsx`
- shared action construction comes from `src/ui/presetChoreActions.tsx`

If Today and Manage begin to differ for a preset chore, the first place to fix it should usually be one of those shared modules rather than page-level descriptor branching.

When adding or changing preset tests, keep the descriptor wiring domain-aware.

- Prefer grouping maths tests with maths-specific behavior and language tests with language-specific behavior.
- Avoid scattering domain logic across page components or `StandardActionList`.
- If a new test shares test-level behavior but introduces new domain conventions, extend the relevant descriptor structure instead of adding ad hoc page-level branching.

When adding a new preset chore:

1. decide whether it is a test or an activity monitor
2. if it is a test, assign it to a learning domain
3. define the overview mode, editing mode, and in-chore mode
4. ensure the in-chore mode matches across Today and Manage entry points
5. add or extend shared stage rules in `src/ui/choreModeDefinitions.ts`
6. add or extend the shared renderer in `src/ui/presetChoreRenderers.tsx`
7. add or extend the shared action builder in `src/ui/presetChoreActions.tsx`
8. add the concrete task type to `src/data/types.ts`
9. add the component implementation
10. wire it into `src/ui/manageTaskDescriptors.tsx` and `src/ui/todayTodoDescriptors.tsx`
11. update or extend `src/ui/choreModeDefinitions.test.ts` so the shared mode contract remains protected

## UI/UX conventions (kid-friendly)

- Tailwind is used for layout, but many components use inline style objects driven by the active theme (`theme.colors`, `theme.bgPattern`).
- Use `uiTokens.contentMaxWidth` to keep page content and action buttons aligned and consistent.
- The interaction sizing guidance is `docs/children-ui-ux-guidelines.md` (e.g., 72px minimum touch targets).
- Reusable components:
  - `src/components/ActionTextInput.tsx` for forms.
  - `src/components/ActionButton.tsx` for primary page actions.
  - `src/components/TopIconButton.tsx` for navigation/header actions.
- Theme assets: the `princess` theme uses SVG assets in `src/assets/themes/princess/*`.
- In list action rows for the princess theme, use SVG icons for edit/delete (no text labels).

## Testing conventions

- Vitest config lives in `vite.config.ts` and uses `src/setupTests.ts`.
- `src/App.test.tsx` shows the preferred pattern for mocking Firebase Auth.
- `src/ui/choreModeDefinitions.test.ts` protects the shared preset-chore mode matrix and shared action labels so Today/Manage drift is caught by a focused unit test.
- Playwright tests live in `tests/`.
