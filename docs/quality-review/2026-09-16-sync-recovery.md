# Android sync permission failure

## Cause

The photographed message is the generic attention message from
`src/offline/sync.ts`. It covers permission, authentication, and invalid-argument
errors, so the message alone does not identify the cause.

Inspection of the live Firestore release for `mystarquest-1b6f8` confirmed that
the rules deployed on 13 September lacked both `syncReceipts` and
`deviceActivities`. Every offline delivery first reads a receipt; activities
also read and write device progress. These paths were denied even for the
correctly signed-in account. Signing out and back in cannot repair missing
server permissions.

The repository already contained the required owner-only rules and documented
their deployment as a prerequisite for the Android offline release.

## Resolution and verification

- Verified that the only difference between local and live rules was the two
  required sync collection blocks.
- Firebase's rules compiler accepted the local rules without issues.
- All 14 tests in the offline sync, Firebase transport, store, and runtime
  suites passed.
- Deployed with
  `firebase deploy --only firestore:rules --project mystarquest-1b6f8 --non-interactive`.
- Retrieved the live rules again and verified an exact match with the local
  file after newline normalization.
- Release updated at `2026-09-16T09:22:06.980165Z`; ruleset ID:
  `3e7eaf37-1438-4ba3-bc45-770f20d4593f`.
- Owner-only access remains enforced. Receipts permit reads and creation, but
  not updates or deletion. Existing collection rules are unchanged.

Before/after release metadata and source snapshots are saved locally under
`output/sync-diagnosis/` (ignored by Git).

## Phone recovery

While online, tap **Retry** or reopen the app to resume the existing queue.
An app update is not required for this server-side repair. Retain app storage:
clearing it or uninstalling would erase changes still waiting to sync.

## Connected phone verification

The phone was subsequently connected on 16 September. Inspection of its running
WebView and durable offline store confirmed no sync warning and zero pending
actions. A read-only comparison against production Firestore found all 30
delivery receipts, with every sequence from 1 through 30 present. The child's
local star balance and balance revision matched the server. This verifies that
the phone's existing queue recovered after the rules repair; no artificial
activities or star changes were added to the family account.

The sanitized result is saved in
`output/sync-diagnosis/phone-before-update.json`. No account tokens or child
profile data are included in that result.

Before the requested release, the production web build, Capacitor asset sync,
Android debug APK build, Cloud Functions TypeScript build, and all 156 tests
across 59 unit/component suites passed. Offline recovery also passed in Chromium,
Firefox, and WebKit. ESLint passed after rerunning it following a temporary
test-output-directory race with Playwright; document formatting passed.
