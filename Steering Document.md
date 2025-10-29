
## Summary
- **Frontend:** React + Vite + TypeScript + Tailwind + PWA    
- **State/Data:** TanStack Query + Zustand + Zod validation    
- **Backend:** Firebase Auth + Firestore + Hosting (+ Functions optional)   
- **Android:** PWA → TWA (→ Capacitor if needed)    
- **Testing:** Vitest + Playwright + CI via GitHub Actions    
- **Privacy:** No child accounts, no ads, GDPR/COPPA aligned
   
Guiding Philosophy: **fully mainstream**, thoroughly documented, and future-proof for both small-scale MVP and later scaling.


## 📅 Phases
0. [[Setup]] — Environment, CI/CD, Firebase  
1. [[02_Phase1_MVP]] — Web core loop  
2. [[03_Phase2_Android]] — Play Store packaging  
3. [[04_Phase3_Expansion]] — Co-parent, streaks, reminders  
4. [[05_CrossCutting]] — Design, security, docs  
5. [[06_Metrics]] — KPI tracking and analytics

---
# ⭐ Star Rewards App — Steering Document (Web-First)

> A lightweight, privacy-respecting Web & Android app that lets an adult award “stars” to a child for completing tasks — turning routines into small wins.

---

## 1) Mission & Outcome

**Mission:**  
Make it effortless for adults to reinforce positive behaviour with immediate, visual feedback.

**Target Outcome (first 1–2 weeks):**  
Ship an MVP that supports one adult, one or more children, simple task lists, star awards, and redeemable rewards — built on a secure, free-tier cloud backend with real-time sync and offline capability.

**North-Star Metric:**  
Weekly active dyads (adult + child) who award ≥ 10 stars/week.

---

## 2) Users & Jobs-To-Be-Done

**Primary User:** Adult (parent, guardian, teacher, caregiver)  
**End Beneficiary:** Child (approx. 4–12 years)

**Adult JTBD**
- _When my child finishes a chore,_ I want to award a star **instantly** so they feel recognized.    
- _When behaviour slips,_ I want a **clear, consistent system** (tasks → stars → rewards) to stay on track.    
- _At week’s end,_ I want to **review progress** and redeem rewards easily.
   
**Child JTBD**
- _I want to see_ how many stars I have **right now** and what rewards I’m close to.
   
---
## 3) Product Principles

1. **One-tap delight:** Awarding a star ≤ 2 taps. 
2. **Kid-visible progress:** Big visuals, friendly colours, celebratory animations.    
3. **Secure & Synced:** Data private to the adult’s account; synced safely through the cloud.    
4. **Offline-capable:** Works without network, syncs automatically later.    
5. **Low cognitive load:** Defaults > settings; friction-free “happy path”.
    
---
## 4) MVP Scope

**Must-Have**

- **Adult Authentication** — Secure sign-in (Google, Passkey, Email/Password).    
- **Child Profiles** — Name + emoji/colour avatar; no photos.    
- **Tasks** — Title, optional category (Morning/School/Home), optional star value (1–3).   
- **Award Stars** — One-tap flow, haptics (on mobile) + confetti feedback.    
- **Rewards** — Simple catalogue with cost (20⭐ = Movie Night); redemption subtracts stars.    
- **History** — 30-day list of awards/redemptions.    
- **Cloud Storage** — Secure Firestore database scoped to the adult’s account.    
- **Cross-Platform Access** — Same app on web browser and installable on Android.
    

**Nice-to-Have (post-MVP)**

- Invite a second adult to manage same children.    
- Streaks / achievements / reminders.    
- Android home-screen widget.
    

**Out-of-Scope (v0.1)**  
Social features, ads, chat, child photos, public profiles, or location data.

---

## 5) UX Overview

- **Auth:** Simple adult-only login/signup screen.    
- **Home:** Child selector + large “Award Star” button + current balance + nearest reward.    
- **Tasks:** Checklist; checking grants a star; long-press to edit.    
- **Rewards:** Grid of rewards → redeem → celebration screen.    
- **History:** Timeline of star events and redemptions.    
- **Settings:** Manage children, tasks, rewards, account, export data.
    

---

## 6) Data Model (MVP)

### Structure

Firestore (NoSQL) with user-scoped collections:

```
/users/{uid}/children/{childId}
/users/{uid}/tasks/{taskId}
/users/{uid}/rewards/{rewardId}
/users/{uid}/starEvents/{eventId}
/users/{uid}/redemptions/{redemptionId}
```

### Schemas

**Child**

```
{ id, displayName, avatarToken, totalStars, updatedAt }
```

**Task**

```
{ id, childId, title, category?, starValue: 1–3, isActive }
```

**StarEvent**

```
{ id, childId, taskId?, delta: 1|2|3, createdAt: serverTimestamp }
```

**Reward**

```
{ id, title, costStars }
```

**Redemption**

```
{ id, childId, rewardId, costStars, createdAt: serverTimestamp }
```

