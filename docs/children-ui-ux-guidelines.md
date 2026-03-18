# Children UI/UX Guidelines (Current App Design)

This document is the implementation-facing UI/UX reference for the current MyStarQuest experience.

It replaces older exploratory guidance and should be treated as the source of truth for how child-facing and caregiver-facing screens are built in this repo today.

## 1) Scope and Principles

- Keep interactions simple, immediate, and obvious.
- Prioritize large touch targets and clear visual hierarchy.
- Reuse existing components and tokens instead of inventing new styles.
- Preserve playful theme personality while keeping layout structure consistent.
- Do not hard-code ad-hoc sizing when a token already exists.

## 2) Canonical Layout System

The app uses a phone-frame layout with a centered device shell.

### `PageShell` contract

- Outer canvas centers a simulated device on desktop.
- Device surface uses theme background (`theme.colors.bg`) plus theme pattern (`theme.bgPattern`).
- Content area has standard page padding and always supports scrollable inner content regions.

### Required sizing tokens (`src/ui/tokens.ts`)

Use these values directly through `uiTokens`:

- `pagePaddingX`: 24
- `pagePaddingTop`: 4
- `pagePaddingBottom`: 16
- `sectionGap`: 2
- `singleVerticalSpace`: 24
- `doubleVerticalSpace`: 48
- `contentMaxWidth`: 340
- `actionButtonHeight`: 88
- `actionButtonRadius`: 30
- `actionButtonFontSize`: 28
- `actionButtonIconSize`: 48
- `actionButtonArrowSize`: 32
- `topIconSize`: 44
- `topIconBorder`: 4
- `deviceMaxWidth`: 414
- `deviceMinHeight`: 896

### Layout rules

- Main page content should be constrained to `uiTokens.contentMaxWidth` and centered.
- Vertical rhythm should use `singleVerticalSpace` or `doubleVerticalSpace`.
- Primary buttons should respect `actionButtonHeight` (88px).
- Top icon controls should use `TopIconButton` (`44x44` target with themed border/glow).

## 3) Theme System (Current)

Themes are defined in `src/contexts/ThemeContext.tsx` and must drive colors/fonts/patterns:

1. **space** — Galactic Explorer
2. **nature** — Sunny Meadow
3. **cartoon** — Super Squad
4. **princess** — Royal Kingdom

Each theme provides:

- `colors`: `bg`, `surface`, `text`, `primary`, `secondary`, `accent`
- `fonts`: `heading`, `body`
- `bgPattern`
- `confetti` emoji set

### Theme usage rules

- All new page/component styles should derive from `theme.colors` and `theme.fonts`.
- Do not introduce new hard-coded palettes for core surfaces/buttons/text.
- Maintain per-theme readability (for example, `space` often uses dark background + high contrast accents).

## 4) Core Reusable Components

Prefer these components over custom one-off UI:

### `PageHeader`

- Left-aligned title with optional right action cluster.
- Header height aligns with `uiTokens.topIconSize`.

### `TopIconButton`

- Circular icon action for top-right utilities (home, children, exit).
- Uses `getTopIconStyle(theme)` for theme-consistent border/glow.

### `ActionButton`

- Used for large primary navigation/actions.
- Uses `getActionButtonStyle(theme, baseColor)` and tokenized sizing.
- Supports route links (`to`) and callbacks (`onClick`).

### `ActionTextInput`

- Inline editable title/name field styled to match action-button visual language.
- Supports auto-commit on blur / Enter.

### `StandardActionList`

- Shared list framework for Children, Chores, and Rewards management.
- Provides:
  - Animated whimsical cards
  - Primary action slot
  - Optional edit/delete utilities
  - Add card or inline “new row” editor
  - Optional star count display per row
- In princess theme list rows, edit/delete should use princess SVG assets (not text labels).

## 5) Page-Level UX Patterns

## Dashboard (`/`)

- Header shows active child name.
- Top-right controls: Children selector and Exit.
- Star balance displayed via `StarInfoBox`.
- Main actions:
  - `Chores` (`/settings/manage-tasks`)
  - `Rewards` (`/settings/manage-rewards`)

## Manage Children (`/settings/manage-children`)

- `StandardActionList` rows contain:
  - Editable child name (`ActionTextInput`)
  - Theme picker (`Carousel`) for princess/space/nature/cartoon
  - Icon-only select/active primary action
- Active child row is highlighted.
- Add flow uses “Add Child” list add card.

## Manage Chores (`/settings/manage-tasks`)

- Supports two chore types:
  - Standard chore
  - Eating dinner chore (countdown + bites flow)
- Standard chores include:
  - Editable title
  - Editable stars
  - Repeat toggle
- Eating chores include dinner-specific controls and progress interactions.
- Add flow opens inline chooser (`Add Chore` / `Add Eating` / `Cancel`).

## Manage Rewards (`/settings/manage-rewards`)

- Reward rows include:
  - Editable reward title
  - Editable star cost
  - Repeat toggle
- Primary action is icon-first “buy” behavior with lock when stars are insufficient.

## Login (`/login`)

- Uses `PageShell` + centered card with single Google sign-in action.
- Button style remains consistent with global `ActionButton` styling.

## 6) Interaction and Feedback

- Actions should provide immediate visual response (`hover/active` states are already present in shared buttons).
- Positive outcomes may trigger celebration feedback via `celebrateSuccess`.
- For star transactions, business logic should go through `src/services/starActions.ts`.
- Keep confirmations simple (`window.confirm`) for destructive actions in current MVP behavior.

## 7) Content and Labeling

- Keep labels short and direct (examples: “Chores”, “Rewards”, “Add Child”).
- Use “Chores” as the user-facing term for tasks.
- Prefer icon-first actions where existing UI already uses icon-only controls.
- Preserve existing route names and page titles unless product requirements change.

## 8) Accessibility Baseline (Current Expectations)

- Maintain large tap targets through tokenized controls (`72px` top icons, `88px` action buttons).
- Ensure icon actions include `aria-label`.
- Keep heading/body typography theme-driven and high contrast relative to background.
- Do not rely on color alone for state where an icon or text cue already exists.

## 9) Implementation Checklist for New UI Work

When adding or changing child-facing UI, verify:

1. Uses `PageShell` and tokenized spacing.
2. Uses theme colors/fonts from `ThemeContext`.
3. Reuses shared components (`ActionButton`, `TopIconButton`, `ActionTextInput`, `StandardActionList`) before creating new ones.
4. Keeps interactive controls at existing touch sizes (72px/88px patterns).
5. Preserves current naming and navigation conventions.
6. Avoids introducing unthemed hard-coded color systems.

## 10) Source References

- Visual and behavioral baseline: `public/design-prototype.html`
- Live theme definitions: `src/contexts/ThemeContext.tsx`
- Layout and sizing tokens: `src/ui/tokens.ts`
- Shared list and action components: `src/components/*`
