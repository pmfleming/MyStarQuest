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

## High-level architecture

- Single-page React app with React Router routes defined in `src/App.tsx`.
- Auth gating is handled by `src/routes/ProtectedRoute.tsx` using `<Outlet />`.
- Global providers are composed in `src/App.tsx` in this order:
  - `AuthProvider` (`src/auth/AuthContext.tsx`) — Firebase Auth (Google sign-in)
  - `ThemeProvider` (`src/contexts/ThemeContext.tsx`) — theme palette + styles
  - `ActiveChildProvider` (`src/contexts/ActiveChildContext.tsx`) — selected child persisted in `localStorage` per user

## Source folder layout

Three non-component folders under `src/`:

- **`src/data/`** — Domain types (`types.ts`) and Firestore-coupled data hooks (`useChildren`, `useRewards`, `useTasks`, `useTodos`).
- **`src/ui/`** — Visual configuration: layout tokens (`tokens.ts`), theme options (`themeOptions.ts`), and row-descriptor factories (`*Descriptors.*`, `listDescriptorTypes.ts`).
- **`src/lib/`** — Shared non-UI logic: Firestore transaction helpers (`starActions.ts`), pure utilities (`celebrate.ts`, `today.ts`, `setupStatusActions.ts`), and the dinner-activity hook (`useDinnerActivity.ts`).

## Firebase + data model (important)

- Firebase is initialized in `src/firebase.ts` and requires `VITE_FIREBASE_*` env vars.
- Firestore is user-scoped. Collections follow:
  - `/users/{uid}/children`, `/tasks`, `/rewards`, `/starEvents`, `/redemptions`, `/todos`
  - Security rules are in `firestore.rules` (only the owning `uid` can read/write).
- **Cloud Functions** live in `functions/` (Node 20, firebase-functions v2, firebase-admin).
  - `generateDailyTodos` — scheduled function (`onSchedule`) that runs at 00:05 Europe/London to create daily `TodoRecord` documents. It iterates users → children → tasks, deduplicates via `(childId, dateKey)` query, and batch-creates only type-relevant fields per task type.
  - The `functions/` directory has its own `package.json` and `tsconfig.json`; it compiles to CommonJS in `functions/lib/`.

## Data model — discriminated unions

All core domain types use **discriminated unions** (tagged unions) so TypeScript narrows correctly when you check `taskType` or `sourceTaskType`.

### TaskRecord (stored in `/users/{uid}/tasks`)

- Discriminant: `taskType`
- Variants: `StandardTask`, `EatingTask`, `MathTask`, `PositionalNotationTask`, `DayNightTask`
- Type-specific fields only exist on their variant:
  - `EatingTask` has `dinnerDurationSeconds`, `dinnerTotalBites`
  - `MathTask` has `mathTotalProblems`
  - `PositionalNotationTask` has `pvTotalProblems`
  - `DayNightTask` has no extra fields
  - `StandardTask` has no extra fields.

### TodoRecord (stored in `/users/{uid}/todos`)

- Discriminant: `sourceTaskType`
- Variants: `StandardTodo`, `EatingTodo`, `MathTodo`, `PositionalNotationTodo`, `DayNightTodo`
- Same pattern — dinner fields on `EatingTodo`, math fields on `MathTodo`, etc.

### TaskWithEphemeral (Manage page)

- Each `TaskRecord` variant is paired with only its matching ephemeral fields:
  - `StandardTaskWithEphemeral` has `manageCompletedAt`
  - `EatingTaskWithEphemeral` has `manageDinnerRemainingSeconds`, `manageDinnerBitesLeft`, `manageDinnerTimerStartedAt`, `manageDinnerCompletedAt`
  - `MathTaskWithEphemeral` has `manageMathCompletedAt`, `manageMathLastOutcome`
  - `PVTaskWithEphemeral` has `managePVCompletedAt`, `managePVLastOutcome`
  - `DayNightTaskWithEphemeral` has `manageCompletedAt`
- Ephemeral state is held in-memory only (not in Firestore), auto-resets after 15 minutes.

### Type guards

- `isEatingTask`, `isMathTask`, `isPositionalNotationTask`, `isDayNightTask` — generic guards that narrow any `{ taskType: TaskType }` using `Extract<T, ...>`.
- `isEatingTodo`, `isMathTodo`, `isPositionalNotationTodo`, `isDayNightTodo` — narrow `TodoRecord` by `sourceTaskType`.
- These are defined in `src/data/types.ts` and imported where needed.

### Key rule: never access type-specific fields without narrowing first

- Always use the type guard or a `switch` on the discriminant before accessing fields like `dinnerDurationSeconds`, `mathTotalProblems`, etc.
- Handler functions accept the narrowed type (e.g., `dinnerApplyBite(task: EatingTaskWithEphemeral)`), not the full union.

## Data access & UI patterns used in this repo

- Pages read live data with Firestore `onSnapshot(...)` inside `useEffect` and return the unsubscribe cleanup.
  - Examples: `src/pages/DashboardPage.tsx`, `src/pages/ManageTasksPage.tsx`.
  - Always verify `user` exists before setting up subscriptions.
- Star-award and redemption logic is centralized in `src/lib/starActions.ts` using Firestore transactions:
  - writes an audit doc (`starEvents`/`redemptions`) with `serverTimestamp()`
  - updates `children/{childId}.totalStars` with `increment(...)`