**Star Balance = Σ(StarEvent.delta) − Σ(Redemption.costStars)**  
`totalStars` is cached in each Child doc and updated by a transaction or Cloud Function.

### Firestore Rules

```
match /databases/{db}/documents {
  match /users/{uid}/{collection=**}/{docId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

---

## 7) Architecture & Technology

### Platform

- **Primary:** Web App (React + Vite + TypeScript)    
- **Android:** Installable **Progressive Web App (PWA)**; packaged with **Trusted Web Activity (TWA)** for Play Store.    
- **Future:** Capacitor wrapper only if native APIs are required.
    

### Frontend

- **Framework:** React 18 + Vite + TypeScript    
- **Styling:** Tailwind CSS    
- **Data Fetching:** **TanStack Query** for server data, **Zustand** for UI state    
- **Forms & Validation:** React Hook Form + Zod    
- **PWA:** vite-plugin-pwa (Workbox) for offline caching & install prompts    
- **Testing:** Vitest + React Testing Library + Playwright E2E    
- **Lint/Format:** ESLint + Prettier + TypeScript strict mode
    
### Backend (BaaS)

- **Authentication:** Firebase Auth (Email/Password, Google Sign-In, Passkeys)    
- **Database:** Firestore (NoSQL + offline cache)    
- **Hosting:** Firebase Hosting    
- **Cloud Functions (optional):** maintain `totalStars`, sanitize writes    
- **Analytics (privacy-first):** Plausible or PostHog (EU hosted)
    

### Android Packaging

- **Stage 1:** PWA installable on Chrome/Edge (Android 8+/API 26+)    
- **Stage 2:** TWA for Play Store listing    
- **Stage 3:** Capacitor (if native haptics/notifications needed)
    
---

## 8) Privacy, Safety & Compliance

- Adult-only account; no child logins.
- No personally identifying data — nicknames + emoji avatars only.    
- Data encrypted in transit and stored securely in Firestore under the user’s UID.    
- Transparent privacy notice; no analytics beyond aggregate engagement.    
- GDPR / COPPA aligned.    
- Clear “Delete My Data” action for the adult account.
    

---

## 9) Success Metrics (MVP)

| Stage           | Metric                                                          | Target                     |
| --------------- | --------------------------------------------------------------- | -------------------------- |
| **Activation**  | Adult logs in → creates 1 child → adds 1 task → awards ≥ 1 star | ≥ 80 % of first-time users |
| **Engagement**  | Median stars per child per week                                 | ≥ 10                       |
| **Reward Loop** | Weeks with ≥ 1 redemption                                       | ≥ 50 %                     |
| **Delight**     | In-app thumbs-up after redemption                               | ≥ 70 % positive            |

---

## 10) Risks & Mitigations

| Risk                   | Mitigation                                       |
| ---------------------- | ------------------------------------------------ |
| **Scope creep**        | Strict feature freeze for v0.1 — only core loop. |
| **Privacy concerns**   | Transparent policy; offline cache + data export. |
| **Account loss**       | Firebase Auth password reset / Passkey recovery. |
| **Data inconsistency** | Firestore transactions + FieldValue.increment.   |
| **App fatigue**        | PWA install prompt + fast 2-tap flow.            |

---

## 11) Release Plan

### v0.1 (Web MVP)

- Build React + Vite app with Firebase Auth + Firestore integration.    
- Add vite-plugin-pwa for offline shell + installability.    
- Deploy to Firebase Hosting.    
- Validate end-to-end loop (auth → child → task → award → reward).
  
### v0.2 (Android Listing)

- Package the PWA as a **TWA** for Google Play.    
- Add optional native feel (app icon, splash screen, status bar colour).    
- Integrate mobile haptics via Web Vibration API; fall back gracefully.

### v1.0 (Expansion)

- Implement co-parent sharing (Firestore ACL / Custom Claims).    
- Add streaks / achievements / reminders.    
- Explore iOS Capacitor build or App Store TWA listing.
 

---

## 12) Acceptance Criteria (MVP)

- **Speed:** Award star → feedback visible < 150 ms (optimistic UI).    
- **Sync:** Star balances consistent after refresh and across devices.    
- **Offline:** App fully usable offline; pending changes sync on reconnect.    
- **Security:** Firestore Rules tested (allow/deny cases).    
- **Accessibility:** Keyboard & screen reader friendly.    
- **Bundle Size:** Initial JS ≤ 150 KB gzip.    
- **Android Min Version:** API 26 (Android 8+).    
- **No PII:** Child names / avatars non-identifiable.
    

---

## 13) Open Questions (Resolved)

| Topic                       | Resolution                                         |
| --------------------------- | -------------------------------------------------- |
| **Minimum Android Version** | API 26 (Android 8+).                               |
| **Per-Task Star Weights**   | Supported (1–3).                                   |
| **Per-Child Tasks**         | Supported.                                         |
| **Cross-Platform Sync**     | Core feature (via Firestore + offline cache).      |
| **Future iOS Support**      | Works as PWA now; Capacitor build later if needed. |

---
