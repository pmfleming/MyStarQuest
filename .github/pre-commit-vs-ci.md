# Pre-commit Hooks vs. Continuous Integration (CI) in MyStarQuest

This document reviews the current configuration of pre-commit hooks and Continuous Integration (CI) within the MyStarQuest project, evaluating their roles, overlaps, and potential areas for improvement.

## 1. Current State of Pre-commit Hooks

The project utilizes **Husky** combined with **lint-staged** to manage pre-commit hooks.

- **Hook Configuration (`.husky/pre-commit`)**: The hook simply runs `npx lint-staged`.
- **Lint-Staged Configuration (`package.json`)**:
  - For `*.{ts,tsx,js,jsx}` files: Runs `eslint --fix`.
  - For `*.{ts,tsx,js,jsx,css,json,md}` files: Runs `prettier --write`.

### Analysis of Pre-commit

- **Purpose**: The pre-commit hook is strictly focused on **code formatting and static analysis (linting)** of the _staged_ files only.
- **Pros**:
  - Fast execution because it only targets changed files.
  - Automatically fixes formatting (`prettier --write`) and fixable lint errors (`eslint --fix`) before they enter the repository.
  - Enforces a consistent code style locally.
- **Cons / Missing Elements**:
  - It **does not run type-checking** (`tsc -b`).
  - It **does not run unit tests** (`vitest run`).
  - Consequently, code with type errors or failing unit tests can still be committed locally.

## 2. Current State of Continuous Integration (CI)

The project uses **GitHub Actions** for CI, defined in `.github/workflows/playwright.yml`.

- **Triggers**: Runs on `push` and `pull_request` to the `main` and `master` branches.
- **Workflow Steps**:
  1.  Checks out code.
  2.  Sets up Node.js.
  3.  Installs dependencies (`npm ci`).
  4.  Installs Playwright browsers.
  5.  Runs **End-to-End (E2E) tests** (`npx playwright test`).
  6.  Uploads Playwright artifacts (reports) on failure/completion.

### Analysis of CI

- **Purpose**: The CI pipeline currently acts exclusively as an **E2E test runner** guarding the main branches.
- **Pros**:
  - Catches integration and UI regressions before they can be merged.
  - Offloads heavy browser-based testing from local machines.
- **Cons / Missing Elements**:
  - It **does not verify static code quality** (linting or formatting check).
  - It **does not run type-checking** (`tsc`).
  - It **does not run unit tests** (`npm test`).
  - If a developer bypasses local hooks (e.g., using `git commit --no-verify`), unformatted or lint-failing code can be pushed and merged because the CI doesn't act as a secondary gate for these checks.

## 3. The Gap: What's Missing?

There is a significant gap between the local pre-commit hooks and the remote CI pipeline:

1.  **Type Safety (TypeScript)**: `tsc -b` is not run automatically at any stage before building. A developer could commit and push code that fails to compile.
2.  **Unit Tests (Vitest)**: Unit tests are entirely manual. They are neither run locally on commit nor verified in the CI pipeline.
3.  **CI Validation of Lint/Format**: The CI trusts that local developers have run their formatting tools. If they bypass Husky, the CI will not catch the stylistic/linting regressions.

## 4. Recommendations for Improvement

To create a robust pipeline, the responsibilities should be balanced between fast local feedback (pre-commit) and comprehensive remote validation (CI).

### Recommendation 1: Enhance the CI Pipeline (Highest Priority)

The CI pipeline should be the ultimate gatekeeper. It must verify _everything_.

- **Action**: Update the GitHub Actions workflow (or create a new one, e.g., `ci.yml`) to include jobs for:
  - **Linting/Formatting**: Run `npm run lint` and `npm run format:check`.
  - **Type Checking**: Run `npx tsc --noEmit` (or simply rely on `npm run build` which includes `tsc -b`).
  - **Unit Tests**: Run `npm test`.
- **Rationale**: This ensures that regardless of local setups or bypassed hooks, bad code cannot be merged into `main`.

### Recommendation 2: Consider Adding Type-checking to Pre-push (Optional)

Adding type-checking to a pre-commit hook can be slow, especially in larger projects. A common compromise is a `pre-push` hook.

- **Action**: Add a `.husky/pre-push` hook that runs `tsc --noEmit` or `npm run build`.
- **Rationale**: Prevents developers from pushing code that doesn't compile, saving CI minutes and providing faster feedback, without slowing down every single local commit.

### Recommendation 3: Consider Running Relevant Unit Tests Pre-commit (Optional/Advanced)

- **Action**: Update `lint-staged` to run unit tests related to the changed files. Vitest supports this via `vitest related --run <changed-files>`.
- **Rationale**: Provides immediate feedback if a refactor breaks a specific unit test, without the overhead of running the entire test suite on every commit.

## Summary

Currently, **Pre-commit** handles local stylistic consistency (fast), while **CI** handles heavy integration testing (slow). However, the crucial middle ground—**Type Safety and Unit Testing**—is currently slipping through the cracks and relying entirely on manual developer execution. Strengthening the CI pipeline to encompass these checks is the most critical next step.
