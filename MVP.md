[[Steering Document]]

1. Authentication.
2. Core Data Setup.
3. Core Loop

```powershell

```

### Auth UI:

- [x] Create `Login` and `Sign-Up` pages (adult-only).  
      Implement auth logic hooks using Firebase Auth for:
  - [x] Google Sign-In
    - [x] Implement protected routes that redirect unauthenticated users.
- [ ] **Profile Management (in "Settings" view):**
  - [ ] Create the `Settings > Manage Children` view.
  - [ ] Implement **CRUD** (Create, Read, Update, Delete) for **Child Profiles**.
  - [ ] Form (using Zod) must include `displayName` and `avatarToken` (e.g., emoji/colour).
  - [ ] Ensure `totalStars` is initialized to `0`.
  - [ ] Ensure no photos or PII are requested (per `Privacy` section).

### Core Data Setup (Tasks & Rewards)

- [ ] Task Management (in "Settings" view):
  - [ ] Create the `Settings > Manage Tasks` view.
  - [ ] Implement **CRUD** for **Tasks**.
  - [ ] Form must include `title`, `childId` (to link to a child), optional `category`, and `starValue` (1, 2, or 3).
- [ ] Reward Management (in "Settings" view):\*\*
  - [ ] Create the `Settings > Manage Rewards` view.
  - [ ] Implement **CRUD** for **Rewards**.
  - [ ] Form must include `title` and `costStars`.
- [ ] Firestore Rules:
  - [ ] Implement the user-scoped security rules to protect all user collections (`children`, `tasks`, `rewards`, etc.).

### 4. The Core Loop: Awarding & Redeeming

This is the "one-tap delight" and primary job-to-be-done.

- **Home Screen UI:**
  - [ ] Build the `Home` view.
  - [ ] Implement a **Child Selector** (if more than one child exists).
  - [ ] Display the selected child's **Current Star Balance** (reading `Child.totalStars`).
  - [ ] Display the "Nearest Reward" based on the child's balance.
- **Awarding Stars:**
  - [ ] Build the `Tasks` view (checklist).
  - [ ] Tapping a task checkbox should trigger the star award.
  - [ ] Implement the large "Award Star" button on the `Home` view (for ad-hoc awards).
  - [ ] **Core Logic:** On award, execute a function that:
    - 1. Creates a `StarEvent` document (with `childId`, `delta`, `createdAt`).
    - 2. Atomically increments the `totalStars` field on the corresponding `Child` document (using `FieldValue.increment`).
  - [ ] Implement **Optimistic UI** (< 150ms feedback).
  - [ ] Add confetti and Web Vibration API feedback on success.
- **Redeeming Rewards:**
  - [ ] Build the `Rewards` view (grid of available rewards).
  - [ ] Tapping "Redeem" triggers the redemption flow.
  - [ ] **Core Logic:** On redeem, execute a function (ideally a transaction) that:
    - 1. Checks if `Child.totalStars >= Reward.costStars`.
    - 2. If true, creates a `Redemption` document.
    - 3. Atomically decrements the `totalStars` field on the `Child` document.
  - [ ] Show a "celebration screen" on successful redemption.

---

### 5. Supporting Views & PWA

These tasks complete the MVP user experience.

- **History View:**
  - [ ] Build the `History` view.
  - [ ] Create a query to fetch and display a combined, reverse-chronological list of `StarEvent` and `Redemption` documents.
- **PWA & Offline:**
  - [ ] Configure Firestore offline cache (should be on by default for web).
  - [ ] Test the core loop (award/redeem) while offline.
  - [ ] Verify that data syncs correctly upon reconnection.
  - [ ] Finalize `manifest.json` (app icon, name, theme colors) to ensure "Install to Home Screen" works correctly.

---

### 6. Testing, Validation & Deployment (v0.1)

This validates the `Acceptance Criteria`.

- **Testing:**
  - [ ] Write Vitest tests for business logic (e.g., star calculation).
  - [ ] Write Playwright E2E tests for the full "happy path":
    - `Sign up > Create Child > Create Task > Award Star > Verify Balance > Redeem Reward > Verify Balance`.
  - [ ] Test Firestore Rules (using emulator) to ensure users cannot read/write each other's data.
- **Deployment:**
  - [ ] Run `vite build` and deploy the `dist` folder to **Firebase Hosting**.
  - [ ] Manually validate the end-to-end loop on the live URL.

---
