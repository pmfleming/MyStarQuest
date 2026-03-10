# Today Page — Functional Specification

## Purpose

The Today page is the daily hub for a child's chore checklist. It shows the current day's todos, lets the parent/child interact with each todo type (complete standard chores, run the dinner timer, do maths tests, do positional-notation tests), and awards stars on completion. Todos are scoped per-child × per-date and persisted in Firestore.

---

## URL & Routing

| Route | Guard |
|---|---|
| `/today` | `ProtectedRoute` (requires authenticated Firebase user) |

---

## Data Dependencies

| Source | Path | Purpose |
|---|---|---|
| `useTodos()` hook | — | Real-time todo list, task templates, all mutation helpers |
| Firestore subscription | `/users/{uid}/todos` filtered by `childId` + `dateKey` | Live todo documents for today |
| Firestore subscription | `/users/{uid}/tasks` | Read-only task templates used for the "add todo" chooser |
| `useActiveChild()` | — | Currently selected child ID |
| `useTheme()` | — | Active theme (princess / space / default) for themed assets and colours |
| `getTodayDescriptor()` | — | `dateKey`, `dayType`, `season`, `dayName`, `formattedDate` |

---

## Layout & Visual Structure

### Shell

Wrapped in `<PageShell>` which applies the theme's background pattern.

### Header

- **Title:** "Today"
- **Right-side icon buttons (left → right):**
  1. **Reset today** — calls `resetTodayTodos` (Cloud Function) to regenerate today's auto-added todos.
  2. **Chores** — navigates to `/settings/manage-tasks`.
  3. **Home** — navigates to `/`.

### Hero Card (date summary)

A gradient card (`primary → secondary`) displaying:

| Field | Example |
|---|---|
| Day type label | "Schoolday" or "Non-school day" |
| Day name | "Monday" |
| Formatted date | "March 10" |
| Progress summary | "3 of 5 completed." or "No todos planned for today yet." |

### No Child Selected State

If `activeChildId` is `null`, a placeholder is shown:
> 👶 "Pick a child before planning today."

No todo list or add button is rendered.

### Todo List

Rendered via `<StandardActionList>` with whimsical animations. Each row shows:

- **Title** (heading font, bold)
- **Schedule badges** — school-day icon and/or non-school-day icon displayed as small themed tiles when the respective flags are true.
- **Star count** (via `getStarCount`)
- **Highlighted state** when `completedAt` is truthy (visually marks the row as done)

### Empty State

> "No todos for today yet."

---

## Todo Types & Interactions

The primary action button behaviour is determined by `sourceTaskType`.

### 1. Standard Todo

| Aspect | Behaviour |
|---|---|
| **First tap** | Immediately completes the todo via `completeTodo()` → `completeTodoAndAwardStars()` transaction |
| **On success** | Confetti celebration, `completedAt` set, star count incremented on child profile |
| **While pending** | Button disabled (`pendingTodoId` guard) |
| **After completion** | Button shows completed icon, is disabled |
| **Error** | Alert "Failed to complete that todo. Please try again." |

### 2. Eating (Dinner) Todo

| Aspect | Behaviour |
|---|---|
| **First tap** | Starts the dinner timer: calls `dinnerStartTimer()` (writes `dinnerTimerStartedAt` to Firestore), sets `activeDinnerTodoId`, expands `DinnerCountdown` inline |
| **Subsequent taps** | Each tap registers a "bite" — triggers a bite cooldown of **15 seconds** (`BITE_COOLDOWN_SECONDS`). Actual bite is applied to Firestore only *after* cooldown completes. During cooldown the button is disabled |
| **Timer tick** | A 1-second `setInterval` re-renders the countdown using client-side elapsed time (`Date.now() - dinnerTimerStartedAt`). No per-second Firestore writes |
| **Timer expires** | `dinnerTimerExpired()` sets `dinnerRemainingSeconds: 0`, marks todo completed (failure path — ran out of time) |
| **All bites consumed** | After the last bite is applied and Firestore updated, `completeTodoAndAwardStars()` is called (success path), confetti fires, timer UI stops |
| **DinnerCountdown props** | `duration`, `remaining`, `totalBites`, `bitesLeft`, `starReward`, `isTimerRunning`, `isCompleted`, themed `plateImage` / `completionImage` / `failureImage` / `biteIcon`, `biteCooldownSeconds`. Adjustment callbacks (`onAdjustTime`, `onAdjustBites`, `onStarsChange`) return `undefined` (read-only on Today) |
| **Mutual exclusion** | Opening a dinner todo closes any active math or PV todo |

