# Card UI Appearance Contract

Status: **Normative design contract; not yet implemented or enforced**

This document defines the visual and content contract for every card in MyStarQuest. A card may display different controls or states, but it must keep the same shell geometry, internal regions, action placement, and labeling rules. Content may change a card's height; shell geometry means its width, border, radius, gutters, and footer alignment remain consistent.

The words **must**, **should**, and **may** are intentional:

- **Must**: required for compliance.
- **Should**: expected unless a documented product or accessibility reason prevents it.
- **May**: optional behavior that still complies with the contract.

## 1. Scope

This contract applies to:

- cards in lists, including chores, rewards, children, and tests;
- add, create, and inline-edit cards;
- child-facing and caregiver-facing cards;
- every theme and every card state.

It does not apply to page headers, dialogs, toast messages, navigation buttons, or activity canvases unless they deliberately identify themselves as cards.

## 2. Canonical Card Anatomy

Every content, create, and edit card uses the following regions in this order:

1. **Header** — identity and status.
2. **Body** — details, progress, inputs, or supporting information.
3. **Footer** — the primary action and utility actions.

The body may be omitted when the header contains all necessary information. The footer may be omitted only when the card is entirely informational. Empty regions must not reserve space. The Add card is the deliberate structural exception: it contains one full-width Add action and no empty regions, as defined under Card Variants.

The visual order and keyboard/focus order must match. Header actions must not be used as a substitute for footer actions.

### Required implementation boundary

Compliance must be enforced through one shared card shell rather than repeated page-level markup. The shared implementation exposes explicit Header, Body, optional Outcome/Status, and Footer regions, whether as named components or named render slots. `StandardActionList` and standalone cards must compose that shell instead of treating arbitrary row content as an undifferentiated card body.

The shared shell owns width, border, radius, gutters, region gaps, footer grid, action dimensions, theme surface, focus treatment, reduced-motion behavior, and responsive label switching. Feature renderers own their text, activity controls, state, and selection of registered generic or item-specific assets.

## 3. Dimensions and Spacing

All measurements are CSS pixels.

| Property                        |             Contract value | Rule                                                                                                                                                  |
| ------------------------------- | -------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card width                      | 100% of its content column | Must not exceed `uiTokens.contentMaxWidth` (currently 380px).                                                                                         |
| Outer radius                    |                       32px | Applies to all card variants.                                                                                                                         |
| Border                          |                        4px | Uses the theme surface color; state variants may change color, not width.                                                                             |
| Horizontal gutter               |                       12px | Left and right internal padding.                                                                                                                      |
| Top/bottom gutter               |                       12px | Top and bottom internal padding.                                                                                                                      |
| Region spacing                  |                       24px | Between header, body, optional status/stars, and footer.                                                                                              |
| Card-to-card spacing            |                       24px | Vertical space between adjacent cards.                                                                                                                |
| Header minimum height           |                       60px | Content is vertically centered; it may grow for wrapping or controls.                                                                                 |
| Footer minimum height           |                       60px | May grow as one row for accessibility text scaling.                                                                                                   |
| Footer action gap               |                       14px | Horizontal gap between all footer buttons.                                                                                                            |
| Primary action height           |               60px minimum | Fills the footer row height.                                                                                                                          |
| Utility action size             |       60px × 60px normally | Width remains 60px; height fills the footer row when it grows.                                                                                        |
| Button content gap              |                        8px | Between an icon and label.                                                                                                                            |
| Primary action artwork viewport |       Full button interior | Artwork is intentionally oversized and clipped by the button.                                                                                         |
| Utility artwork viewport        |                52px × 52px | Edit/delete artwork is enlarged and clipped as needed to visually fill this centered viewport; smaller utility icons may retain their intrinsic size. |
| Success image box               |               100% × 220px | Image is centered and contained within this fixed-height body region.                                                                                 |

The 12px gutter is the distance from the inside edge of the border to card content. Components inside the body must not add another full-card horizontal gutter. Nested groups may use their own inset only when they have a visible surface or grouping purpose.

Use the shared token values in `src/tokens/index.ts` when this contract is implemented. Add missing image-box tokens there; do not reproduce these measurements as local magic numbers. The live token file and this specialized contract take precedence over stale numeric values in broader UI guidance.

