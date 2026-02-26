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

## Firebase + data model (important)

- Firebase is initialized in `src/firebase.ts` and requires `VITE_FIREBASE_*` env vars.
- Firestore is user-scoped. Collections follow:
  - `/users/{uid}/children`, `/tasks`, `/rewards`, `/starEvents`, `/redemptions`
  - Security rules are in `firestore.rules` (only the owning `uid` can read/write).

## Data access & UI patterns used in this repo

- Pages read live data with Firestore `onSnapshot(...)` inside `useEffect` and return the unsubscribe cleanup.
  - Examples: `src/pages/DashboardPage.tsx`, `src/pages/ManageTasksPage.tsx`.
  - Always verify `user` exists before setting up subscriptions.
- CRUD forms validate with Zod (`z.object(...)`) and store errors in component state.
  - Convention: `editingId === 'new'` means “create mode”.
- Star-award and redemption logic is centralized in `src/services/starActions.ts` using Firestore transactions:
  - writes an audit doc (`starEvents`/`redemptions`) with `serverTimestamp()`
  - updates `children/{childId}.totalStars` with `increment(...)`
- Standardized list rows use `src/components/StandardActionList.tsx` for Manage Children/Chores/Rewards.
  - This component handles list animations ("whimsical") and standard CRUD actions.
- Layout sizing should reference `uiTokens` (not hard-coded values).
- User feedback often uses `src/utils/celebrate.ts` (confetti) for positive actions.

## UI/UX conventions (kid-friendly)

- Tailwind is used for layout, but many components use inline style objects driven by the active theme (`theme.colors`, `theme.bgPattern`).
- The visual source of truth is `public/design-prototype.html` and the interaction sizing guidance is `docs/children-ui-ux-guidelines.md` (e.g., 72px minimum touch targets).
- Use `uiTokens.contentMaxWidth` to keep page content and action buttons aligned and consistent.
- Reusable components:
  - `src/components/ActionTextInput.tsx` for forms.
  - `src/components/ActionButton.tsx` for primary page actions.
  - `src/components/TopIconButton.tsx` for navigation/header actions.
- Theme assets: the `princess` theme uses SVG assets in `src/assets/themes/princess/*` (see `src/pages/DashboardPage.tsx`).
- Chores are the user-facing name for tasks (Dashboard button label is “Chores”).
- In list action rows for the princess theme, use SVG icons for edit/delete (no text labels).

## Testing conventions

- Vitest config lives in `vite.config.ts` and uses `src/setupTests.ts`.
- `src/App.test.tsx` shows the preferred pattern for mocking Firebase Auth (`vi.mock('firebase/auth', ...)`) to drive auth flows.
- Playwright tests live in `tests/`; current `tests/example.spec.ts` is a placeholder (does not run against the local app).
