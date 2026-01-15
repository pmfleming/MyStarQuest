# UI/UX Best Practices

## Executive Summary

The file `public/design-prototype.html` is the visual source of truth for this project. All implementation details (colors, spacing, animations) should align with the values defined in that prototype.

---

## 1. Motor Skills & Touch Targets

### Developmental Context

Children aged 4-6 are still developing fine motor control:

- **Age 4**: Can use a computer mouse with difficulty; prefer touch interfaces
- **Age 5**: Improving hand-eye coordination but still imprecise
- **Age 6**: Better control but still require larger targets than adults

### Minimum Touch Target Sizes

#### **Project Standard: 72px (19mm)**

- **MyStarQuest Standard**: 72px (≈19mm)

**Rationale**: Children have less precise motor control and larger fingertips relative to their ability to aim accurately. Research shows children need 20-40% larger targets than adults.

#### Specific Recommendations:

```
Primary buttons (frequent actions):     88px height (Prototype Standard)
Secondary buttons:                      72×72px minimum
Interactive cards/tiles:                100×100px minimum
Draggable objects:                      80×80px minimum
Small icons (if necessary):             60×60px minimum
```

### Spacing Between Interactive Elements

#### **Project Standard: 20px**

- **Between buttons**: 24px minimum
- **Between interactive cards**: 40px minimum
- **Edge margins**: 24px from screen edges

**Rationale**: Prevents accidental taps and reduces frustration. Children often overshoot or undershoot their intended target.

### Interaction Best Practices

#### **Tap (Preferred Primary Interaction)**

- ✅ Single tap should be the primary interaction
- ✅ Provide large, clear tap areas
- ✅ Immediate visual feedback on tap (see Visual Feedback section)
- ❌ Avoid double-tap requirements
- ❌ Avoid long-press as primary interaction (children may not hold long enough)

#### **Drag & Drop**

- ✅ Use for creative/playful interactions
- ✅ Objects should "stick" to finger during drag
- ✅ Provide generous drop zones (100×100px minimum)
- ✅ Show visual indication of where objects can be dropped
- ✅ Snap-to-grid for easier placement
- ⚠️ Avoid requiring precise placement

#### **Swipe**

- ✅ Use for navigation between screens (carousel pattern)
- ✅ Make swipe direction clear with visual cues (arrows, cards peeking)
- ✅ Generous swipe threshold (60-80px movement)
- ❌ Avoid multi-directional swipes on same screen
- ❌ Avoid swipe-to-delete (too easy to accidentally trigger)

#### **Pinch & Zoom**

- ⚠️ Generally avoid for ages 4-6 (requires two-handed coordination)
- If used, make optional with alternative button controls

---

### Icon vs Text Guidelines

#### **Primary Rule: Icons + Labels for Ages 4-6**

Where Possible Only Use Icons

```
✅ Best: [🌟 Icon] alone
❌ Better: [🌟 Icon] + "Stars" text label
❌ POOR: "Stars" text alone
```

**Rationale**:

- Icons provide visual recognition for pre-readers
- Text can look cluttered on a small screen

#### **Icon Style Recommendations**

**1. Use Highly Realistic or Emoji-Style Icons**

- ✅ Realistic: Actual photos or detailed illustrations
- ✅ Emoji-style: Colorful, expressive, friendly characters
- ⚠️ Abstract/minimal: Only for very common symbols (home, star, heart)
- ❌ Avoid: Line icons, technical symbols, abstract metaphors

**Examples:**

```
✅ Star icon: ⭐ (filled, colorful)
❌ Star icon: ☆ (outline only)

✅ Home icon: 🏠 (house with roof, door, windows)
❌ Home icon: ⌂ (simple outline)

✅ Task icon: ✅ (green checkmark in box)
❌ Task icon: □ (empty checkbox)
```

**2. Icon Characteristics**

- **Size**: 32-48px minimum for icons paired with text
- **Color**: Bright, saturated colors (see Color Psychology section)
- **Style**: Consistent style across app (all emoji-style OR all realistic)
- **Detail**: Include recognizable details (facial expressions, textures)

#### **Text Guidelines**

#### Text Guidelines

**Font Requirements:**

- **Primary Typeface**: **Fredoka** (Google Fonts)
  - Fallbacks: 'Comic Sans MS', sans-serif
  - **Rationale**: Rounded, friendly, highly legible for children.