## 4. Header Contract

The header identifies the card; it does not contain the card's main action.

- The title must be the first meaningful item and use the theme heading font.
- The title must use an appropriate semantic heading element or equivalent accessible heading role.
- A one-line title is preferred. A title may wrap to two lines and must never be truncated when the hidden text is necessary to identify the item.
- Status may appear beside or directly below the title. It must not rely on color alone.
- Metadata that changes the user's decision belongs in the body, not in a crowded header.
- Edit controls belong in the footer. Inline-edit mode may replace the header title with its editing field.
- Decorative artwork may appear in the header but must not reduce the title's readable width below 50% of the content area.

Header content must align to the card's left gutter. A trailing status element may align to the right gutter.

## 5. Body Contract

- Body content must use the theme body font unless it is itself a heading.
- Related controls use a 10px vertical gap; distinct control groups use a 16px gap.
- Text and controls align to the same left and right gutters as the header.
- Star counts, progress, and outcome information appear after descriptive content and before the footer.
- Validation or failure feedback appears next to the affected control. It must not displace the footer to another visual order.
- Inline-edit and create cards use the same outer geometry as display cards. Switching modes must not change the card width, radius, border width, or gutters.

## 6. Footer and Action Placement

The footer is one horizontal action row at the bottom of the card. It uses a grid with one `minmax(0, 1fr)` primary column followed by zero, one, or two 60px utility columns. Every column is separated by 14px.

From left to right, actions must appear in this order:

1. **Primary action** — flexible width and takes all remaining space.
2. **Edit utility** — 60px wide, normally square, when available.
3. **Reset or delete utility** — 60px wide, normally square, when available.

The primary action must remain leftmost. Utility actions must remain grouped on the right. When the primary action is intentionally hidden, utilities stay right-aligned; they must not stretch to fill the row.

The primary action and every utility action must share the same top and bottom edges. Their visual centers must sit on the same horizontal axis. The primary action fills the available width, while the rightmost utility remains 60px wide and aligned flush with the card's right content gutter. The 14px action gap is measured between outer button edges.

Inside every action, the icon or image is centered horizontally and vertically. Card footer actions do not carry visible text labels.

A card must expose no more than one primary action and two visible utility actions. Additional actions must move into the card body, a subsequent flow, or an overflow pattern approved for the product.

The footer must never wrap. Every card action is image-only at every width; its image remains centered and its full text is retained as the button's accessible name. Utility actions remain visible, 60px wide, and in the same order.

At normal text size the footer is 60px high and utilities are square. If text scaling requires a taller primary action, the entire footer row grows and every action fills the same height; utility widths remain 60px. This accessibility exception preserves aligned top and bottom edges and takes precedence over the normal 60px-square utility shape.

## 7. Primary Action Content

The primary action communicates the next meaningful action on that specific card.

- It must contain one centered image or icon and no visible text.
- Its image may be either the app's generic action image or artwork specific to that chore or test.
- When specific artwork exists and clearly identifies the current chore or test, it should be preferred. The generic image is the required fallback when specific artwork is unavailable, unsuitable at button size, or not provided by the item.
- Chore/test-specific artwork must represent the same item as the card. Artwork from another chore or test must never be used as a visual substitute.
- Generic and specific images use the same full-button clipping viewport. Their registered scale and focal position may differ so the meaningful portion remains visible.
- Its non-visible action label should be one to three words and use sentence case: `Run`, `Check result`, `Buy reward`, `Select`.
- Avoid vague labels such as `OK`, `Submit`, `Action`, `Go`, or `Continue` when a specific verb is available.
- Do not include punctuation, reward amounts, instructions, or status prose in the button label.
- Dynamic state may change both icon and label, but the control must continue to describe the action that will occur when pressed.
- Every primary action requires an explicit accessible name containing the verb and target.
- Tooltip text may repeat the accessible name for pointer users, but it must not occupy card layout.

The primary action uses the themed primary treatment. A completed state must not be shown only by recoloring the action; use a distinct icon or adjacent status cue as well.

### Action image selection

