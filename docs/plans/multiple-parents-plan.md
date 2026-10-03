> Implementation: see [setup, migration and verification](../multiple-parents.md). The following records the approved design. Deployment and live email setup are separate release steps.

# Multiple parents for one child

Status: implemented locally; deployment and live email configuration remain release steps.
Prepared: 3 October 2026.

## Intended result

Each child has one admin parent and can have multiple secondary parents. The admin invites and manages secondary parents from that child's item in **Children**. Each invitee receives an email link, signs in with their own account, accepts access, and opens the invited child's activities.

Chores, tests, rewards, Time Explorer, and the child's theme remain available. **Children** and **Reset today** are absent from the secondary parent's menu. Direct URLs and backend requests enforce the same restrictions.

Access belongs to a particular child. An invitation does not grant access to the admin's other children or account settings. Adding a parent does not copy the child's live data into another parent's account.

### Confirmed product decisions

1. Secondary parents may create, edit, delete, and use chores, tests, and rewards for the invited child. Child profile administration and progress resets remain admin-only.
2. Keep Google sign-in only. The invitation email grants access after Google authentication; it is not a passwordless sign-in link. Invite the email address the recipient uses with Google.
3. Share saved completion state across parents. The current application deliberately keeps activity progress separate per device, so this requires an explicit change to progress semantics.

## User experience

### Admin parent

1. Open **Children** and find the child.
2. Expand a **Parents** section inside the existing child card.
3. See the admin parent, active secondary parents, and pending invitations.
4. Choose **Add parent**, enter an email address, and send the invitation.
5. Show invitation state: sending, sent, accepted, expired, revoked, or delivery failed. A sent email is not treated as accepted access.
6. Allow another invitation immediately; there is no single “second parent” slot.
7. Offer **Resend** and **Cancel invitation** for pending entries, and **Remove access** for active secondary parents.

The admin cannot remove themselves through this feature. Transferring admin ownership is outside this version. Inviting an existing member, an already-pending address, or the admin's own address returns an explanatory result without creating duplicate memberships.

### Invited parent

1. Open the email link on web or Android, with a working web fallback.
2. Sign in and verify the invited email address. If already signed into a different address, show **Switch account**.
3. Confirm **Accept invitation**. Merely opening a link does not consume it or grant membership.
4. Open the invited child directly on the Chores tab; restore that child on later visits.
5. Keep all normal activity tabs visible. Hide Children and Reset entirely, including keyboard navigation and accessibility discovery.
6. Show clear expired, cancelled, already accepted, or removed-access states.

For a parent invited to several children, provide a small **Switch child** chooser containing only accessible children. It selects a child; it contains no management controls. A person who is admin for their own child and secondary for another receives permissions for the currently selected child. They can return to their own child through this chooser.

### Permission matrix

| Action for the selected child                                           | Admin | Secondary                    |
| ----------------------------------------------------------------------- | ----- | ---------------------------- |
| View and use all activity tabs                                          | Yes   | Yes                          |
| Complete chores/tests and earn stars                                    | Yes   | Yes                          |
| Redeem rewards using the child's stars                                  | Yes   | Yes                          |
| Create/edit/delete chores, tests, rewards                               | Yes   | Yes                          |
| View the child's profile/theme as needed for activities                 | Yes   | Yes                          |
| Open Children management                                                | Yes   | No; hidden and route blocked |
| Rename/delete child, change theme/failure policy, manually adjust stars | Yes   | No                           |
| Invite/remove parents or change permissions                             | Yes   | No                           |
| Reset saved progress or reset today                                     | Yes   | No                           |
| Sign out or select another already-authorized child                     | Yes   | Yes                          |

Treat the reset restriction consistently: hide per-activity controls that clear saved progress as well as the global Reset today button. Keep ordinary unsaved gameplay actions and Time Explorer's return-to-current-time behavior available. Audit retry/restart paths so a secondary parent cannot clear an awarded attempt through a different control. Deleting and recreating an activity must not reset the original activity's completion history or duplicate its award.

## Findings in the current code