- **Size (Prototype Standards)**:
  - **XL / Numbers**: 48px
  - **Large / Headings**: 28px
  - **Body / Buttons**: 20-24px
- **Weight**: Semi-Bold (600) to Bold (700)
- **Letter spacing**: Normal to slightly increased
- **Line height**: 1.5 for readability

**Text Content:**

- **Length**: 1-3 words maximum per label
- **Vocabulary**: Simple, common words
- **Sentence structure**: Short, direct commands ("Get Stars", "My Rewards")
- **Avoid**: Abstract concepts, compound sentences, negatives

#### **Making Interfaces Scannable for Pre-Readers**

**Visual Hierarchy:**

```
1. Color coding by category (different color = different section)
2. Large, distinctive icons
3. Spatial organization (grid layouts with clear boundaries)
4. Consistent positioning (same thing always in same place)
```

**Layout Principles:**

- **Card-based design**: Each action/item in a distinct card
- **Generous whitespace**: 20-30% of screen should be empty space
- **Grid layouts**: Regular, predictable patterns (2×2, 3×3 grids)
- **No more than 4-6 options**: Per screen to avoid overwhelm
- **Progressive disclosure**: Show simple options first, hide advanced features

---

## 3. Component Specifications

### Standard Theme Button (Children/Profile Button)

This specification defines the standard styling for the primary action button used for switching profiles or accessing child-specific settings (e.g., the "Children" button on the Dashboard).

#### **Visual Style**

- **Shape**: Pill-shaped container (fully rounded corners).
  - `border-radius: 9999px` (or `50px` minimum)
- **Dimensions**:
  - **Minimum Height**: 72px
  - **Minimum Width**: 72px
- **Colors**:
  - **Background**: Theme Primary Color (`theme.colors.primary`)
  - **Border**: 4px solid, Theme Accent Color (`theme.colors.accent`)
- **Effects**:
  - **Glow**: Neon-style outer glow
  - `box-shadow: 0 0 20px [Theme Primary Color]`

#### **Content Behavior**

- **Icon**:
  - **Princess Theme**: Displays Svg` from the theme assets (`src/assets/themes/princess/xxx.svg`).
    - **Size**: Resized to fit centrally (approx. 72px height).
    - **Alignment**: Centered vertically and horizontally.
  - **Other Themes**: Button remains empty (no icon or text) until specific assets are provided.
- **Text**: No text labels are used inside this specific button variant.

## 4. Color Psychology

### Color Engagement Principles

#### **Saturation & Brightness**

- **Sweet spot**: 70-90% saturation (vivid but not neon)
- **Lightness**: 50-70% for primary colors (bright but readable)
- **Avoid**:
  - Fully saturated (100%) colors - can cause eye strain
  - Pastel colors as primary - may appear washed out
  - Dark/muted colors - can feel sad or boring

#### **Official Project Themes**

The application uses 4 distinct themes defined in the prototype. All designs must adhere to these palettes.

**Theme A: Galactic Explorer (Space)**

- **Background**: `#0B1026` (Deep Navy)
- **Surface**: `#1B2745`
- **Text**: `#FFFFFF`
- **Primary**: `#FFD700` (Gold)
- **Secondary**: `#00E5FF` (Cyan)
- **Accent**: `#9C27B0` (Purple)

**Theme B: Enchanted Forest (Nature)**

- **Background**: `#E8F5E9` (Light Green)
- **Surface**: `#FFFFFF`
- **Text**: `#33691E` (Dark Green)
- **Primary**: `#8BC34A` (Leaf Green)
- **Secondary**: `#FF9800` (Orange)
- **Accent**: `#795548` (Brown)

**Theme C: Superhero Squad (Cartoon)**

- **Background**: `#FFF8E1` (Light Yellow)
- **Surface**: `#FFFFFF`
- **Text**: `#212121` (Black)
- **Primary**: `#F44336` (Red)
- **Secondary**: `#2196F3` (Blue)
- **Accent**: `#FFEB3B` (Yellow)

**Theme D: Royal Princess**

- **Background**: `#FDF2F8` (Light Pink)
- **Surface**: `#FFFFFF`
- **Text**: `#831843` (Dark Pink)
- **Primary**: `#EC4899` (Hot Pink)
- **Secondary**: `#A855F7` (Purple)
- **Accent**: `#F9A8D4` (Light Pink)