Action imagery follows this order:

1. Use the chore/test-specific action image when one is defined and legible in the action button.
2. Otherwise use the generic action image for that action type.
3. If neither exists, use the established generic action icon; do not leave a broken or empty image box.

Primary action artwork is deliberately oversized: it nearly fills the button and is clipped so approximately one-third of the source artwork is visible. Preserve its aspect ratio and center the registered focal point; never shrink it into a conventional small icon. Scale and focal position belong to the shared asset registration, allowing unusually composed assets to opt into a specific position without page-level CSS. The button owns `overflow: hidden` and the artwork may be cropped but never stretched. Every image inside a button is decorative to assistive technology and must use empty alternative text; the button's accessible name carries the meaning.

## 8. Reset Action Contract

Reset is always a utility action and never occupies the primary-action slot. When Reset is the only available action, it remains a 60px-wide right-aligned utility.

- Reset occupies the rightmost utility position in the footer.
- It is a 60px-wide icon button, normally 60px high, and does not display the word `Reset` inside the card footer.
- Its accessible name must be specific where context is not unambiguous, for example `Reset dinner progress` or `Reset spelling test`.
- Use the theme's established reset icon. The icon must not be reused for delete.
- Reset always uses the neutral utility treatment. An operation that permanently removes user-created or earned data is destructive and must not be represented as Reset.
- Reset acts immediately without opening a confirmation dialog.
- While reset is running, the button must be disabled, expose `aria-busy="true"`, and replace its icon with the standard loading indicator. Its position and dimensions must not change.

If reset replaces delete for a card state, it occupies the same rightmost slot so the footer geometry remains stable.

The action and reset buttons must never overlap, share a border, or visually merge into a split button. Reset remains aligned to the action button's vertical center and right edge position in every card state, including loading, completed, and disabled states.

## 9. Success Image Contract

A successful chore or test may display either a generic success image or a success image specific to that chore or test.

Success imagery follows this order:

1. Use the chore/test-specific success image when one is defined and accurately represents the completed item or outcome.
2. Otherwise use the theme-appropriate generic success image.
3. If neither exists, show the established non-image success treatment; never show an empty image frame or broken asset.

- A success image must be visually distinct from the action image when both appear in the same state, unless the asset is deliberately designed for both roles.
- The success image belongs in the card body or success/outcome region, above the footer. It must not be placed inside the reset utility button.
- It is horizontally and vertically centered in a 100%-wide, 220px-high body container and uses `object-fit: contain` with its original aspect ratio.
- Generic and specific success images use that same containing box so changing between them does not change card alignment or cause layout shift.
- The image may celebrate success but must not be the only success cue. Accompany it with text, status, or an accessible announcement.
- Decorative success imagery must use empty alternative text. Meaningful imagery must have concise alternative text describing information not already stated nearby.

## 10. Chore and Test Limits

This section defines domain limits displayed and edited by cards. These are data invariants, not merely visual control limits.

| Value                             | Minimum | Maximum | Stored fields                                                                                                                                 |
| --------------------------------- | ------: | ------: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Stars assigned to a chore or test |       1 |       9 | `starValue`                                                                                                                                   |
| Dinner plate slices               |       1 |      20 | `dinnerTotalBites`                                                                                                                            |
| Test activity items               |       1 |       9 | `mathTotalProblems`, `largeNumbersTotalProblems`, `pvTotalProblems`, `alphabetTotalProblems`, `spellingTotalProblems`, `animalsTotalProblems` |

An activity item means one configured unit the child completes inside an activity: one dinner slice or one test problem. It does not mean the number of cards in a chore/test list. Dinner plate slices are the explicit 1–20 exception to the general 1–9 activity-item limit. Standard chores and water/toilet checks currently have no configurable item-count field, so the item-count limit is not applicable to them. Any future chore/test count field must adopt the 1–9 integer range unless a later contract explicitly replaces it.

