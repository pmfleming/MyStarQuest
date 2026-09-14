# Android offline implementation

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
