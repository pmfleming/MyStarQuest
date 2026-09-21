# Android offline implementation

The shared queue now also supports the website, with atomic concurrent-tab updates, bounded sync waits and offline page caching. See [network resilience](network-resilience.md) for the current behavior and verification.

Starting checkpoint: `e4d5cac` (reward celebration). Work stays on the local
`pm/android-offline` branch; remote deployment is a separate release action.

## Agreed behaviour

- Once signed in and loaded, Android reads and saves locally, including across
  app restarts and Firebase outages. Initial sign-in/data download needs internet.
- Completions, resets, and one-time consumption belong to each device. The same
  chore completed on two devices earns stars twice.
- One action has one durable ID. Retrying delivery never applies it twice.
- Rewards accepted locally remain accepted. Each debit clamps the shared balance
  at zero; overspending creates no debt against later earnings.
- Actions are delivered in device order. Across devices, the server processes
  transactions in arrival order; device clock times do not reorder balances.
- Activities are keyed by day, so delayed synchronization does not reset or
  complete a different day's activity. User-created definitions remain shared.
- Sync retries when the app is running or reopened. This does not promise
  background execution after Android stops the app.

## Commit stages

1. Persistent local store, per-device activities, durable action queue and tests.
2. Idempotent Firebase transport, receipts, retry/reconciliation and security rules.
3. Android data hooks, immediate local actions, daily rollover and sync status.
4. Recovery/integration verification, offline secondary data and release notes.

## Release requirement

Deploy the updated Firestore rules before distributing the new Android build.
The local commits do not publish rules, Firebase Hosting, GitHub, or a phone build.

## Completed implementation

- `bf9a684`: local checkpoint and this implementation plan.
- `ddfe914`: IndexedDB account snapshots, device identity and durable action queue.
- `91111a8`: transactional delivery receipts, ordered retries and Firestore rules.
- `1d2a784`: Android data hooks, local mutations and a small pending-sync indicator.
- Final recovery stage: atomic test outcomes, startup-cache protection, storage
  retry, stale calendar fallback, recent weather cache and recovery verification.

Android saves each activity and its delivery record in one IndexedDB transaction
before reporting completion. A server transaction applies the effect and creates
an immutable receipt together. Replaying the same action ID returns the receipt;
independent actions from another device have different IDs and both count.
Per-device sequence markers on child snapshots prevent a cloud update from
temporarily applying a pending star change twice.

Child profiles and task/reward definitions are shared. Progress, same-day resets,
and one-time consumption are local to the device. Activity history is stored in
`deviceActivities`; awarded stars and purchases also use the existing audit logs.
Only full server snapshots replace the Android snapshot: Firestore's partial
query cache cannot erase the phone's saved data during an outage.

The calendar can use previously downloaded holiday dates when refresh fails.
Weather survives a restart while it remains within the existing two-hour,
same-local-day usability limit; older weather is shown as unavailable.
Images, fonts and activity code ship inside the APK.

## Verification and remaining release checks

- Full serial unit/component run exercised 217 tests: 216 passed, with one new
  assertion requiring normalization of the parser's `undefined` empty timestamp.
  After correcting that assertion, all 32 focused offline/reset/cache tests passed.
- Added a further passing startup test for partial Firebase cache results and
  authoritative server deletion (218 unit/component tests in total).
- Playwright recovery scenario passed in Chromium, Firefox and WebKit, using real
  IndexedDB, page reloads, queued purchases, and a connection dropped after the
  simulated server accepted an action. Pure transaction tests cover two devices,
  duplicate delivery, zero-floor spending and arrival-order balances.
- ESLint, TypeScript/production build and Android `assembleDebug` were checked.

The transport tests use simulated Firebase responses, not the live service.
Before release, deploy the rules and smoke-test a signed-in phone in airplane
mode, force-stop/reopen it, complete/reset tasks and buy a reward, then reconnect
and confirm the balance on a second device. Repeat with two offline devices.

The new version must download the family data once while online before its first
offline session. Clearing app storage/uninstalling removes unsynced changes.
Signing out retains the account's local queue; it resumes after that same account
signs in. Sync runs while the app is active or reopened. Mid-question quiz state
is not universally restored, although saved outcomes and chore progress persist.
If a child or edited definition has been deleted remotely, delivery pauses with
an attention message and retains the queue; restoring access/the item is needed
before Retry can continue. There is no automatic conflict-discard control.
