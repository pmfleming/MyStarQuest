# MyStarQuest

An adult signs in, creates child profiles, sets up chores, learning checks, and rewards, then children earn stars for completing the day.

There are 4 areas:

- **Chores**: daily routines such as standard chores, eating timers, and water/toilet checks.
- **Tests**: lightweight learning activities for maths, place value, alphabet practice, and spelling.
- **Rewards**: a star shop where stars can be redeemed for configured rewards.
- **Time Explorer**: an interactive clock, school calendar, and day/night planet view for learning about time.

## Tech Stack

- React, TypeScript, Vite, and Tailwind CSS for the web app.
- Firebase Authentication, Firestore, Hosting, and Cloud Functions for backend services.
- Capacitor for Android packaging.
- Vitest, React Testing Library, and Playwright for tests.
- Three.js for the Time Explorer planet view.

## Project Structure

```text
src/
  App.tsx                         App routes and protected shell
  auth/                           Firebase authentication context
  components/                     Shared UI and activity components
  components/dayNightExplorer/    Time Explorer 3D and clock UI
  contexts/                       Active child, date, and theme state
  data/                           Firestore hooks and domain types
  lib/                            Business logic and date/solar helpers
  pages/                          Main tab pages and management screens
  ui/                             Chore/test/reward row descriptors
  assets/                         Theme, reward, alphabet, spelling, and clock assets

functions/
  src/index.ts                    Scheduled and callable Firebase functions

tests/
  unit/                           Business logic and descriptor tests
  component/                      React component tests
  e2e/                            Playwright flows

android/                          Capacitor Android project
docs/                             Planning and implementation notes
public/prototypes/                Earlier visual and interaction prototypes
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local Firebase environment file:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Sync the web build into the Android project:

```bash
npm run cap:build
```

## Quality Checks

```bash
npm run lint
npm run test
npm run test:e2e
npm run format:check
```

## Firebase Functions

The backend includes scheduled generation and reset helpers for daily chores/tests, plus a school-calendar HTTP function. Function code lives in `functions/src/index.ts`.

Install function dependencies separately when working in that folder:

```bash
cd functions
npm install
```

## Privacy Shape

MyStarQuest is designed for adult-managed use. Child profiles are simple in-app records, not child accounts, and the data model is scoped under the signed-in adult's Firebase user document.