- Stars and test activity-item counts must be integers from 1 through 9 inclusive. Dinner plate slices must be integers from 1 through 20 inclusive. Values outside their applicable range, fractional values, and non-finite values are invalid.
- Create and edit controls must stop incrementing at the applicable maximum (9 or 20) and stop decrementing at 1.
- UI controls, save commands, and persistence schemas must all enforce the same range. Client-side controls are not the sole validation boundary.
- An attempted invalid save must be rejected with validation beside the affected control; values must not be silently changed during an explicit save.
- Before enforcement is released, existing persisted out-of-range values must be migrated with `min(maximum, max(1, round(value)))`, where maximum is 9 for stars/tests and 20 for dinner slices; missing or non-finite values become 1. The migration must be explicit and testable, not a silent write during ordinary reads.
- The limits apply equally to create and edit flows and to every theme.
- Cards displaying these values must show the actual numeric value without abbreviation or reliance on imagery alone.

## 11. Edit and Delete Utilities

- Edit occupies the first utility slot immediately after the primary action.
- Delete occupies the rightmost slot when reset is not present.
- Edit uses the neutral treatment. Delete uses the danger treatment.
- Both are icon-only in the footer and require an accessible name.
- Destructive deletion starts its exit interaction immediately without opening a confirmation dialog.
- Hiding a utility must remove it from layout and focus order; an invisible placeholder must not remain.

## 12. Standard Card Actions

Cards must use the following canonical actions. A card does not show every action: it shows only the operations valid for its type and state. It must not invent a different label, placement, icon meaning, or visual treatment for an operation listed here.

| Action       | Role    | Standard placement                               | Visible content                                | Variant                                     | Accessible-name pattern              |
| ------------ | ------- | ------------------------------------------------ | ---------------------------------------------- | ------------------------------------------- | ------------------------------------ |
| Run          | Primary | Leftmost, flexible-width footer action           | Centered action image or icon only             | Primary                                     | `Run {chore/test name}`              |
| Check result | Primary | Leftmost, flexible-width footer action           | Centered check-result image or icon only       | Primary                                     | `Check result for {chore/test name}` |
| Finish       | Primary | Leftmost, flexible-width footer action           | Centered finish image or icon only             | Primary                                     | `Finish {chore name}`                |
| Bite         | Primary | Leftmost, flexible-width footer action           | Centered bite image or icon only               | Primary                                     | `Record a bite for {chore name}`     |
| Give stars   | Primary | Leftmost, flexible-width footer action           | Centered chore image or give-star icon only    | Primary                                     | `Give stars for {chore name}`        |
| Buy reward   | Primary | Leftmost, flexible-width footer action           | Centered reward image or buy icon only         | Primary                                     | `Buy {reward name}`                  |
| Select child | Primary | Leftmost, flexible-width footer action           | Centered child/theme image or select icon only | Primary or neutral selected-state treatment | `Select {child name}`                |
| Edit         | Utility | First 60px-wide utility after the primary action | Edit icon only                                 | Neutral                                     | `Edit {item name}`                   |
| Reset        | Utility | Rightmost 60px-wide utility                      | Reset icon only                                | Neutral                                     | `Reset {item/progress name}`         |
| Delete       | Utility | Rightmost 60px-wide utility when Reset is absent | Delete icon only                               | Danger                                      | `Delete {item name}`                 |

`Run` starts or resumes an interactive chore/test. `Check result` evaluates a test answer. `Finish` explicitly completes an activity that has no answer to evaluate. `Bite` records one dinner unit. `Give stars`, `Buy reward`, and `Select child` are domain actions rather than synonyms for Run.

### Shared action geometry

- All actions use the standard 60px minimum footer height and 20px button radius.
- All visible footer actions share the same top edge, bottom edge, and horizontal center axis.
- Primary actions fill the remaining row width. Utility actions remain exactly 60px wide and fill the row height.
- The gap between any two actions is always 14px.
- Icons and images are centered horizontally and vertically within every action.
- An action must remain in the same footer position in its default, hover, focus, pressed, disabled, loading, success, and error states.

### Run

- `Run` starts or resumes the chore/test represented by the card.
- Use `Run` consistently; do not substitute `Go`, `Start`, `Launch`, or `Play` for the same operation.
- The action image may be specific to the chore/test, with the generic run image as fallback according to the action image selection rules.
- While running, the action is disabled unless the product explicitly supports a pause or resume operation. A loading indicator may replace the image, but the button dimensions and label area remain stable.

