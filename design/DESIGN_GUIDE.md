# Describe-it Design Guide (v1)

Product: AI-powered online library of accessible image descriptions and tactile graphics.
Users: special educators, accessible content creators, people with visual impairment (screen reader, magnifier, high-contrast and keyboard users).
Tone: modern, simple, premium, calm. Plain language. No marketing flourish inside task flows.

Accessibility is the top rule. Where this guide conflicts with visual preference, accessibility wins. Target WCAG 2.2 AA minimum, AAA for body text where possible.

## 1. Logo: "Contour to Point"
- Mark: one continuous D-shaped line. The stem trails off into a single dot. Line = raised contour of a tactile graphic. Dot = the label/description.
- Wordmark: "Describe-it", Lexend 600, letter-spacing -0.03em. "Describe" in Graphite, "-it" in Cobalt.
- Lockup: mark height = 1.65 x wordmark font size; gap = 0.45 x font size.
- Clear space: 0.5 x mark height on all sides.
- Minimum size: mark alone 24px. Below 32px use the heavy variant (stroke 9, dot r 6 on the 64 grid).
- Variants: Graphite + Cobalt on Stone/white; white or Stone + light blue dot (#8DB4F5) on Graphite; all white on Cobalt. Single-colour version for emboss/swell paper.
- Do not: rotate, outline, add effects, recolour the dot outside the palette, set the wordmark in another font.

Mark SVG (64 x 64 viewBox, light background):
```svg
<svg viewBox="0 0 64 64" role="img" aria-label="Describe-it">
  <path d="M14 52H30A20 20 0 0 0 30 12H14M14 52V38" fill="none" stroke="#1C1C1E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="24" r="5" fill="#1F5FBF"/>
</svg>
```

## 2. Colour tokens
Never use colour as the only signal. Pair with text, icon or shape.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| --graphite | #1C1C1E | Primary text, logo | 15.5:1 on Stone |
| --stone | #F6F4F0 | Page background | |
| --surface | #FFFFFF | Cards, inputs | |
| --cobalt | #1F5FBF | Primary actions, links, focus, logo dot | 5.5:1 on Stone, 6.1:1 on white |
| --cobalt-hover | #174A96 | Hover/pressed | 8.5:1 on white |
| --cobalt-tint | #E6EEFA | Selected rows, info background | Graphite 14.6:1 on it |
| --grey | #5A5650 | Secondary text, helper text | 6.6:1 on Stone, 7.3:1 on white |
| --border | #D9D5CC | Decorative dividers only | |
| --control-border | #857F74 | Input, checkbox, select borders | 4.0:1 on white (needs 3:1) |
| --success | #1E6B3A | Success text/icons | 5.9:1 on Stone |
| --error | #B3261E | Error text/icons | 6.0:1 on Stone |

Dark theme (follow `prefers-color-scheme`, also offer a manual toggle):
| Token | Hex |
|---|---|
| --bg | #151517 |
| --surface | #1F1F22 (text 15.0:1) |
| --text | #F6F4F0 (16.6:1 on bg) |
| --text-secondary | #A7A196 (7.1:1 on bg) |
| --accent | #8DB4F5 (8.7:1 on bg) |

Also support `prefers-contrast: more` (pure #000 / #FFF text, 2px borders) and `forced-colors` (use system colours, keep borders on controls).

## 3. Typography
- Headings: **Lexend** 600. Letter-spacing -0.02em on 26px and up.
- Body and UI: **Atkinson Hyperlegible** 400, bold 700. Never use weights below 400.
- Mono (rare, code/IDs): Atkinson Hyperlegible Mono.
- Base size 18px, line-height 1.6. Minimum text size 14px (captions only); 16px for anything interactive.
- Max line length 68ch for descriptions and prose. Left-aligned only; no justified text; no all-caps for more than 3 words.
- Everything must reflow and zoom to 200% (and text-only zoom to 400%) without loss. Use rem units, not px, for type and spacing.

| Style | Font | Size / line | Weight |
|---|---|---|---|
| Display | Lexend | 44 / 1.1 | 600 |
| H1 | Lexend | 34 / 1.2 | 600 |
| H2 | Lexend | 26 / 1.25 | 600 |
| H3 | Lexend | 20 / 1.3 | 600 |
| Body large | Atkinson | 20 / 1.6 | 400 |
| Body | Atkinson | 18 / 1.6 | 400 |
| Small | Atkinson | 15 / 1.5 | 400 |
| Caption | Atkinson | 14 / 1.4 | 400 |
| Button/label | Atkinson | 17 / 1.2 | 700 |

Google Fonts: `family=Lexend:wght@400;600;700&family=Atkinson+Hyperlegible:wght@400;700`. Self-host with `font-display: swap` for production.

## 4. Spacing, shape, layout
- 4px grid. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius: controls 10, cards 14, chips and pills 999.
- Content max width 1200px; reading column 68ch. Generous whitespace; one primary action per view.
- Touch/click targets at least 44 x 44px (primary buttons 48px high); 8px minimum between targets.
- Elevation: avoid shadows; use 1px --border and surface colour changes.

## 5. Interaction and accessibility rules
- **Focus**: always visible. 3px solid --cobalt outline, 2px offset (dark: --accent). Never `outline: none` without a replacement. Focus order matches reading order. Include a "Skip to content" link.
- **Semantics first**: real `button`, `a`, `label`, `fieldset`, `h1-h6`, landmarks (`header`, `nav`, `main`, `footer`). One `h1` per page. ARIA only to fill gaps.
- **Images**: every thumbnail has `alt`. Library thumbnails use the short description as alt. Decorative images use `alt=""`.
- **Forms**: visible labels above fields (never placeholder-only), helper text linked with `aria-describedby`, errors in text with an icon, linked via `aria-describedby`, and announced with `role="alert"`.
- **Status changes** (AI generating, saved, copied) go in an `aria-live="polite"` region.
- **Motion**: 150-200ms ease-out. Honour `prefers-reduced-motion` (no movement, opacity only). No autoplay, no parallax.
- **Time**: no timeouts without warning and extension.
- **Keyboard**: every action reachable without a mouse; cards are one tab stop with a primary link; no keyboard traps in dialogs (Esc closes, focus returns).
- **Language**: set `lang` on `html`; plain language, grade 8 or lower for UI copy.

## 6. Components

**Button**
- Primary: Cobalt fill, white text 17px bold, 48px high, radius 10, padding 0 24px. Hover --cobalt-hover.
- Secondary: white fill, 2px Graphite border, Graphite text.
- Tertiary: text link style, underlined, Cobalt.
- Disabled: avoid; prefer enabled with an explanatory error. If used, `aria-disabled` and 3:1 minimum for text.

**Text field / search**
- 48px high, 2px --control-border, radius 10, white fill, 18px text. Focus: Cobalt border + focus ring. Label above, 15px bold Graphite.
- Search: button attached on the right, label "Search the library" (visually hidden label is acceptable only with a visible search button).

**Library card** (inspired by a tactile graphic catalogue)
- White surface, 1px --border, radius 14, 16px padding.
- Order: thumbnail (4:3, striped placeholder until supplied) > title (H3) > one-line summary > chips (subject, grade, format) > actions ("View description", "Download tactile file").
- Title is the single link; the whole card is clickable via the link's `::after`. Hover: border --cobalt. Selected: --cobalt-tint.

**Chip**
- 36px high, 1px --control-border, radius 999, 15px text. Filter chips toggle with `aria-pressed` and show a check icon when on (never colour alone).

**Description block** (core content)
- Two tiers: Short description (1-2 sentences) always visible; Long description in a disclosure.
- Body-large type, 68ch, with "Copy" and "Read aloud" buttons. Mark AI-generated drafts with a text label "AI draft, reviewed: yes/no" and a reviewer name when reviewed.

**Alerts**
- Icon + bold label + text, 4px radius-less left stripe not required. Info on --cobalt-tint, success/error text colours on white with 1px matching border.

**Navigation**
- Top bar: logo left, primary links (Library, Create, Collections, Help), search, account. Current page uses underline + `aria-current="page"`.
- Footer: accessibility statement, contact, keyboard shortcuts.

## 7. Imagery and tactile graphics
- No illustrations of people with disabilities as decoration. Use real library content (thumbnails of graphics) and clear placeholders.
- Tactile previews: render as high-contrast black linework on white. Hatching and dot patterns are brand motifs; use sparingly as small accents (e.g. 2px diagonal hatch, dot grid), never behind text.
- Brand motifs: the contour line and the single dot. Use as empty-state and loading marks (animated dot respects reduced motion).

## 8. Voice
- Direct, calm, concrete. "Download tactile file" not "Get your graphic now!".
- Describe formats and sizes plainly (PDF, SVG, swell-paper ready, braille label included).
- Error messages say what happened and what to do next.

## 9. Checklist for each screen
1. Passes keyboard-only walkthrough with visible focus.
2. Works at 200% zoom and 320px width.
3. All text meets contrast in light, dark and high-contrast modes.
4. Screen reader order and landmarks verified (NVDA/VoiceOver).
5. No information conveyed by colour alone.
6. Reduced motion respected.
