# CI/CD and Git Hooks Configuration

This document outlines the Continuous Integration (CI) and local Git hooks configuration for the MyStarQuest repository. The setup is designed to provide fast local feedback for formatting and style, while ensuring a strict, comprehensive verification pipeline on the remote server before any code is merged.

## 1. Local Git Hooks (Pre-commit)

The project uses **Husky** and **lint-staged** to enforce code quality automatically before a commit is created. This provides rapid feedback and automatic fixes for staged files.

### Configuration

- **Husky**: Configured via the `prepare` script in `package.json`. The pre-commit hook is located at `.husky/pre-commit` and runs `npx lint-staged`.
- **lint-staged**: Configured in `package.json`. It runs the following commands _only_ on the files staged for commit:
  - `*.{ts,tsx,js,jsx}`: Runs `eslint --fix` to automatically resolve fixable linting errors.
  - `*.{ts,tsx,js,jsx,css,json,md}`: Runs `prettier --write` to automatically format files according to the project's style guide.

**Benefits**: Prevents simple formatting and stylistic errors from ever entering the Git history, keeping the codebase clean and reducing noise in code reviews.

## 2. Remote Continuous Integration (GitHub Actions)

A comprehensive CI pipeline is configured using GitHub Actions. It acts as the ultimate gatekeeper, ensuring that all code meets the project's standards for quality, type safety, and functionality.

### Workflow Configuration (`.github/workflows/ci.yml`)

The workflow triggers automatically on:

- `push` to `main` or `master` branches.
- `pull_request` targeting `main` or `master` branches.
- Changes under `public/prototypes/**` are excluded from triggering the workflow.

### Pipeline Jobs

The CI pipeline runs the following jobs in parallel on `ubuntu-latest` runners:

1. **Lint & Format**
   - Verifies code formatting: `npm run format:check`
   - Verifies static analysis: `npm run lint`
   - Prototype HTML files under `public/prototypes/` are excluded from formatting checks.
   - _Note: This ensures that even if local hooks were bypassed, unformatted or non-compliant code will fail the build._

2. **Type Check**
   - Verifies TypeScript compilation across the entire project: `npx tsc --noEmit`
   - Ensures no type errors are introduced.

3. **Unit Tests**
   - Runs the Vitest test suite: `npm run test`
   - Validates the functional correctness of individual units of code.
   - The current suite includes tests for:
     - **Core Application (`src/App.test.tsx`)**: Validates the main application routing and the mocking pattern for Firebase Auth.
     - **Date Utility (`src/lib/today.test.ts`)**: Validates pure functions handling current date calculations and season definitions.
     - **Chore Descriptors (`src/ui/unifiedChoreDescriptors.test.tsx`)**: Validates the unified UI descriptors that map chore data models to common list rows.
     - **Chore UI Definitions (`src/ui/choreModeDefinitions.test.ts`)**: Protects the shared preset-chore UI mode matrix (overview, editing, and in-chore states).

4. **E2E Tests (Playwright)**
   - Installs necessary browsers and runs End-to-End tests: `npx playwright test`
   - Validates critical user journeys and UI functionality in a real browser environment.
   - Uploads Playwright artifacts (reports) for debugging if the job fails.

## 3. Cross-Platform Consistency (`.gitattributes`)

Because development often occurs on Windows while the CI runs on Linux (`ubuntu-latest`), a `.gitattributes` file is present in the repository root.

### Configuration (`.gitattributes`)

```text
* text=auto eol=lf
*.bat text eol=crlf
```

### Purpose

- Forces Git to normalize line endings to Unix-style (`LF`) for all text files when committed to the repository, while ensuring they are checked out appropriately for the operating system.
- Prevents false-positive formatting errors in the CI pipeline where `prettier --check` on Linux might fail if a file was committed with Windows `CRLF` line endings.
- Explicitly keeps `CRLF` for Windows batch files (`.bat`).
