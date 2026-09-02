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
- [x] **Profile Management (in "Settings" view):**
  - [x] Create the `Settings > Manage Children` view.
  - [x] Implement **CRUD** (Create, Read, Update, Delete) for **Child Profiles**.
  - [x] Form (using Zod) must include `displayName` and `avatarToken` (e.g., emoji/colour).
  - [x] Ensure `totalStars` is initialized to `0`.
  - [x] Ensure no photos or PII are requested (per `Privacy` section).

### Core Data Setup (Tasks & Rewards)

- [x] Task Management (in "Settings" view):
  - [x] Create the `Settings > Manage Tasks` view.
  - [x] Implement **CRUD** for **Tasks**.
  - [x] Form must include `title`, `childId` (to link to a child), optional `category`, and `starValue` (1, 2, or 3).
- [x] Reward Management (in "Settings" view):\*\*
  - [x] Create the `Settings > Manage Rewards` view.
  - [x] Implement **CRUD** for **Rewards**.
  - [x] Form must include `title` and `costStars`.
- [x] Firestore Rules:
  - [x] Implement the user-scoped security rules to protect all user collections (`children`, `tasks`, `rewards`, etc.).

### 4. The Core Loop: Awarding & Redeeming

- [x] Home Screen UI
  - [x] Build the Home view.
    - [x] Implement a **Child Selector** (if more than one child exists).
    - [x] Display the selected child's **Current Star Balance** (reading `Child.totalStars`).
    - [x] Display the "Nearest Reward" based on the child's balance.
- [x] Awarding Stars:
  - [x] Build the `Tasks` view (checklist).
  - [x] Tapping a task checkbox should trigger the star award.
  - [x] Implement the large "Award Star" button on the `Home` view (for ad-hoc awards).
  - [x] **Core Logic:** On award, execute a function that:
    - [ ] Creates a `StarEvent` document (with `childId`, `delta`, `createdAt`).
    - [ ] Atomically increments the `totalStars` field on the corresponding `Child` document (using `FieldValue.increment`).
  - [x] Implement **Optimistic UI** (< 150ms feedback).
  - [x] Add confetti and Web Vibration API feedback on success.
- [x] Redeeming Rewards:\*\*
  - [x] Build the `Rewards` view (grid of available rewards).
  - [x] Tapping "Redeem" triggers the redemption flow.
  - [x] **Core Logic:** On redeem, execute a function (ideally a transaction) that:
    - [x] Checks if `Child.totalStars >= Reward.costStars`.
    - [x] If true, creates a `Redemption` document.
    - [x] Atomically decrements the `totalStars` field on the `Child` document.
  - [x] Show a "celebration screen" on successful redemption.

---

## 4.5 Things we Didn't Think About

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
