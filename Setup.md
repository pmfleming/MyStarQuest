[[Steering Document]]
**Goal:** Prepare environment, repository, Firebase, and CI/CD.

## Tasks

- [x] Create GitHub repository and branch rules
- [x] Configure Vite + React + TS + Tailwind + ESLint + Prettier + Husky
- [x] Setup Vitest + Playwright testing
- [x] Create Firebase project (Auth, Firestore, Hosting)
- [x] Deploy initial scaffold to Firebase Hosting
- [ ] Configure GitHub Actions for CI/CD
- [ ] Add Plausible/Post Hog analytics setup (optional)

# Configuration

NPM: https://nodejs.org/en

```powershell
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss postcss autoprefixer
npm install -D @tailwindcss/cli
npx tailwindcss init -p
npx husky init
"npx lint-staged" | Out-File -Encoding utf8 .husky\pre-commit
npm run lint
npm init playwright@latest
npm install firebase
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

1. Creates a new project using **Vite** (a fast web app build tool), right in the **current folder (`.`)**. It uses the **React + TypeScript** starter template.
2. Installs the tools you need to use **Tailwind CSS** (a styling framework).
3. Installs the **Tailwind CLI tool** this lets you run Tailwind directly from the command line (e.g. `npx tailwindcss build ...`) without needing a full PostCSS setup.
4. Creates Tailwind’s **configuration files** so you can customize it.
5. **Husky** is a small tool that lets you automatically run scripts when you use **Git** for example, before you **commit** or **push** code.
6. **Lint** (or “linting”) means **automatically checking your code for problems** like typos, style issues, or common bugs _before_ it runs.
7. **Playwright** is a tool made by Microsoft that lets you **automate and test web browsers**
8. Install the Firebase SDK - **Google’s all-in-one backend platform** for web and mobile apps
9. Link the CLI to your Firebase projects
10. Interactive setup of Furebase
11. Builds your production-ready static files
12. Uploads your built app (`dist/`) to Firebase Hosting

### Tailwind

- Default styles were deleted. The new index.css now only contains the three Tailwind “starter” commands that pull in all Tailwind styles.
  - @tailwind base;
  - @tailwind components;
  - @tailwind utilities;

### Main Screen

- App.tsx file (the main screen) was simplified to show a small “Hello World” message styled with Tailwind : a quick test that it’s working.
- Added a smoke test (App.test.tsx) plus setupTests.ts; Vitest is configured

## Firebase

1. Create Your Project in the Firebase Console: (https://console.firebase.google.com/).
2. (`</>`) to register your new web application.
3. Enable the Required Firebase Services: Authentication:, Database, Hosting.
4. Connect Your Local App to Firebase