### Check result

- `Check result` evaluates or reveals the result of the current chore/test attempt.
- Use the exact accessible action label `Check result`; do not alternate between `Check`, `Submit`, `Done`, or `See result` for the same operation.
- It occupies the primary-action slot, normally replacing `Run` when the attempt is ready to evaluate. Run and Check result must not appear as two simultaneous primary actions.
- The result outcome appears in the body/outcome region. The button must not expand into the result display.
- If checking succeeds, the card may show generic or chore/test-specific success imagery under the Success Image Contract.

### Other primary actions

- Use `Finish` only when the child explicitly completes a non-test activity; do not use it when an answer must be evaluated.
- Use `Bite` only to record one dinner bite. It must not start the dinner activity or mark the entire dinner complete.
- Use `Give stars` for completing a standard chore and awarding its configured stars.
- Use `Buy reward` for spending stars on the named reward. An unavailable reward remains labeled `Buy reward`; nearby status and the disabled explanation communicate insufficient stars instead of renaming the action `Need stars`.
- Use `Select` as the accessible action label for Select child. An already-selected child uses an adjacent `Active` status and a disabled Select action or omits the action; `Active` is a state, not an action label.

### Edit

- Edit changes the card's configuration or content; it does not run the item.
- It is always the first utility after the primary action.
- Use the established edit icon. Do not display visible `Edit` text in a standard card footer.
- When editing begins inline, focus moves to the first meaningful editing control. Saving or cancelling returns the card to a stable display state.

### Reset

- Reset returns progress or attempt state to its defined starting state without deleting the chore/test itself.
- It is always the rightmost action and follows the Reset Action Contract.
- Reset and Delete must not appear together in the standard footer. If both operations are required, Delete belongs in an edit or management flow.
- Reset must never use the delete icon or be announced as delete.

### Delete

- Delete removes the chore/test or other user-created item itself.
- It is always the rightmost action when Reset is absent.
- Use the established delete icon and danger treatment. Do not display visible `Delete` text in a standard card footer.
- Delete executes immediately; its accessible name must identify the item being removed.
- Delete must never be used to clear only progress; that operation is Reset.

### Action availability and transitions

- Show only actions that are valid for the current state.
- A test typically transitions `Run` → `Check result` → success/failure outcome with Reset available. A non-test activity may transition `Run` → `Finish` → success outcome with Reset available. Dinner may transition `Run` → `Bite` → success outcome with Reset available.
- Changing the available action must not reorder Edit, Reset, or Delete.
- Disabled actions must explain the unmet condition through nearby text or an accessible description when the reason is not obvious.
- Repeated activation must be guarded while an asynchronous action is in progress. The active button is disabled, exposes `aria-busy="true"`, and replaces its image with the standard loading indicator while preserving its label, dimensions, and position.
- A failed Run, Check result, Finish, Bite, Give stars, Buy reward, Edit-save, or Reset operation leaves the card visible in its prior stable state and shows an actionable error beside the relevant region.
- Delete starts the whole-card exit animation immediately and commits the destructive action when that animation finishes. The card is then removed by the updated list data. If deletion fails, the card animates back to its visible state and reports the error.

## 13. Card Variants

### Add card

- Uses the same width, 32px radius, and gutters as a content card.
- Uses the established 4px dashed themed border.
- Contains one full-width action with a centered `+` icon and a specific accessible name such as `Add chore`; it has no visible text.
- Has no empty header or footer regions around that action.

### Inline create/edit card

- Keeps the standard card dimensions and region spacing.
- Uses the theme primary color for its active border without changing border width.
- Save/confirm is the leftmost primary action; cancel is the rightmost neutral utility unless the flow's shared editor contract explicitly defines another accessible arrangement.

### Informational card

- May omit the footer.
- Must not imitate a disabled interactive card. If the whole card is actionable, it needs clear focus, hover, and pressed states and one accessible name.

### Highlighted, selected, and completed cards

- Keep the same shell geometry as the default card: width, border width, radius, gutters, region gaps, and footer alignment. Their content-driven height may change.
- State treatments may change surface, border, icon, or status content.
- State must not be communicated by color or animation alone.

