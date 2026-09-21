# Poor-connection and offline behavior

The website and Android app now use the same durable action queue. Children, chores, tests, rewards, completed activities and pending changes are kept in account-scoped IndexedDB. An action reports success only after its local transaction commits. Delivery retries keep the same operation ID, and the existing server receipt protocol prevents a lost response from awarding stars or charging a reward twice.

## Behavior

- A previously loaded, signed-in account opens from its saved data. Changes work without waiting for Firebase, including offline reloads. First sign-in and the initial family-data download still require a connection.
- Sync pauses when the browser reports offline. A stalled send releases the queue after 20 seconds; retry uses exponential backoff up to one minute. Reconnection and returning to the app also retry. The timeout does not cancel a server commit, so its durable ID remains essential.
- Every browser tab reads and updates the latest account state within one IndexedDB transaction. Concurrent actions cannot overwrite each other or reuse sequence numbers. BroadcastChannel refreshes other open tabs; returning to a tab also reloads the saved state. Late duplicate acknowledgements cannot overwrite newer data.
- The website now follows Android's existing per-device/day progress model. Tabs in one browser profile share that device. Profiles/task definitions and balances sync across devices; activity completion/reset/consumption belongs to the device. Today's legacy web progress is imported once from the first full server snapshot so adopting local storage does not erase an existing completion. Later server snapshots do not undo local resets.
- An offline indicator distinguishes saved local changes from synchronized changes. New sign-in is disabled when the browser reports offline. Render failures have a Retry control without exposing technical error text.
- Calendar refresh retains its bundled/saved copy. Both fetch and native-bridge waits have deadlines, with late results ignored. Android's network body read has a total deadline so a connection that delivers data very slowly cannot hold the calendar lock indefinitely. Weather keeps its existing two-hour freshness limit, avoids known-offline requests, and refreshes on reconnection.

## Website page caching

A production-only service worker installs after the first paint. It saves the app HTML, built JavaScript, CSS, fonts and the globe's map data. Installation uses at most three simultaneous downloads. Artwork is cached as it is visited, with a limit of 128 media resources; it is not downloaded wholesale during startup. All original artwork and rendering settings remain unchanged.

Cached routes and code can reopen with no network. Artwork never downloaded, or evicted from the bounded cache, still needs a connection. Browser storage clearing or eviction removes offline availability and can remove unsynced data. Browsers without IndexedDB retain the existing server-backed behavior; storage failures are not silently downgraded to memory-only saves.

Failed installations leave the previous worker/cache intact. A new version waits until the old version's tabs close, keeping code and HTML consistent. Public static files use a dedicated cache; Firebase authentication helpers, APIs, cross-origin requests and writes are never intercepted. No account documents or authentication responses enter Cache Storage. `/sw.js` has a no-cache hosting header. Android skips worker registration because the APK already includes the full web assets.

The service worker lifecycle follows [MDN's service worker guidance](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers). Account writes retain the app's transaction/receipt protocol because [Firestore transactions require connectivity](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Verification

- The full 221-test unit/component suite passed. A subsequent focused run passed all six worker/migration checks, including an additional cache-storage failure test (222 tests now in the suite). Coverage includes stalled sync, same-ID retry, late responses, calendar bridge timeout, weather reconnect, legacy progress migration and failed worker installation.
- Six real IndexedDB recovery/concurrent-tab checks passed across Chromium, Firefox and WebKit. These include reload, two simultaneous writers, reward redemption and a dropped response after simulated server acceptance.
- Production Chromium tests cover offline route reload, code/font caching, sign-in connectivity UI and a synthetic saved signed-in family completing a chore, retaining its star balance and queued action after reload. The fixture uses no real account and blocks network traffic before injecting its local test session.
- TypeScript, ESLint, production build, Capacitor sync, Android debug assembly and Java unit tests passed.

Commands:

```text
npm test
npx playwright test tests/e2e/offline.spec.ts --workers=2
npm run build
npx playwright test --config playwright.offline.config.ts
npm run cap:build
cd android
gradlew.bat assembleDebug testDebugUnitTest
```

The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`. No hosting/rules deployment or installation on the physical phone was performed. The existing receipt rules must be deployed before distributing clients that use this queue; the local rules already contain those permissions. Physical Android airplane-mode and force-stop/reopen verification remains a release check, since the configured emulator system image is unavailable. Account sync runs while the app is open/reopened, not as a guaranteed background task after Android stops it; the school calendar retains its separate native scheduled worker.