| Area                                                         | Current behavior                                                           | Required change                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/auth/AuthProvider.tsx`, `src/pages/LoginPage.tsx`       | Google sign-in on web and native; no invitation flow                       | Add invitation return state through existing Google sign-in              |
| `firestore.rules`                                            | Every business collection allows only `request.auth.uid == userId`         | Child membership checks and explicit action/field permissions            |
| `src/data/useUserCollection.ts`, `useUserDocumentUpdates.ts` | Paths use the authenticated parent's UID                                   | Separate the acting account from the child's owner namespace             |
| `src/data/useChildren.ts`, `ActiveChildProvider.tsx`         | Loads the signed-in account's children; selection stores child ID/theme    | Discover owned and invited children; store owner UID plus child ID       |
| `src/data/useRewards.ts`                                     | Rewards have no child ID and are shared across the owner's account         | Establish child-specific reward access before inviting secondary parents |
| `src/offline/runtime.ts`, `OfflineBoundary.tsx`              | Subscribes to every collection for one account                             | Subscribe and cache only authorized scopes                               |
| `src/offline/firebaseTransport.ts`                           | Rejects sync when signed-in UID differs from storage owner                 | Send scoped operations with independent actor/owner identities           |
| `src/offline/selectors.ts`                                   | Definitions are shared; progress is deliberately per device/day            | Implement shared saved completion across parents                         |
| `src/lib/starActions.ts`, `src/offline/transport.ts`         | Client transactions mutate balances/history; receipts deduplicate delivery | Validate shared-child business operations on the backend                 |
| `src/components/AppMenu.tsx`, `src/App.tsx`                  | Children and Reset are available to all authenticated users                | Capability-based rendering, route guards, and mutation checks            |
| `functions/src/index.ts`                                     | Reset callables assume caller owns child                                   | Explicit admin authorization for every reset entry point                 |
| `functions/package.json`                                     | No invitation email delivery integration                                   | Add server-side delivery configuration and an outbox                     |

## Data and access design

Keep existing child and activity paths under the original admin's namespace. This preserves child IDs, task IDs, and historical references while introducing sharing.

```text
users/{ownerUid}/children/{childId}
  Existing profile, theme, and balance; original owner is admin.

users/{ownerUid}/children/{childId}/parents/{parentUid}
  role: secondary
  status: active | revoked
  invitedByUid, invitedEmail, acceptedAt, revokedAt, membershipVersion

users/{parentUid}/childAccess/{scopeKey}
  ownerUid, childId, role, status
  Server-maintained discovery index; not the authority for access.

childInvitations/{inviteId}
  ownerUid, childId, normalizedEmail, tokenHash, expiresAt
  invitedByUid, state, acceptedByUid, acceptedAt, deliveryState

mailOutbox/{messageId}
  Server-only delivery job, invitation reference, attempt/status information.

users/{ownerUid}/children/{childId}/rewards/{rewardId}
  Child-specific reward definitions after migration.

users/{ownerUid}/children/{childId}/activityProgress/{progressKey}
  Shared saved progress, completion/attempt identity, and reset generation.
  Shared by all parents and devices accessing this child.