## 14. Theme and Motion

- Structure and measurements are identical in all themes.
- Colors, fonts, imagery, shadows, and surface treatments come from the active theme.
- Card text must maintain readable contrast against its surface in every state.
- Normal text must meet at least 4.5:1 contrast; large text and essential graphical controls must meet at least 3:1 contrast.
- Decorative motion must not move the footer independently from the card.
- Reduced-motion preferences must disable non-essential floating, entrance, and exit animation.

## 15. Accessibility and Interaction States

- Every action must have a visible focus indicator.
- The complete 60px button area is clickable/tappable; icons must not create smaller hit areas.
- Disabled actions remain legible, expose a disabled state, and do not respond to hover or press animation.
- Loading actions remain in their original position and retain their original dimensions.
- Every image or icon inside a button is decorative to assistive technology. The button itself must provide the full accessible name.
- A disabled-state explanation or action error must be programmatically associated with the relevant action or control, for example with `aria-describedby`.
- Outcome changes must be announced through an appropriate live region without moving keyboard focus unexpectedly.
- Text must be allowed to reflow under user text scaling. Minimum heights may grow; content must not overlap or clip.

## 16. Compliance Checklist

A card complies only when all applicable answers are yes:

- Does it use 12px internal gutters, 24px region/card spacing, a 32px radius, and a 4px border?
- Does its header identify the item without containing the main action?
- Is the footer a single 60px-minimum row at the bottom?
- Is the primary action leftmost and flexible-width?
- Are Edit and Reset/Delete 60px-wide utilities on the right in the prescribed order and equal in height to the primary action?
- Do the primary action and reset button share the same top edge, bottom edge, and horizontal center axis?
- Is the primary label short, specific, and verb-led?
- Does the action use the matching chore/test-specific image when suitable, with the generic action image as fallback?
- Is Reset icon-only, specifically named for assistive technology, and always neutral?
- Does success use suitable chore/test-specific or generic imagery without changing the outcome layout?
- Are chore/test stars constrained to 1–9?
- Are dinner plate slices constrained to 1–20 and test-problem counts constrained to 1–9 at UI, command, and schema boundaries?
- Do Run and Check result use the exact canonical labels and occupy the primary-action slot?
- Are Edit, Reset, and Delete icon-only utilities with the canonical order, variants, and accessible names?
- Are Reset and Delete mutually exclusive in the standard footer and used for different operations?
- Does every state keep the same card shell geometry while allowing content-driven height, and communicate state without color alone?
- Are colors, fonts, imagery, and shadows theme-driven?
- Do focus, disabled, loading, text-scaling, and reduced-motion behaviors remain usable?

## 17. Required Conformance Tests

Implementation is not complete until automated tests cover:

- shared shell metrics and region order for display, create, edit, highlighted, completed, and add variants;
- footer order and equal-height alignment with zero, one, and two utilities;
- image-only card actions at narrow and wide widths with unchanged accessible names;
- generic, item-specific, missing, and failed action/success image paths without layout shift or broken-image UI;
- exact canonical accessible names and image-only presentation for every action in the action table;
- Reset/Delete mutual exclusion, neutral/danger variants, and their distinct operations;
- disabled, focus, pressed, loading, success, failure, and reduced-motion states;
- successful and failed deletion without premature card removal;
- 1 and 9 boundaries for stars/tests, 1 and 20 boundaries for dinner slices, plus rejection of adjacent out-of-range values, fractions, non-finite values, and repeated asynchronous activation;
- representative cards in every theme, at narrow width, and with enlarged text;
- keyboard order, focus visibility, accessible names/descriptions, live outcome announcements, and decorative button images.

Visual regression tests should assert stable shell and footer geometry. Behavioral/component tests should assert state, naming, validation, fallback, and destructive-action semantics. Tests must use the shared shell rather than duplicating the contract measurements in feature-specific fixtures.

## 18. Relationship to Existing UI Guidance

This contract specializes the broader rules in `docs/children-ui-ux-guidelines.md`. For card appearance and card action placement, this document is the more specific authority. Existing screens may differ until a separate implementation task brings them into compliance.