### Contrast Ratios & Accessibility

#### **WCAG Requirements for Children:**

- **Large text (18px+)**: Minimum 3:1 contrast ratio
- **Recommended for children**: 4.5:1 or higher
- **Icons**: 3:1 minimum against background

#### **Testing Contrast:**

```
Text on background:
✅ #1F2937 on #FFFFFF = 16.1:1 (Excellent)
✅ #3B82F6 on #FFFFFF = 3.1:1 (Acceptable for 18px+ bold)
❌ #FFC107 on #FFFFFF = 1.8:1 (Too low)

Button text:
✅ #FFFFFF on #3B82F6 = 5.5:1 (Good)
✅ #FFFFFF on #10B981 = 3.4:1 (Acceptable for large text)
```

**Tools:**

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Coolors Contrast Checker: https://coolors.co/contrast-checker

### Cultural Considerations

#### **Color Meanings by Age Group (Western Context):**

**Ages 4-6 Color Associations:**

- 🔴 **Red**: Exciting, energy, "stop", sometimes anger
- 🟢 **Green**: Success, "go", nature, positive
- 🔵 **Blue**: Calm, trustworthy, favorite of many children
- 🟡 **Yellow**: Happy, sunny, attention-getting
- 🟣 **Purple**: Special, magical, royal
- 🟠 **Orange**: Fun, energetic, playful
- 🩷 **Pink**: Varies by individual preference, often associated with gentleness

**Gender Considerations:**

- Ages 4-6 have strong color preferences often influenced by socialization
- Offer theme choices rather than forcing color schemes
- Provide variety: "Princess" (pink), "Superhero" (red/blue), "Nature" (green), "Space" (purple/blue)

#### **Cultural Variations to Consider:**

- **Red**: Positive/lucky in Chinese culture; danger in Western culture
- **White**: Purity in Western; mourning in some Asian cultures
- **Yellow**: Joy in Western; sacred in Hindu culture
- **Green**: Nature/safe in most cultures; but can have negative connotations in some contexts

**Best Practice**: When designing for diverse audiences, rely on universally positive colors (blue, green) for critical actions, and use culturally-specific colors for theming only.

### Color & Attention

#### **Using Color to Direct Attention:**

**Priority Hierarchy:**

```
1. Primary action (most important): Bright, saturated, warm colors (red, orange, yellow)
2. Secondary actions: Medium saturation, cool colors (blue, green)
3. Tertiary actions: Lower saturation, neutral colors (gray)
```

#### **Color Coding for Categories:**

- Use consistent colors for categories (e.g., "Tasks" = blue, "Rewards" = gold)
- Maximum 5-6 color-coded categories
- Maintain color associations throughout app

### Avoiding Overstimulation

#### **Warning Signs of Overstimulation:**

- ❌ More than 4 different bright colors on one screen
- ❌ High contrast patterns (stripes, checkerboards)
- ❌ Animated backgrounds with multiple colors
- ❌ Flashing or rapidly changing colors

#### **Balanced Color Usage:**

```
✅ 1-2 dominant colors per screen
✅ 60-30-10 rule:
   - 60% neutral background
   - 30% secondary color
   - 10% accent/primary color

✅ Consistent color temperature (warm OR cool, not mixed randomly)
✅ Gradual color transitions
```

---

## 5. Visual Feedback & Interactions

### Types of Feedback Children Expect

#### **1. Visual Feedback (Essential)**

**Immediate Feedback (0-100ms):**

- **Tap down**:
  - Scale: 0.95 (slightly smaller)
  - Opacity: 0.8
  - Background: Slightly darker shade

```css
.button:active {
  transform: scale(0.95);
  opacity: 0.8;
  background-color: darken(original, 10%);
}
```

**Tap release**:

- Return to normal state (100-150ms bounce)
- Optional: Slight overshoot (scale to 1.05, then back to 1.0)

