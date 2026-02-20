# Vertical Spacing Audit

Date: 2026-02-20
Scope: `src/**/*.{ts,tsx,css}`

## Categorization model

- **Category A — Tokenized standard (recommended, keep):** spacing driven by `uiTokens`.
- **Category B — Tailwind scale spacing (acceptable):** spacing classes on Tailwind scale.
- **Category C — Ad-hoc numeric spacing (recommended to normalize):** hard-coded pixel values or mixed shorthand with vertical values.

---

## Category A — Tokenized standard (recommended, keep)

### Token definitions

- [src/ui/tokens.ts](../src/ui/tokens.ts#L4-L9)
  - `pagePaddingTop: 48`
  - `pagePaddingBottom: 24`
  - `sectionGap: 24`
  - `singleVerticalSpace: 24`
  - `doubleVerticalSpace: 48`

### Tokenized usages (vertical)

- [src/components/PageShell.tsx](../src/components/PageShell.tsx#L59-L60) — `paddingTop`/`paddingBottom` from tokens.
- [src/components/PageHeader.tsx](../src/components/PageHeader.tsx#L22) — `marginBottom` from `sectionGap`.
- [src/pages/DashboardPage.tsx](../src/pages/DashboardPage.tsx#L114) — `marginBottom={uiTokens.doubleVerticalSpace}`.
- [src/pages/DashboardPage.tsx](../src/pages/DashboardPage.tsx#L162) — `gap: uiTokens.singleVerticalSpace`.
- [src/pages/ManageTasksPage.tsx](../src/pages/ManageTasksPage.tsx#L221-L230) — row/container gaps from `singleVerticalSpace`.
- [src/pages/ManageRewardsPage.tsx](../src/pages/ManageRewardsPage.tsx#L231) — row gap from `singleVerticalSpace`.
- [src/pages/ManageChildrenPage.tsx](../src/pages/ManageChildrenPage.tsx#L261) — row gap from `singleVerticalSpace`.
- [src/components/StandardActionList.tsx](../src/components/StandardActionList.tsx#L172) — card vertical gap from token.
- [src/components/StandardActionList.tsx](../src/components/StandardActionList.tsx#L377) — list stack gap from token.
- [src/components/StandardActionList.tsx](../src/components/StandardActionList.tsx#L430) — inline-new-row gap from token.
- [src/components/StarInfoBox.tsx](../src/components/StarInfoBox.tsx#L208) — tokenized `marginBottom`.
- [src/components/StarCost.tsx](../src/components/StarCost.tsx#L65) — tokenized `margin-bottom` in embedded CSS.

---

## Category B — Tailwind scale spacing (acceptable)

### Found usages

- [src/pages/ManageRewardsPage.tsx](../src/pages/ManageRewardsPage.tsx#L219) — `pb-24`.
- [src/pages/ManageChildrenPage.tsx](../src/pages/ManageChildrenPage.tsx#L239) — `pb-24`.
- [src/pages/ManageTasksPage.tsx](../src/pages/ManageTasksPage.tsx#L208) — `pb-32`.
- [src/pages/ManageTasksPage.tsx](../src/pages/ManageTasksPage.tsx#L214) — `mt-10`.
- [src/pages/ManageTasksPage.tsx](../src/pages/ManageTasksPage.tsx#L215) — `mb-4`.
- [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx#L71) — `space-y-6`.
- [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx#L75) — `space-y-4`.
- [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx#L84) — `space-y-2`.

### Recommendation

- Keep these if they are intentional local layout spacing.
- For cross-page rhythm alignment, prefer replacing with `uiTokens.singleVerticalSpace` / `doubleVerticalSpace` where practical.

---

## Category C — Ad-hoc numeric spacing (recommended to normalize)

### Repeated ad-hoc gap values

- [src/components/ActionTextInput.tsx](../src/components/ActionTextInput.tsx#L43-L49) — `gap: '12px'`.
- [src/components/EditableStarDisplay.tsx](../src/components/EditableStarDisplay.tsx#L66) — `gap: '12px'`.
- [src/components/StarInfoBox.tsx](../src/components/StarInfoBox.tsx#L224) — `gap: '12px'`.
- [src/components/StandardActionList.tsx](../src/components/StandardActionList.tsx#L191) — action row `gap: '12px'`.
- [src/components/StandardActionList.tsx](../src/components/StandardActionList.tsx#L316) — button content `gap: '8px'`.
- [src/components/RepeatControl.tsx](../src/components/RepeatControl.tsx#L59) — `gap: 10px`.

### Hard-coded vertical margins / offsets

- [src/components/StarCost.tsx](../src/components/StarCost.tsx#L48) — `margin-bottom: 12px`.
- [src/components/StarInfoBox.tsx](../src/components/StarInfoBox.tsx#L76) — `marginTop: '-7px'` (intentional visual offset, keep only if required).

### Mixed shorthand containing vertical values

- [src/components/Carousel.tsx](../src/components/Carousel.tsx#L94) — `padding: '14px 10px 18px'` (vertical top/bottom are ad-hoc).
- [src/components/PageShell.tsx](../src/components/PageShell.tsx#L25) — `padding: '20px'` (all sides; includes vertical).
- [src/components/StandardActionList.tsx](../src/components/StandardActionList.tsx#L327) — `padding: '24px'` (all sides; includes vertical).
- [src/components/StarDisplay.tsx](../src/components/StarDisplay.tsx#L156) — `padding: '8px'/'12px'` based on density (component-level visual behavior).

### Recommendation

- Normalize repeated values (`8`, `10`, `12`) into tokens (for example, `uiTokens.compactGap`, `uiTokens.inlineGap`) or Tailwind scale where style is class-based.
- Keep one-off animation/visual offsets (example: negative margin) only when tied to intended visual effect.

---

## Quick normalization candidates (high value)

1. Introduce shared token(s) for repeated inline gaps (`12px`, `8px`, optional `10px`).
2. Replace `margin-bottom: 12px` in `StarCost` with tokenized value.
3. Consider replacing `Carousel` vertical paddings (`14`/`18`) with token-backed values if carousel height still meets design intent.

---

## Search patterns used

```powershell
rg -n --glob "src/**/*.{ts,tsx,css}" "uiTokens\.singleVerticalSpace|uiTokens\.[A-Za-z]+"
rg -n --glob "src/**/*.{ts,tsx,css}" "marginTop|marginBottom|paddingTop|paddingBottom|rowGap|columnGap|gap\s*:"
rg -n --glob "src/**/*.{ts,tsx,css}" "\b(padding|margin|gap)\s*:\s*['\"`]?[^\n;},]+"
rg -n --glob "src/**/*.{ts,tsx,css}" "py-|pt-|pb-|my-|mt-|mb-|space-y-|gap-y-"
```