### 3. Math Todo

| Aspect | Behaviour |
|---|---|
| **First tap** | Sets `activeMathTodoId`, expands `ArithmeticTester` inline |
| **Subsequent taps** | Increments `mathCheckTriggerByTodo[todoId]` — the tester uses this as a trigger to check the current answer |
| **On all problems correct** | `mathComplete()` → `completeTodoAndAwardStars()` with `mathLastOutcome: 'success'`, confetti |
| **On 3 failures** | `mathFail()` → marks `completedAt` + `mathLastOutcome: 'failure'` (no stars awarded) |
| **ArithmeticTester props** | `totalProblems`, `starReward`, `isRunning`, `isCompleted`, `isFailed`, `checkTrigger`, themed `completionImage` / `failureImage`. Adjustment callbacks return `undefined` (read-only on Today) |
| **Mutual exclusion** | Opening a math todo closes any active dinner or PV todo |

### 4. Positional Notation (PV) Todo

| Aspect | Behaviour |
|---|---|
| **First tap** | Sets `activePVTodoId`, expands `PositionalNotationTester` inline |
| **Subsequent taps** | Increments `pvCheckTriggerByTodo[todoId]` — the tester uses this as a trigger to check the current answer |
| **On all problems correct** | `pvComplete()` → `completeTodoAndAwardStars()` with `pvLastOutcome: 'success'`, confetti |
| **On 3 failures** | `pvFail()` → marks `completedAt` + `pvLastOutcome: 'failure'` (no stars awarded) |
| **PositionalNotationTester props** | `totalProblems`, `starReward`, `isRunning`, `isCompleted`, `isFailed`, `checkTrigger`, themed `completionImage` / `failureImage`. Adjustment callbacks return `undefined` (read-only on Today) |
| **Mutual exclusion** | Opening a PV todo closes any active dinner or math todo |

---

## Primary Action Button — Icon Logic

| Condition | Princess theme | Default theme |
|---|---|---|
| Completed | `princessActiveIcon` | ✅ |
| Eating todo (not completed) | `princessBiteIcon` | 🍽️ |
| Math or PV todo (not completed) | `princessMathsIcon` | 🔢 |
| Standard todo (not completed) | `princessGiveStarIcon` | ⭐ |

The text label ("Open chore") is always hidden (`showLabel: () => false`); only the icon is shown.

---

## Adding Todos

- **"Add Todo" button** at the bottom of the list (via `StandardActionList.onAdd`).
- Opens an inline chooser (`showAddChooser` flag) rendered inside `inlineNewRow`.

### Chooser panel

- Lists `availableChores` — task templates belonging to the active child that have **not** already been added today (filtered by `todoSourceIds`).
- Each chooser button shows: task title, schedule label (from `getScheduleLabel`), star value.
- Tapping a task calls `addTodo(task)` which writes a new todo doc to Firestore with all type-relevant fields:
  - Standard: base fields only.
  - Eating: `dinnerDurationSeconds`, `dinnerRemainingSeconds`, `dinnerTotalBites`, `dinnerBitesLeft`.
  - Math: `mathTotalProblems`, `mathLastOutcome: null`.
  - PV: `pvTotalProblems`, `pvLastOutcome: null`.
- If a task has already been added (`todoSourceIds.has(task.id)`), the add is silently skipped.
- **Empty state in chooser:** "No more chores are available to add today."
- **Cancel button** closes the chooser.

---

## Deleting Todos

- Each row has a delete action (via `StandardActionList.onDelete`).
- Deleting a todo:
  1. Clears any active UI state referencing that todo (`activeDinnerTodoId`, `activeMathTodoId`, `activePVTodoId`, `pendingDinnerBiteTodoId`).
  2. Deletes the Firestore document.
- Edit is hidden (`hideEdit` flag).

---

## Reset Today

- The reset button in the header calls `resetTodayTodos()`.
- This invokes the `resetTodayTodos` Cloud Function via `httpsCallable`, passing the current `childId`.
- The Cloud Function regenerates auto-added todos for today.

---

## State Reset on Context Change

When `activeChildId` or `todayInfo.dateKey` changes (child switch or date rollover):

