# Multiple parents

Each child keeps their original parent as admin. In Children, open **Parents** on that child's card and invite a Google email address. There can be multiple secondary parents. They can use and manage chores, tests and rewards. Children settings, invitations and progress resets remain admin-only. The menu includes a selection-only child chooser when multiple children are available.

## Local verification

Install both dependency trees (`npm ci` and `npm ci --prefix functions`). Run:

```sh
npm test
npm run test:sharing
npm run lint
npm run build
npm --prefix functions run build
```

The sharing suite uses the `demo-mystarquest-sharing` Firestore emulator on port 8085. It tests real rules and transactional services with disposable accounts. Email delivery is mocked; no email is sent. Java 21+ must be available. Existing unit/component tests cover scoped offline persistence, reset controls, invitation acceptance and legacy behavior.

## Deployment configuration

Local commits do not deploy Firebase. Deploy the backend and rules before enabling the new client in production. The email worker uses Resend. Configure a verified sender and the public HTTPS origin in `functions/.env.<project-id>`:

```dotenv
INVITATION_APP_URL=https://mystarquest-1b6f8.web.app
INVITATION_EMAIL_FROM=MyStarQuest <parents@your-verified-domain.example>
```

Store the Resend API key in Firebase Secret Manager using `firebase functions:secrets:set INVITATION_EMAIL_API_KEY --project <project-id>`. Do not commit keys. Enable the Google sign-in provider, authorize the hosting domain in Firebase Authentication, and ensure the Functions service account can access the secret. Deployment needs a project with billing enabled for Functions, Secret Manager and outbound email traffic.

An unconfigured sender or origin rejects invitations. The Parents section displays email states from the outbox. **Sent** means the email provider accepted the message; it is not proof of inbox delivery. Temporary failures retry with the same provider idempotency key. Retries stop before its 24-hour window ends, or after 12 attempts. Use Resend to issue a fresh token after a failure. Monitor failed mailOutbox jobs without logging message links.

Invitation tokens expire after seven days, are hashed in invitation records, and appear in the URL fragment. Only the matching verified Google account can explicitly accept. Resend rotates the token; cancellation invalidates it. Removal revokes membership and increments its version, preventing old queued operations from replaying after reinvitation. Client writes cannot edit membership or invitation records.

## Android and browser links

The Android manifest handles `/invite/` links on the two Firebase hosting domains. The Capacitor App plugin handles cold starts and already-running links. The same URL works in the browser if Android does not open the app. Google sign-in stays inside the invitation page, preserving its fragment; switching accounts signs out both native Firebase and the web SDK.

For automatic Android App Links, publish `/.well-known/assetlinks.json` on the invitation origin using the actual release signing certificate's SHA-256 fingerprint and package `com.mystarquest.app`. Do not publish a guessed or debug certificate. Add any custom invitation domain to the Android manifest and set `VITE_INVITATION_APP_URL` when building the client. Certificate/domain verification and real Google invitation acceptance require a deployed backend and a test recipient; the local emulator does not verify these external services.

## Migration and rollout

Before first sharing, sync every device and back up the child's profile, activity definitions, deviceActivities, rewards, starEvents and redemptions. The invitation form refuses migration while this device has pending changes. Other devices must also finish syncing; the server cannot discover unsent device queues.

Run a dry report for the explicitly named child:

```sh
npm --prefix functions run build
node functions/scripts/migrate-child-sharing.cjs --project <project-id> --owner <owner-uid> --child <child-id> --allow-production
```

Add `--write` to perform the migration after reviewing the report and backup. Omit `--allow-production` when using `FIRESTORE_EMULATOR_HOST`. The admin invitation form uses the same migration service automatically.

Migration materializes the seven built-in tests so adding and deleting tests is shared across parents. A deleted test stays deleted; Add Test creates a new activity. Existing test settings are preserved. Reward cards include an editor for their name, image, cost and repetition.

Migration copies the existing reward catalog into the child's own reward collection, excluding already-consumed single-use rewards. It imports persisted device progress and today's legacy completion without changing the balance or awarding stars. Old documents remain available for audit. A temporary owner-level write lock prevents legacy writes during the copy; the migration lease prevents concurrent copies. A failed migration can be resumed after its three-minute lease expires. Re-running a completed migration returns `alreadyPrepared` without overwriting shared data. Do not remove a migration lock manually while a migration may be running.

After cutover, legacy clients cannot directly write this child's profile, activities or balances. Update all devices first. Each shared operation passes through a callable that rechecks membership, calculates awards/costs from stored definitions, and atomically records progress, balances, audit attribution and a receipt. Completion is unique per activity/date/reset generation. An admin reset advances that generation; stale operations are rejected. In-progress edits use a revision check; conflicting edits are reported rather than overwriting another parent's progress. One-time rewards and activities remain consumed across devices.

The child's timezone defaults to the app's existing Europe/London day boundary. It is stored on the child during migration, so devices in different timezones share one activity day. Offline operations can replay for up to 30 days after cutover; older operations are rejected with an explanatory status.

Local storage is scoped by actor, owner, child and membership version. Revocation purges downloaded child data when the device learns of it and prevents queued writes from reaching the server. Data on a disconnected device cannot be recalled until it reconnects. Browsers without durable IndexedDB use online-only saves.

Roll out first to a test family and two separate Google accounts. Verify email receipt, acceptance, cross-device activity completion, reward balance changes, removal and reinvitation before broader rollout. Roll back invitation availability if necessary; keep membership rules and canonical shared writes in place. Never restore permissive legacy write rules for an already-shared child.

## Verification on 3 October 2026

- 90 unit/component tests passed across 54 files.
- 13 Firestore emulator/service tests passed, including mocked email retries.
- TypeScript, production web build, Functions build, ESLint and formatting checks passed.
- Android debug build and three native unit tests passed.
- Three instrumentation tests passed on the connected Samsung SM-N975F (Android 12), including invitation intent resolution.
- Inspected the signed-in localhost Children page and Parents section without sending an invitation or modifying live family data.

Real email delivery, public Android domain association and two-account Google acceptance remain deployment checks. No backend/rules/hosting deployment or live migration was performed.
