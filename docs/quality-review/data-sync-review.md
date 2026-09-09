# Cross-platform data sync review

Reviewed 9 September 2026.

## Conclusion

The local app, Firebase Hosting site, and Android assets checked here use Firebase
project `mystarquest-1b6f8`. Persisted data lives under `users/{Firebase Auth UID}`.
Clients must use the same Google account and select the same child to compare data.
This is a configuration and code-path verification, not a live three-client data test.

| Data                               | Storage and subscription                                                     | Result                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Child theme                        | `children/{childId}.themeId`, children snapshot listener                     | Fixed a stale local theme overriding subsequent remote theme changes.                             |
| Star balance                       | `children/{childId}.totalStars`, children snapshot listener                  | Shared; completion updates the task, balance and deterministic daily star event in a transaction. |
| Chore progress                     | `chores/{taskId}` activity fields, child-filtered snapshot listener          | Completion, dinner bites/timer state, and water/toilet state are persisted.                       |
| Test outcome                       | `tests/{testId}.lastAttemptedAt`, `lastAttemptDateKey`, `lastAttemptOutcome` | Completed/failed/reset status is persisted and reconstructed by other clients.                    |
| Unfinished test round              | React component/hook state                                                   | Not shared: question, answer, problem index and mistake history cannot resume on another client.  |
| Large Numbers operation/difficulty | Component state                                                              | Not shared or retained across component remounts.                                                 |
| Selected child                     | Per-user localStorage                                                        | Device-local; each device may select a different child.                                           |

## Verification

- `.env.local`, `.firebaserc`, and `android/app/google-services.json` agree on the project.
- Retrieved the public Hosting entry `/assets/index-pQt-8LF3.js`: it contains the same
  project ID and exactly matches the entry bundled under Android's packaged web assets.
  Matching this entry is not proof that every lazy-loaded asset or an installed APK matches.
- Web Google sign-in and Android's Google credential bridge both sign in to the same
  Firebase JavaScript Auth instance used by the Firestore data layer.
- No Firestore emulator connection exists in application source.
- Firestore rules restrict these paths to the matching authenticated UID.
- A regression test drives profile snapshots through the real children, active-child
  and theme providers: cached theme correction, later remote theme/star updates, and
  local theme rollback after a rejected write pass.
- Focused profile, chore reset, test reset and star transaction suites: 18 tests passed.
- Production build passed. Lint passed with the existing eight React Refresh warnings.

## Fix

`useChildren` now reconciles the selected child's theme from the subscribed profile
(including optimistic edits). The local cache becomes a startup hint rather than a
permanent override. Rejected edits restore both the displayed theme and cached selection.
This source change has not been deployed or copied into an Android build.

## Limits and remaining work

No Android device was connected (`adb devices` returned no devices). No authenticated
live cross-client read/write comparison was performed and no production user data was
changed. A connected Android app and two signed-in browser sessions are needed to
confirm the installed applications against the same account/child.

The app enables Firestore's persistent cache. Ordinary queued writes synchronize after
reconnection; offline clients need not display identical values immediately, and
conflicting writes use last-write-wins semantics. Star completion/redemption uses
transactions, which require a connection. Snapshot failures and some configuration
write failures currently report to the console rather than a visible sync indicator.
See [Firebase offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
and [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).

After deploying the same source to Hosting and Android, a live acceptance check should
use a disposable child under the same signed-in account: change its theme, complete
a chore and a test, observe the balance/outcomes on the other clients and Firestore,
then reload both clients and check reset propagation. An unfinished-round handoff is
not currently supported and would need a separate persisted session design.