- `src/data/useTasks.ts` manages task config from Firestore (`rawTasks: TaskRecord[]`) merged with local ephemeral state (`ephemeral: Record<string, TaskEphemeralState>`) producing `tasks: TaskWithEphemeral[]`. All manage-page mutations (math/dinner/pv handlers) write to ephemeral state only, not Firestore.
- `src/data/useTodos.ts` manages today's todos from Firestore. Field accessors (`getDinnerDuration`, `getMathTotalProblems`, etc.) accept narrowed todo types. Daily todo creation is handled server-side by the Cloud Function; manual `addTodo` writes only type-relevant fields via a `switch` on `task.taskType`.
- `src/components/StandardActionList.tsx` is the shared whimsical list shell used by Children, Rewards, Chores, and Today.
  - It owns shared card structure, animations, action-row layout, add-row behavior, inline-new-row behavior, empty state, and common action rendering.
  - It should stay presentation-focused. Do not push task-type-specific branching into this component.
- Descriptor modules in `src/ui/*Descriptors.*` are the default way to configure row behavior.
  - `listDescriptorTypes.ts` defines the row-descriptor contract and adapts it to `StandardActionList` props.
  - `manageTaskDescriptors.tsx` centralizes Manage Chores row behavior by `task.taskType`.
  - `todayTodoDescriptors.tsx` centralizes Today row behavior by `todo.sourceTaskType`.
  - `definitionRowDescriptors.tsx` centralizes non-task definition rows for Children and Rewards.
- Current row model:
  - Definition rows: Children and Rewards. These are config-only entity rows and should use `definitionRowDescriptors.tsx`.
  - Config-only chores: `standard` tasks. These are chores with editable definition/config and simple completion, but no embedded activity UI.
  - Complex chores: `eating`, `math`, and `positional-notation`. These have a setup/config stage and an in-chore/activity stage.
  - Simple chores: `daynight`. These are activity-only rows with no separate config UI beyond the shared row shell.
- When changing Chores or Today behavior, prefer editing the relevant descriptor module instead of adding new `if (isEating...)` / `if (isMath...)` branches inside the page component.
- Page components should keep orchestration state and handlers, then pass them into descriptor factories.
  - Examples: active task/todo IDs, check triggers, reset handlers, award handlers, and dinner activity state remain in the page.
  - Descriptor factories consume those dependencies and return row rendering/action behavior for the shared list shell.
- Layout sizing should reference `uiTokens` (not hard-coded values).
- User feedback often uses `src/lib/celebrate.ts` (confetti) for positive actions.
- Dinner timer uses a `timerStartedAt` approach — the client computes remaining time from `Date.now() - startedAt` in a `setInterval`, avoiding per-second Firestore writes. Both ManageTasksPage (ephemeral `manageDinnerTimerStartedAt`) and TodayPage (`dinnerTimerStartedAt` in Firestore) follow this pattern.
- Maths test behavior lives in `src/components/ArithmeticTester.tsx` and is parent-driven from `src/pages/ManageTasksPage.tsx`:
  - Parent action button triggers answer checks through `checkTrigger` (ArithmeticTester does not own a standalone check button).
  - Completion/failure end-state images are passed via `completionImage`/`failureImage` to match `DinnerCountdown` style.
  - Failure threshold is 3 mistakes (`onFail`) with persisted task outcome (`mathLastOutcome`) used to render deterministic end states.
  - Princess maths SVGs used in `<img>` contexts should use fixed dimensions (not `%`) to avoid invisible renders.
- Positional notation behavior lives in `src/components/PositionalNotationTester.tsx` and is parent-driven from `src/pages/ManageTasksPage.tsx`:
  - Parent action button triggers answer checks through `checkTrigger` (same flow as ArithmeticTester).
  - Failure threshold is 3 mistakes (`onFail`) and completion/failure uses `maths-correct` / `maths-incorrect` themed assets.
  - Builder layout uses a `2fr/1fr` Tens/Ones split; ones use `maths-counter` icons, and tens render as 10 stacked smaller `maths-counter` icons.

## UI/UX conventions (kid-friendly)

- Tailwind is used for layout, but many components use inline style objects driven by the active theme (`theme.colors`, `theme.bgPattern`).
- The visual source of truth is `public/design-prototype.html` and the interaction sizing guidance is `docs/children-ui-ux-guidelines.md` (e.g., 72px minimum touch targets).
- Use `uiTokens.contentMaxWidth` to keep page content and action buttons aligned and consistent.
- Reusable components:
  - `src/components/ActionTextInput.tsx` for forms.
  - `src/components/ActionButton.tsx` for primary page actions.
  - `src/components/TopIconButton.tsx` for navigation/header actions.
- Theme assets: the `princess` theme uses SVG assets in `src/assets/themes/princess/*` (see `src/pages/DashboardPage.tsx`).
- Chores are the user-facing name for tasks (Dashboard button label is "Chores").
- In list action rows for the princess theme, use SVG icons for edit/delete (no text labels).

## Testing conventions

- Vitest config lives in `vite.config.ts` and uses `src/setupTests.ts`.
- `src/App.test.tsx` shows the preferred pattern for mocking Firebase Auth (`vi.mock('firebase/auth', ...)`) to drive auth flows.
- Playwright tests live in `tests/`; current `tests/example.spec.ts` is a placeholder (does not run against the local app).