- All active todo UIs are closed (`activeDinnerTodoId`, `activeMathTodoId`, `activePVTodoId` → null).
- Check-trigger counters are cleared.
- Bite cooldown state is cleared.

---

## Star Awarding (Transaction)

All star awards go through `completeTodoAndAwardStars()` which runs a Firestore transaction:

1. Reads child doc and todo doc to verify both exist and todo is not already completed.
2. Creates a `starEvents` audit document with `{ childId, delta, createdAt: serverTimestamp() }`.
3. Increments `children/{childId}.totalStars` by `delta`.
4. Sets `completedAt: serverTimestamp()` (plus any extra `updates`) on the todo doc.
5. On success, `celebrateSuccess()` fires confetti.

---

## Firestore Schema: Todo Document

Collection path: `/users/{uid}/todos`

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Copied from task template at creation |
| `childId` | `string` | Owning child |
| `sourceTaskId` | `string` | ID of the originating task template |
| `sourceTaskType` | `'standard' \| 'eating' \| 'math' \| 'positional-notation'` | Discriminant |
| `starValue` | `number` | Stars awarded on success |
| `schoolDayEnabled` | `boolean` | Schedule flag |
| `nonSchoolDayEnabled` | `boolean` | Schedule flag |
| `autoAdded` | `boolean` | `true` if created by the daily Cloud Function |
| `dateKey` | `string` | `YYYY-MM-DD` format |
| `createdAt` | `Timestamp` | Server timestamp |
| `completedAt` | `Timestamp \| null` | Set on completion (success or failure) |
| *Eating-only:* `dinnerDurationSeconds` | `number` | Total allowed time |
| *Eating-only:* `dinnerRemainingSeconds` | `number` | Remaining time (frozen snapshot) |
| *Eating-only:* `dinnerTotalBites` | `number` | Total bites required |
| *Eating-only:* `dinnerBitesLeft` | `number` | Bites still to take |
| *Eating-only:* `dinnerTimerStartedAt` | `number \| null` | Epoch ms when timer was last started |
| *Math-only:* `mathTotalProblems` | `number` | Problems to solve |
| *Math-only:* `mathLastOutcome` | `'success' \| 'failure' \| null` | Final outcome |
| *PV-only:* `pvTotalProblems` | `number` | Problems to solve |
| *PV-only:* `pvLastOutcome` | `'success' \| 'failure' \| null` | Final outcome |

---

## Theming

The page is fully theme-aware:

- **Princess theme:** Uses SVG assets from `src/assets/themes/princess/` for all icons, buttons, schedule badges, completion/failure images, and the non-school-day image (selected by current season: spring, summer, autumn, winter).
- **Other themes:** Fall back to emoji icons (🔄, 🧹, 🏠, ✅, 🍽️, 🔢, ⭐, 🏫, 🌤️, 👶).
- Gradient card colours, font families, and surface/text/accent colours are all driven by `theme.colors` and `theme.fonts`.

---

## Constants & Defaults

| Constant | Value | Source |
|---|---|---|
| `BITE_COOLDOWN_SECONDS` | 15 | `DinnerCountdown.tsx` |
| `DEFAULT_DINNER_DURATION_SECONDS` | 600 (10 min) | `types.ts` |
| `DEFAULT_DINNER_BITES` | 2 | `types.ts` |
| `DEFAULT_MATH_PROBLEMS` | 5 | `types.ts` |
| `DEFAULT_PV_PROBLEMS` | 5 | `types.ts` |

---

## Edge Cases & Guards

| Scenario | Handling |
|---|---|
| No authenticated user | `useTodos` returns empty arrays; subscriptions not set up |
| No active child | "Pick a child" placeholder; no list rendered |
| Todo already completed | Primary button disabled; inline tester/timer shows completion state |
| Duplicate add attempt | `todoSourceIds.has(task.id)` guard silently prevents duplicates |
| Concurrent pending completion | `pendingTodoId` prevents double-tap on standard todos |
| Bite during cooldown | Button disabled while `biteCooldownSeconds > 0` |
| Timer running + child/date change | All active UIs reset via `useEffect` cleanup on `[activeChildId, dateKey]` |
| `completeTodo` failure | Error caught, alert shown, `pendingTodoId` cleared in `finally` |
| Dinner timer cleanup | `setInterval` cleared on unmount or when `activeDinnerTodoId` becomes null |
| Bite cooldown timer cleanup | `setTimeout` cleared on unmount |
