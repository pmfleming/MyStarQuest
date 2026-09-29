# Dependency upgrade — 29 September 2026

Upgraded the web app, JavaScript/TypeScript tooling, Firebase Functions, and Android build and runtime libraries. Versions were checked against the npm registry, Google Maven, Maven Central, the official Android SDK repository, Gradle releases, and GitHub releases on 29 September 2026. Existing application changes are preserved.

## Main versions

| Component                         | Previous              | Updated                     |
| --------------------------------- | --------------------- | --------------------------- |
| React / React DOM                 | 19.2.8                | 19.3.0                      |
| Vite                              | 8.2.2                 | 8.3.1                       |
| Vitest (manifest)                 | 4.0.17                | 5.0.2                       |
| jsdom                             | 27.4.0                | 30.1.1                      |
| Playwright                        | 1.62.1                | 1.63.0                      |
| TypeScript                        | 6.0.2                 | 7.0.2 compiler / 6.0.3 API  |
| ESLint                            | 10.9.1                | 10.11.0                     |
| Three.js                          | 0.185.1               | 0.186.1                     |
| Firebase web SDK                  | 12.18.0               | 12.19.0                     |
| Firebase Admin                    | 14.3.0                | 14.5.0                      |
| Firebase Functions                | 7.3.2                 | 7.4.0                       |
| Capacitor                         | 8.5.1                 | 8.5.2                       |
| Capacitor Firebase Authentication | 8.5.0                 | 8.5.2                       |
| Firebase CLI                      | external installation | 15.32.0, project dependency |
| Node.js development / CI          | 22 minimum / CI 22    | 24.21.0 LTS                 |
| Firebase Functions runtime        | 22                    | 24                          |
| npm                               | 11.7.0                | 12.1.0                      |
| Java build JVM                    | JetBrains 21          | Temurin 25 LTS              |
| Gradle                            | 9.5.0                 | 9.8.0                       |
| Android Gradle Plugin             | 9.3.2                 | 9.4.1                       |
| Android compile SDK / target      | 36 / 36               | 37.2 / 37                   |
| Android Build Tools               | AGP default 36.0.0    | 37.0.0                      |
| Android Firebase BOM              | 34.11.0               | 34.19.0                     |
| Android WorkManager               | 2.11.2                | 2.12.0                      |
| Google Play Services Auth         | 21.5.1                | 21.6.0                      |
| Android credentials libraries     | 1.2.0-rc01            | 1.6.0                       |
| Google ID library                 | 1.1.0                 | 1.2.1                       |
| Cordova Android framework         | 14.0.1                | 15.1.0                      |

All other direct npm dependencies are at their current stable registry versions, except Node type definitions, which match Node 24, and the TS6 compatibility API described below. AndroidX Activity, AppCompat, Core, Fragment, WebKit, and the JSON test library were also updated. GitHub Actions now use checkout 7.0.1, setup-node 7.0.0, and upload-artifact 7.0.1.

## Compatibility decisions

- **TypeScript 7.0.2 with the TS6 API:** both manifests use `@typescript/native: npm:typescript@7.0.2` and `typescript: npm:@typescript/typescript6@6.0.2`. The compatibility package resolves the TS6 API to 6.0.3 in both lockfiles. Existing build scripts select TS7 through `tsc`; ESLint and compiler-API consumers retain TS6, and `tsc6` is available for diagnostic comparison. This follows [Microsoft's documented aliases](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0).
- **Google Play Services Auth 21.6.0:** version 22.0.0 removes `GoogleSignIn` and `GoogleSignInClient`, which Capacitor Firebase Authentication 8.5.2 still calls. The release shrinker caught the missing classes. A strict version constraint preserves sign-in; no missing-class warnings were suppressed.
- **Node 24 and Java 25:** current LTS lines. Firebase CLI 15.32.0 declares Node 24 GA support. Capacitor continues to emit Java 21 bytecode. Node type definitions stay on the 24.x line.
- **Android 37 targeting:** removed the obsolete large-screen portrait opt-out. Android 37 controls large-screen orientation and resizing; the phone portrait declaration remains.

## Tooling and reproducibility

- Both npm lockfiles were regenerated and compatible transitive audit fixes applied. npm 12 install scripts are explicitly approved by package version for Firebase util, protobufjs, and the Firebase CLI native RE2 module.
- `.nvmrc`, package engines, CI and Firebase runtime configuration are aligned. The Windows validations used a verified portable Node 24.21.0 and npm 12.1.0; the machine-wide Node installation was not replaced.
- Vite scans only application and test-fixture HTML entry points, and its watcher ignores native build outputs, scratch files and quality reports. This fixed cold-start browser-test timeouts and generated-report reloads.
- The Gradle wrapper, wrapper JAR and scripts were regenerated with the official 9.8.0 distribution SHA-256. Java 25 provisioning is recorded in Gradle daemon criteria.
- Nix input updated to `7a0f122f5090cf4c2ade2a13a0e229d4e19ba71f`. The NAR hashing procedure was checked against the previous lock hash before calculating the new one. The shell pins Node 24.21.0 source and adds Google SDK 37.2 metadata because the current Nix catalogue stops at 37.1. Nix evaluation/build could not be run on this Windows machine.

## Validation

- Clean npm 12 install from the committed manifest/lockfile contents: passed in a separate scratch directory.
- Web production build, Functions build, ESLint and Prettier: passed.
- Vitest 5: **144 tests across 62 files passed**.
- Quality-report scripting: **2 tests passed**.
- Full TypeScript Quality Lens 0.3.0 audits: **zero blockers** in the frontend and Functions. Frontend retains 49 review warnings; Functions has none.
- Playwright 1.63: **24 tests passed** across Chromium, Firefox and WebKit, covering both fractions themes and offline queue behavior.
- Production offline browser checks: **2 tests passed**.
- Android debug APK, optimized release APK, instrumentation APK compilation and **3 native unit tests**: passed with Gradle 9.8.0 and Java 25.
- No Android device was attached during validation, so instrumentation execution and phone installation were not performed. Release APK is unsigned.
- npm audit: **zero vulnerabilities in web production dependencies and Functions**. Development tooling retains **7 moderate findings** through Capacitor CLI / Firebase CLI transitive dependencies (`uuid` and OpenTelemetry). Automatic breaking downgrades were not applied.

Detailed command logs and registry snapshots are in the ignored `output/dependency-upgrade/` directory.

### TS7 alias migration

After adopting the aliases in both packages, the web production build, Functions
build, ESLint and the two quality-report scripting tests passed. A separate clean
npm 12 install confirmed that `tsc` resolves to 7.0.2, `tsc6` resolves to 6.0.3,
and importing `typescript` exposes the TS6 `createProgram` API. No application
source or build-script changes were needed. The full Vitest suite passed during
the subsequent Quality Lens audit. Frontend and Functions audits both completed
with zero blockers; frontend review warnings remain at 49. Migration logs are in
`output/ts7-migration/`.