```css
.button {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Hover (for desktop/tablet with cursor):**

- Slightly larger (scale: 1.05)
- Subtle shadow or glow
- Cursor: pointer

#### **2. Audio Feedback (Highly Effective for Children)**

**When to Use Audio:**

- ✅ Button taps (short "pop" or "click" sound)
- ✅ Success actions (cheerful chime, "ding")
- ✅ Completing tasks (celebration sound)
- ✅ Earning rewards (coins, magic sparkle)
- ❌ Avoid for errors (can be shaming) - use gentle, guiding sounds

**Audio Characteristics:**

- **Duration**: 100-500ms (very short)
- **Volume**: Medium-low (not startling)
- **Tone**: Pitched higher than adult UI sounds (children respond well to higher frequencies)
- **Variety**: 3-5 variations to avoid repetitiveness

**Parent Controls:**

- Always provide mute option
- Store audio preference
- Consider time-of-day automatic muting

#### **3. Haptic Feedback (Secondary)**

**When to Use:**

- ✅ Button taps (light haptic)
- ✅ Success moments (medium haptic)
- ✅ Errors (gentle, distinct pattern)

**Cautions:**

- Not all devices support haptics
- Never rely solely on haptic feedback
- Some children may find it distracting

### Animation Timing & Duration

#### **General Principles:**

- **Faster than adult UIs**: Children have shorter attention spans
- **Clear purpose**: Animations should communicate state or guide attention
- **Interruptible**: Children should be able to tap/skip if desired

#### **Recommended Durations:**

```
Micro-interactions (button press):      100-150ms
State transitions (modal appearing):    200-300ms
Page transitions:                       300-400ms
Celebration animations:                 800-1200ms
Loading indicators:                     Continuous (until loaded)
```

**Anti-patterns:**

- ❌ Linear timing (feels robotic)
- ❌ Slow animations (>500ms for interactions)
- ❌ Complex multi-step animations (confusing)

### Reward Mechanisms & Positive Reinforcement

#### **Psychological Principles (Ages 4-6):**

**Immediate Reinforcement:**

- Rewards must be **immediate** (within 1-2 seconds of action)
- Clear causal connection between action and reward
- Consistent reinforcement (every time, not random)

**Appropriate Reward Types:**

1. **Visual rewards**: Stars, stickers, badges, confetti
2. **Audio rewards**: Cheerful sounds, "You did it!" voice
3. **Progress indicators**: Filling bars, collecting items
4. **Unlockables**: New themes, avatars, accessories (age-appropriate)

#### \*\*Rew

**2. Progress Visualization:**

```
✅ Fill-up bars (simple, clear progress)
✅ Collecting objects (stars, coins in a jar)
✅ Stepping stones/path (visual journey)
✅ Growing plants/creatures (nurturing metaphor)

❌ Percentages (too abstract)
❌ Complex graphs/charts
❌ Text-heavy progress reports
```

#### **Avoiding Negative Reinforcement:**

**For Errors/Incorrect Actions:**

- ❌ No "X" marks, red angry faces, or negative sounds
- ❌ No point deduction or loss of rewards
- ✅ Gentle guidance: "Try again!" with helpful hint
- ✅ Partial credit for effort
- ✅ Encouraging tone: "Almost there!"

**For Failed Attempts:**

- ✅ Shake animation (gentle, brief)
- ✅ Reset with encouraging message
- ✅ Provide help/hint after 2-3 attempts
- ✅ Allow unlimited attempts

## 6. Additional Design Considerations

### Mobile Device Frame (Core Constraint)

**The "Device Frame" Concept:**
To ensure a consistent experience across all devices (desktop, tablet, mobile), the application is contained within a simulated mobile device frame when viewed on larger screens.

- **Max Width**: 414px (iPhone Plus width)
- **Min Height**: 896px
- **Border Radius**: 40px
- **Shadow**: Deep shadow to simulate depth (`0 25px 50px rgba(0,0,0,0.5)`)

**Rationale**:

- Keeps touch targets reachable for small hands.
- Prevents layout stretching on wide screens.
- Creates a focused "toy-like" object feel.

### Reading Order & Layout

**Left-to-Right, Top-to-Bottom:**

- Design for natural reading flow (Western contexts)
- Most important actions in top-left or center
- Navigation at bottom (within thumb reach on mobile)

**Z-Pattern Scanning:**

- Children scan in a Z-pattern: top-left → top-right → middle → bottom-right
- Place most important elements along this path

---

**Document Version**: 1.1  
**Last Updated**: November 28, 2025  
**For**: MyStarQuest Application
