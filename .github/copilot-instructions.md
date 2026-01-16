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
- CRUD forms validate with Zod `safeParse` and store errors keyed by record id.
  - Convention: `editingId === 'new'` means “create mode”.
- Star-award and redemption logic is centralized in `src/services/starActions.ts` using Firestore transactions:
  - writes an audit doc (`starEvents`/`redemptions`) with `serverTimestamp()`
  - updates `children/{childId}.totalStars` with `increment(...)`

## UI/UX conventions (kid-friendly)

- Tailwind is used for layout, but many components use inline style objects driven by the active theme (`theme.colors`, `theme.bgPattern`).
- The visual source of truth is `public/design-prototype.html` and the interaction sizing guidance is `docs/children-ui-ux-guidelines.md` (e.g., 72px minimum touch targets).
- Theme assets: the `princess` theme uses SVG assets in `src/assets/themes/princess/*` (see `src/pages/DashboardPage.tsx`).

## Testing conventions

- Vitest config lives in `vite.config.ts` and uses `src/setupTests.ts`.
- `src/App.test.tsx` shows the preferred pattern for mocking Firebase Auth (`vi.mock('firebase/auth', ...)`) to drive auth flows.
- Playwright tests live in `tests/`; current `tests/example.spec.ts` is a placeholder (does not run against the local app).
