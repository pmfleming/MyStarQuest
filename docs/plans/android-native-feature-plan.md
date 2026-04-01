# Android-Only Native Component Plan

## Goal

Add an Android-only feature that:

- is implemented natively in Kotlin
- can call Android platform APIs directly
- is edited primarily in Android Studio
- is not visible or usable in the web app
- fits cleanly into the current Capacitor-based project structure

## Current Project Shape

The current application is:

- a React/Vite app under `src/`
- wrapped by Capacitor for Android
- hosted in Android through a `BridgeActivity` and a `WebView`

That means the Android app is currently a native shell around the web app, not a separately built native UI. Any true Android-only feature should therefore live under `android/` and be invoked from the Capacitor host.

## Recommended Architecture

Use a hybrid approach:

1. Keep the main app in React for shared/web functionality.
2. Build the new Android-only feature as a native Kotlin screen.
3. Expose a minimal Capacitor bridge so the React app can open that native screen when running on Android.
4. Hide the entry point entirely on web.

This keeps native code native, avoids duplicating the feature in React, and allows most day-to-day editing in Android Studio.

## Preferred Native Shape

The preferred implementation is:

- a Kotlin `Activity` or `Fragment` for the Android-only feature
- a Capacitor plugin written in Kotlin that launches that screen
- a minimal TypeScript wrapper that calls the plugin from the React app

### Why this shape

- The native feature remains fully inside the Android app.
- Android-only dependencies stay on the Android side.
- The React app only needs to know how to open the native feature.
- The web app can simply omit the trigger and never touch the native functionality.

## Implementation Plan

### 1. Enable Kotlin in the Android module

The Android project currently uses Java for `MainActivity` and is not yet configured as a Kotlin-first Android module.

Planned changes:

- add the Kotlin Android Gradle plugin
- add the Kotlin stdlib dependency if needed by the chosen Gradle/AGP setup
- confirm JVM target/toolchain settings match the existing Android build

Outcome:

- Kotlin source files can be added cleanly under `android/app/src/main/java/...`
- Android Studio becomes the natural primary editor for the native feature

### 2. Convert the Android host entry point to Kotlin

Convert `MainActivity.java` to `MainActivity.kt`.

Reason:

- keeps the Android host code consistent with the new Kotlin feature work
- simplifies future plugin registration or Android-specific host logic

This is not strictly required, but it is the cleaner long-term base.

### 3. Create the native Android feature screen

Add a dedicated native screen, likely one of:

- `NativeFeatureActivity.kt`
- `NativeFeatureFragment.kt`

Preferred default:

- start with an `Activity` because it is simpler to launch from a Capacitor plugin

UI approach options:

- Jetpack Compose if the goal is a modern Android Studio-first workflow
- XML layouts if the team prefers a more traditional Android view system

Recommendation:

- use Jetpack Compose unless there is a reason to stay with XML

Reason:

- better Kotlin-first ergonomics
- faster iteration in Android Studio
- clearer separation from the React UI

### 4. Add native API integration inside the Android feature

This screen should directly own the required native functionality.

Examples of responsibilities:

- requesting Android permissions
- calling platform services
- interacting with native SDKs
- handling lifecycle-aware Android behavior

Principle:

- keep native API usage inside the Android layer rather than pushing platform complexity into React

### 5. Add a Capacitor plugin as the bridge

Create a small Capacitor plugin in Kotlin whose job is to:

- expose a method such as `openNativeFeature()`
- launch the Android Activity
- optionally return results back to the web layer if needed later

The plugin should stay thin.

Principle:

- React should not know implementation details of the Android feature
- the bridge should only expose the minimum commands/data needed

### 6. Add a minimal TypeScript interface for the plugin

On the web/React side, add:

- a typed plugin wrapper
- a small helper for platform checking

Responsibilities:

- call the native plugin on Android
- fail safely or no-op on web

This layer should be intentionally small so the feature remains primarily native.

### 7. Hide the entry point on web

The feature must not be visible or usable in the browser/web app.

Planned behavior:

- only render the trigger on Android
- do not register a normal web route for the feature
- ensure web users cannot navigate into a broken placeholder screen

Practical approach:

- use Capacitor platform detection in React
- conditionally show the button/menu item only for Android

### 8. Decide how results flow back into the app

If the native feature produces data, choose one of these patterns:

- return data immediately from the plugin call
- emit plugin events back to the React layer
- persist data natively or through the app’s existing backend/data layer and then refresh the web UI

Recommendation:

- start with the simplest one-way launch unless the feature actually needs to return structured data

Do not overdesign the bridge before the feature contract is clear.

## Editing Workflow

## Primary tool

Use Android Studio as the main environment for:

- Kotlin code
- Compose or XML UI
- Gradle configuration
- manifest updates
- emulator/device debugging
- native logs and permission flows

## Secondary tool

Use the existing project terminal only when needed for:

- `npm run build`
- Capacitor sync
- web-side TypeScript wrapper changes

Recommended day-to-day workflow:

1. Open the repository root in Android Studio if possible.
2. Edit native files under `android/`.
3. Run the Android app from Android Studio.
4. Sync Capacitor when web assets or plugin definitions change.

## Project Areas Likely To Change Later

The future implementation will likely touch:

- `android/build.gradle`
- `android/app/build.gradle`
- `android/app/src/main/java/com/mystarquest/app/MainActivity.*`
- `android/app/src/main/AndroidManifest.xml`
- new Kotlin files under `android/app/src/main/java/com/mystarquest/app/...`
- a small plugin wrapper under `src/`
- one or two existing React screens/components to expose the Android-only entry point

## Decisions To Make Before Implementation

1. Should the native UI use Jetpack Compose or XML?
2. Should the feature be launched from a button inside the React app, or from native Android navigation?
3. Does the feature need to return data to React, or is it self-contained?
4. Does the feature need runtime permissions, background work, or special manifest configuration?
5. Should the Android host be converted fully to Kotlin now, or only as needed?

## Recommended Default Decisions

Unless a concrete requirement pushes otherwise, use these defaults:

- Kotlin for all new Android code
- Jetpack Compose for the native feature UI
- a dedicated Android `Activity`
- a thin Capacitor plugin to launch it
- a hidden-on-web React trigger
- minimal data exchange between native and React initially

## Risks And Constraints

- Capacitor sync/build steps must stay aligned when plugin definitions change.
- Native Android dependencies may require Gradle, manifest, and permission updates.
- If the feature becomes deeply integrated with app state, the bridge contract can grow too large unless kept disciplined.
- If web navigation assumes every feature is route-based, launching a native Activity may require a slightly different UX pattern.

## Suggested First Implementation Slice

When implementation begins, the safest first slice is:

1. enable Kotlin support
2. convert `MainActivity` to Kotlin
3. add a simple Capacitor plugin with `openNativeFeature()`
4. add a placeholder native Activity in Kotlin
5. add an Android-only button in the React app that launches it

That slice proves the architecture before any real native API work is added.