```

Use one membership document per secondary parent, allowing any number of parents without an ever-growing array on the child. Check that the child still exists on each authorization decision. Membership and discovery-index changes occur atomically. The index can be repaired from authoritative memberships; changing it alone cannot grant access.

Introduce a selected-child access context containing `actorUid`, `ownerUid`, `childId`, `role`, and capabilities such as `canManageChildren`, `canResetProgress`, and `canManageActivities`. Never replace the authenticated user's identity with the admin's UID.

### Existing rewards

Recommended migration: create a child-specific copy of the existing account-wide reward catalog for each existing child, keeping the original reward ID within each child's nested collection. Copy metadata and repeating behavior; preserve historical redemption records and mark the migration version. New rewards then belong to the selected child.

This deliberately changes the current account-wide reward editing behavior: an edit for one child no longer changes a sibling's catalog. Preserve old reward documents through rollout and provide a compatibility reader until migration is complete. Do not expose the entire owner's reward collection to a secondary parent as a shortcut. If account-wide catalogs must remain editable as a single catalog, design explicit child grants instead before implementation.

## Invitation and email lifecycle

Implement callable endpoints for `inviteParent`, `resendParentInvitation`, `acceptParentInvitation`, `revokeParentInvitation`, and `removeParentAccess`.

- Management endpoints verify the caller is the child's admin and the child exists. Acceptance verifies the authenticated, verified email matches the invitation, as well as token validity, expiry, and pending state.
- Generate a cryptographically random invitation secret; store its hash in the invitation document. Use a seven-day expiry as the proposed default. Resending rotates the secret and invalidates the old link.
- Acceptance is a transaction: validate the invite, create/reactivate membership, update the user's access index, and mark accepted. Repeating acceptance by the same account returns success without duplicating access. A different account cannot reuse it.
- Cancelled, expired, and revoked invitations cannot grant access. Email security scanners opening a URL must not activate it.
- Email states include queued, sent, and failed; track provider delivery/bounce information when available. Rate-limit sends/resends and use an idempotency key for each send request.
- Choose and configure a transactional email service with a verified sender domain. Keep credentials in server secrets. Render a short invitation naming the inviter and explaining the offered access, with an expiry and an accept link.
- The delivery job may need the generated link temporarily; keep that payload server-only, prevent it entering logs, and remove the secret-bearing payload after delivery. Membership documents and public invitation responses never expose the secret.
- Preserve invitation state through sign-in and browser refresh. Return URLs must be approved app routes. Avoid including the recipient's email in the link as a substitute for verifying it.

Keep the existing Google authentication flow. The email contains an application invitation URL, such as `/invite/{inviteId}` with a separate secret, and does not require Firebase email-link authentication. An authenticated Google account must match the invited verified address before acceptance. Normalize addresses consistently for comparison without inventing alias rules or treating different addresses as the same person. Later visits use ordinary Google sign-in and the persisted membership; the invitation link is not needed again.

Host invitation landing routes on the existing web domain, with Android App Links and a web fallback. Preserve the invitation through the Capacitor Google sign-in flow and a browser refresh. Use supported platform links; Firebase Dynamic Links has been retired. [Firebase Dynamic Links shutdown](https://firebase.google.com/support/dynamic-links-faq).

## Backend enforcement and shared activity writes

1. Replace the existing broad owner-only rules with explicit rules for owned and shared data. Adding a restrictive rule beside an existing broad allow rule does not remove that allowance.
2. Secondary parents may read the exact shared child profile and that child's activity documents. Child profile writes, parent lists, invitations, and account settings remain restricted. Profile reads necessarily include the theme and balance needed by the app; hiding Children does not mean denying all profile reads.
3. Existing root chores/tests queries must constrain `childId`; use exact child reads and nested reward queries. Do not subscribe to all of an owner's children or activities and filter them in React. Firestore authorizes the possible query result, rather than filtering unauthorized documents out. [Firestore query authorization](https://firebase.google.com/docs/firestore/security/rules-query).
4. For shared children, route business mutations through a callable operation endpoint. Validate current membership, target child/entity, operation kind, allowed fields, and immutable ownership. Validate both old and new scope on edits; a secondary cannot move an item to another child.
5. The backend determines reward cost, star award, completion eligibility, and permitted state transitions. It must not trust caller-supplied star deltas, roles, timestamps, or arbitrary document patches. Trusted server SDK code performs its own checks because it bypasses client rules. [Firestore rule structure](https://firebase.google.com/docs/firestore/security/rules-structure).
6. Commit the activity/reward change, balance, audit record, and operation receipt in one transaction. Include `actorUid`, child scope, and device ID in records. Membership revocation must be checked in the same transactional decision as a queued write.
7. For children using the shared backend, deny direct client writes to protected balances/progress/history for admins and secondaries alike. Admin profile operations use explicit APIs/field rules. This prevents older clients bypassing the new business checks.
8. Scope receipt IDs and results to actor plus child, and verify authorization even when returning a saved receipt. Replaying an operation cannot spend or award stars again.

### Progress across parents

Use one canonical progress state per child, activity, local date, and permitted attempt/reset generation. Completing a chore or test updates the state seen by every parent. Use a child-level timezone/day boundary so travel or different device timezones cannot split the same activity into inconsistent days. Local devices may keep in-progress UI details, but reconcile against accepted shared completion. An admin reset advances the generation; delayed writes from the old generation cannot restore cleared progress or re-award it.

Test simultaneous completion by two parents, different operation IDs for the same completion, and competing reward purchases. Completion deduplication must use business identity as well as delivery receipts. Reject a purchase if the authoritative balance is insufficient; do not silently clamp the charge and report a successful purchase.

This phase needs an explicit migration from the current device-specific progress. Preserve already-earned balances and audit records; importing old progress must never award stars again. Define a cutover date/generation and handle queued older operations before switching that child.

For tests, distinguish an authorized new attempt from reopening an already-saved result. Keep existing retry/practice behavior where it does not erase saved progress or re-award a completed attempt. Eating/water timers and other in-progress fields need deterministic reconciliation; do not use device-local completion as the authority after cutover.

## Offline operation and revocation

- Namespace local state by authenticated actor plus owner/child scope. Include the scope in IndexedDB keys, active-child selection, broadcast channels, queued operations, and request receipts. Prevent same-ID collisions across different owners.
- Update both the offline path and the existing online fallback. Replacing UID arguments only in React hooks would leave the transport's identity check and account-wide subscriptions incorrect.
- On child/account changes, clear old visible data immediately and cancel subscriptions before showing another scope. Revalidate capabilities before rendering management controls.
- Invitations, acceptance, resend, and revocation require an online connection. Existing authorized activity use may continue offline, with changes marked pending until the backend accepts them.
- Recheck membership before replaying every pending operation. On revoked access, stop subscriptions/sync, clear the shared child's visible cached data, invalidate selection, and mark unsent changes rejected rather than retry forever. Re-invitation must not silently replay operations from a revoked membership generation.
- Revocation blocks new server access immediately. Previously downloaded data on a disconnected device cannot be recalled remotely; the app clears it when revocation becomes known. Do not promise instantaneous offline erasure.
- Concurrent offline changes may be rejected on reconnect, especially duplicate completion or purchases. Reconcile optimistic stars/progress with the server and explain the rejected change to the parent.

## Delivery sequence

### 1. Define scope and permissions

Apply the confirmed permissions, Google-only sign-in, and shared completion requirements. Finalize reward catalog migration and reset semantics. Add shared access types and capability helpers. Inventory all direct reads/writes, reset/retry actions, and background subscriptions. Keep invitations disabled.

### 2. Add memberships and backend authorization

Implement membership/index storage, rules, transactional operation handling, audit attribution, and reset authorization. Add Firestore/Functions emulator coverage before allowing any secondary account to access production data.

### 3. Introduce scoped application data

Add access discovery/selection; update providers, hooks, reward paths, caches, and sync. Migrate existing reward catalogs with a resumable dry-run/report mode. Implement and migrate shared progress. Verify existing admin behavior and pending offline queues.

### 4. Add invitations and sign-in

Implement lifecycle endpoints, outbox processing, email templates, invitation landing/acceptance pages, and return state through existing Google sign-in. Verify web and Android handling, including browser fallback and an already-signed-in wrong account.

### 5. Add parent controls and restricted navigation

Extend each admin child card with its Parents section. Add invite/resend/cancel/remove UI and delivery feedback. Hide Children and Reset for secondary context; guard the Children URL and every restricted action. Add the selection-only child chooser when several children are accessible.

### 6. Roll out gradually

Back up relevant documents, run migration dry runs, and validate counts and references. Deploy backward-compatible backend/schema support before the new client. Require a compatible client before enabling sharing for a child; an old client's broad queries or direct writes must fail safely with an update message. Enable for a test family, verify two independent parent accounts, then broaden rollout. Preserve migration markers and legacy data until verification is complete.

Disabling the invitation feature is a safe rollout stop. Do not roll security rules back to a broadly writable state. Keep existing membership enforcement and data compatibility while fixing client problems.

## Acceptance checks

- An admin invites two different parents from one child card; both receive email and independently gain access to that same child.
- A new account and an existing account can accept; wrong-email, expired, revoked, reused, duplicate, and concurrently accepted invitations behave correctly.
- Invitation acceptance through Google sign-in works on web and Android; reopening a consumed invitation does not act as a permanent login link. Other Google accounts cannot accept the recipient's invitation.
- Secondary accounts can use every activity type and redeem rewards, including images/overlays and the child's theme. Editing controls follow the agreed activity-management policy.
- Children and reset controls are absent for secondary context. Direct navigation, forged callable requests, direct Firestore writes, and queued reset operations are denied.
- A shared parent cannot read sibling profiles, sibling activity/reward data, another parent's account settings, invitation secrets, or private membership lists.
- Switching among owned and invited children changes permissions and data without stale content or an admin-control flash.
- Concurrent completions, redemptions, retries, offline replay, and admin resets preserve the agreed progress semantics and correct star totals.
- Removing access stops connected use and blocks queued operations on reconnect. Child deletion invalidates all memberships and pending invitations, with idempotent cleanup of indexes.
- Reward/progress migrations are resumable and do not duplicate rewards or star awards. Existing historical records still resolve.
- Run emulator authorization tests, component/navigation tests, multi-account browser tests, offline reconnect tests, native link checks, lint, and frontend/functions builds.

## Configuration needed before release

- Transactional email service, verified sender address/domain, and delivery credentials.
- Existing Firebase Google authentication settings and authorized app/link domains.
- Web/Android link association and minimum supported app version.
- Migration report, backup, and test-family accounts with at least two separate parents.

These are release inputs. Preparing this plan does not send invitations, change accounts, migrate data, or deploy backend rules.
