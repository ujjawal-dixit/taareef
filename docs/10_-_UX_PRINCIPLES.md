# ⚠️ THIS FILE IS SIGNIFICANTLY OUT OF DATE — DO NOT BUILD FROM IT

**Last updated: Session 5 — May 2026.**
**Current design system is in KB-CLAUDE.md and CARD_SPEC.md.**

Key contradictions in this file vs current system:
- Canvas is listed as `#080f0a` → actual is `#111111`
- References 8 categories → actual is 6 (watch/listen/read/dine/do/visit)
- Does not include Indian Folk Art pillar of design philosophy
- Does not include Warli/Gond/Madhubani/Bidri folk art icon system
- Does not include the two-zone card structure
- Does not include the 4-pillar design philosophy (Matte / WKW / Folk Art / Brutalism)
- Color system predates the vivid hex + deepDark system

**Read KB-CLAUDE.md sections: Design Philosophy, Card Design System, Folk Art Icon System.**

---

# UX_PRINCIPLES.md — Taareef Design System

> Complete design and interaction specification.
> Every UI implementation decision references this file.
> Precise enough to build from. No ambiguity.

---

## Product Character

Taareef is a pleasure product, not a productivity tool. It should feel like a beautifully designed notebook — personal, specific, warm. Not clinical, not techy, not startup-generic. The name is Urdu/Hindi. The emotional register is: delight, warmth, quiet confidence, effortlessness.

If Taareef were a person: the well-traveled friend who always knows where to go, what to watch, and what to listen to — and remembers who told them about it.

---

## Five Core Design Principles

### 1. Source Is Identity
The source_name is the most prominent metadata on every card. It is never smaller than secondary text. It is never hidden behind a tap. It appears on every card in every list view, always.

**Engineering implication:** source_name renders on the card component in the same visual weight as the title subtitle. It is not an optional display — it is a required render.

### 2. Capture Must Be Effortless
The save flow completes in 8 seconds maximum and 2 taps minimum. No blocking network calls before the card appears. No confirmation screens after saving.

**Engineering implication:** Optimistic UI on all save operations. The card appears immediately on tap. The Supabase write happens in the background. If it fails, a subtle inline retry indicator appears on the card — never a blocking modal.

### 3. Empty States Invite, Never Apologise
Every empty state explains what goes there, shows what it will look like when full, and invites the user to start. A blank screen is a failure state.

**Engineering implication:** Every route that can render zero results must have a dedicated empty state component with warm copy and a CTA. There are no default empty states — each category has its own.

### 4. Discovery Is Ambient, Not Forced
No streaks. No daily active user mechanics. No push notification cadences. The app surfaces relevant saves when the user is in the right moment — not when it thinks they should engage.

**Engineering implication:** No engagement-driving features in V1 or V2. Discovery Mode (contextual surfacing) is a V3 feature, built only after the vault is trusted. No notification infrastructure until V3.

### 5. Private By Default
No sharing affordances in the main flow. No "share this card" button on the default card view. Privacy is the default state. Sharing is always an explicit, deliberate choice.

**Engineering implication:** No share buttons on card components in V1 or V2. The "Tell [source]?" flow in the experienced flow is the only sharing mechanic in V2 — and it is always optional, always last.

---

## Typography

### Font Pairing

**Primary (headings, card titles):** `Fraunces` — a variable serif with warmth and character. Reminiscent of old editorial design. Not corporate, not tech. Available via Google Fonts.

**Secondary (body, metadata, UI text):** `DM Sans` — a geometric humanist sans-serif. Clean without being cold. Pairs naturally with Fraunces. Available via Google Fonts.

**Why this pairing:** Fraunces gives Taareef personality in the moments that matter (card titles, display text, the brand name). DM Sans keeps the UI clean and readable in dense information contexts (metadata, labels, form fields). Together they feel like a well-designed independent magazine — not a SaaS product.

### Type Scale

| Role | Font | Size | Weight | Line height |
|---|---|---|---|---|
| Display (onboarding headlines) | Fraunces | 32px | 700 | 1.2 |
| Page title | Fraunces | 24px | 600 | 1.3 |
| Card title | Fraunces | 18px | 500 | 1.3 |
| Body text | DM Sans | 16px | 400 | 1.6 |
| Source attribution | DM Sans | 14px | 500 | 1.4 |
| Metadata label | DM Sans | 12px | 400 | 1.4 |
| Category chip | DM Sans | 12px | 600 | 1.0 |
| Button text | DM Sans | 16px | 600 | 1.0 |
| Empty state body | DM Sans | 15px | 400 | 1.6 |

---

## Colour System

### Brand Colours

```css
/* Primary — warm terracotta */
--color-primary-50:  hsl(16, 80%, 97%);
--color-primary-100: hsl(16, 78%, 93%);
--color-primary-200: hsl(16, 74%, 85%);
--color-primary-300: hsl(16, 70%, 74%);
--color-primary-400: hsl(16, 68%, 62%);
--color-primary-500: hsl(16, 65%, 52%);   /* main brand */
--color-primary-600: hsl(16, 62%, 43%);
--color-primary-700: hsl(16, 60%, 35%);
--color-primary-800: hsl(16, 55%, 27%);
--color-primary-900: hsl(16, 50%, 20%);

/* Neutral scale — warm grey */
--color-neutral-50:  hsl(40, 20%, 98%);   /* page background */
--color-neutral-100: hsl(40, 15%, 95%);
--color-neutral-200: hsl(40, 12%, 90%);
--color-neutral-300: hsl(40, 10%, 82%);
--color-neutral-400: hsl(40, 8%, 68%);
--color-neutral-500: hsl(40, 6%, 55%);
--color-neutral-600: hsl(40, 5%, 42%);
--color-neutral-700: hsl(40, 5%, 32%);
--color-neutral-800: hsl(40, 4%, 22%);
--color-neutral-900: hsl(40, 4%, 12%);   /* primary text */
```

### Semantic Colours

```css
--color-success:  hsl(145, 55%, 42%);   /* experienced / loved */
--color-warning:  hsl(38, 90%, 52%);    /* priority high */
--color-error:    hsl(0, 68%, 52%);     /* error states */
--color-info:     hsl(210, 70%, 52%);   /* informational */
```

### Reaction Colours

```css
--reaction-loved: hsl(350, 75%, 55%);   /* warm rose */
--reaction-good:  hsl(145, 55%, 42%);   /* muted green */
--reaction-okay:  hsl(40, 60%, 52%);    /* warm amber */
--reaction-skip:  hsl(40, 6%, 55%);     /* neutral grey */
```

### Category Accent Colours

Each category has a distinct accent colour used for: category chip background, category icon, and card left border accent.

```css
--category-restaurant: hsl(16, 65%, 52%);    /* terracotta */
--category-bar:        hsl(280, 45%, 52%);   /* muted purple */
--category-film:       hsl(230, 55%, 55%);   /* indigo */
--category-tv:         hsl(200, 65%, 48%);   /* sky blue */
--category-music:      hsl(320, 55%, 52%);   /* rose */
--category-book:       hsl(35, 65%, 48%);    /* amber */
--category-city:       hsl(160, 50%, 42%);   /* sage green */
--category-activity:   hsl(180, 55%, 40%);   /* teal */
--category-podcast:    hsl(265, 55%, 55%);   /* violet */
--category-person:     hsl(25, 60%, 50%);    /* warm orange */
```

### Page Background

```css
--color-background: hsl(40, 20%, 98%);   /* warm off-white, not pure white */
--color-surface:    hsl(0, 0%, 100%);    /* card backgrounds */
--color-border:     hsl(40, 12%, 90%);   /* subtle borders */
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  --color-background: hsl(30, 8%, 10%);
  --color-surface:    hsl(30, 6%, 14%);
  --color-border:     hsl(30, 6%, 22%);
  --color-neutral-900: hsl(40, 15%, 92%);  /* primary text in dark */
  /* Primary and category colours: reduce lightness by 10% in dark mode */
}
```

---

## Spacing and Layout

### Spacing Scale (base 4px)

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Container Widths

```css
--container-max: 480px;   /* max-width for all content — keeps it mobile-feel on desktop */
--container-padding: 16px; /* horizontal padding on mobile */
```

### Breakpoints

```css
/* Mobile first */
sm: 375px   /* design target — iPhone SE */
md: 430px   /* iPhone Pro Max */
lg: 768px   /* tablet — show 2-column layout */
xl: 1024px  /* desktop — centre max-width container */
```

### Bottom Navigation Height

```css
--nav-height: 64px;    /* bottom nav bar on mobile */
--nav-safe-area: 16px; /* additional padding for home indicator */
```

---

## Component Specifications

### Recommendation Card

**Default state (saved):**

```
┌─────────────────────────────────────────┐
│ [Cover image — 80×80px, rounded-lg]     │
│ ─ right of image: ──────────────────── │
│   [Category icon] Category name         │  ← 12px DM Sans, category colour
│   Card title                            │  ← 18px Fraunces 500
│   From: [source_name]                   │  ← 14px DM Sans 500, neutral-600
│   [city if location exists]             │  ← 12px DM Sans 400, neutral-400
│ ─────────────────────────────────────── │
│ [created_at relative]    [priority dot] │  ← 12px neutral-400
└─────────────────────────────────────────┘
```

Design rules:
- Minimum height: 96px
- Cover image: 80×80px, rounded-lg (8px), object-cover
- If no image: category colour background with category icon centred
- Category chip: icon + name, 12px, category accent colour, low opacity background
- source_name: always visible, always "From: [name]" format, DM Sans 500
- No action buttons on the default card — tapping opens card detail

**Experienced state:**

- Subtle green left border (4px, --color-success)
- Reaction emoji appears after source_name: "From: Rohit · 😍"
- Card opacity: 90% (slightly receded from active saves)
- "Experienced" chip in top-right corner

**Dismissed state:**

- Not shown in main vault views
- Only visible in a "Dismissed" filter view
- Strikethrough on title
- Full opacity reduction to 60%

---

### The Add Flow

3 steps. Bottom sheet presentation on mobile.

**Step 1: Category selection**
Grid of all 10 category chips. Single select. Large tap targets (min 44×44px). Selected state: category accent colour background, white text.

**Step 2: Title + source**
- Title field (auto-focus)
- Source name field (optional label: "Who told you about it?")
- URL field (optional label: "Add a link?")
- All fields in a single scrollable view

**Step 3: Confirm and save**
- Preview card appears (the card as it will look in the vault)
- Single "Save" button
- Optimistic: card added to vault immediately on tap
- Sheet closes. User is back in the vault. Their card is at the top.

**Timing target:** Step 1 → Step 2 → Save in under 8 seconds for an experienced user.

---

### Empty States — Copy For All 10 Categories

```
Restaurant:
Headline: "The next great meal is waiting"
Body: "When someone says 'you have to try this place,' save it here in seconds."
CTA: "Save a restaurant"

Bar:
Headline: "Your next favourite bar"
Body: "That rooftop someone mentioned. The cocktail bar from the article. Save them here."
CTA: "Save a bar"

Film:
Headline: "Films worth watching"
Body: "Every film someone swears by — saved here, ready for the next free evening."
CTA: "Save a film"

TV:
Headline: "Your next obsession"
Body: "When someone says 'just start it' — save it here so you actually do."
CTA: "Save a show"

Music:
Headline: "Music worth remembering"
Body: "That album someone played in the car. The artist from the podcast. Save them here."
CTA: "Save something to listen to"

Book:
Headline: "Books you'll actually read"
Body: "Every book that sounds exactly right — saved here until you're ready."
CTA: "Save a book"

City:
Headline: "Places worth going"
Body: "Every city someone makes sound unmissable — saved here with who told you."
CTA: "Save a place"

Activity:
Headline: "Things worth doing"
Body: "The hike, the class, the experience someone keeps telling you about. Save it here."
CTA: "Save an activity"

Podcast:
Headline: "Episodes worth hearing"
Body: "When someone says 'you have to listen to this episode' — save it before you forget."
CTA: "Save a podcast"

Person:
Headline: "People worth following"
Body: "The chef, the writer, the filmmaker someone says you'd love. Save them here."
CTA: "Save a person"
```

---

### The Experienced Flow — Bottom Sheet

Slides up to 70% screen height. Category-specific verb in the header.

**Header:**
`[Category verb] + card title`
Examples: "I went to Pali Village Café" / "I watched Parasite" / "I listened to Currents"

**Reaction selector:**
4 large tappable options in a 2×2 grid or horizontal row:

```
[😍 Loved it]  [👍 Good]
[😐 Okay]      [👎 Skip it]
```

Tap to select. Selected state: option fills with its reaction colour (see Reaction Colours above). Deselect by tapping again.

**Log fields (all optional):**
- When: date picker with "Today" / "Yesterday" / "Pick a date" shortcuts
- With whom: single-select chips: Solo / Partner / Friends / Family
- One line note: text field, 80 char max, placeholder: "One thing you'll remember..."

**"Tell [source_name]?" (only on loved/good verdict):**
Appears below the log fields only when loved or good is selected.
```
Tell Rohit you went? →
[Send a note]  [Skip]
```

Pre-written message (shown on tap of "Send a note", editable before sending):
- Loved: "Finally went to [title] — you were so right. Thank you for the rec ❤️"
- Good: "Went to [title] — it was great! Thanks for the recommendation"

Share via native share sheet (WhatsApp, iMessage, etc.)

**Save button:**
Full width. "Save this experience" copy. Active immediately — reaction is optional.

---

## Motion and Animation

### Principles
- All animations ≤ 200ms
- Purposeful only — no decorative animations
- Use `ease-out` for entrances, `ease-in` for exits
- Respect `prefers-reduced-motion` — all animations should be dismissible

### Specific Transitions

```css
/* Card entry (optimistic UI — card slides in from bottom) */
@keyframes card-enter {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: card-enter 180ms ease-out;

/* Bottom sheet entry */
@keyframes sheet-enter {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
animation: sheet-enter 200ms ease-out;

/* Save confirmation (brief scale pulse on card) */
@keyframes save-confirm {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}
animation: save-confirm 150ms ease-out;

/* Status change (saved → experienced) */
/* Left border fades from neutral to success green */
transition: border-color 300ms ease-out;

/* Tooltip fade */
transition: opacity 200ms ease-in-out;

/* Page transitions */
/* Simple opacity fade between routes */
transition: opacity 150ms ease-in-out;
```

---

## Mobile-First Layout Rules

- All layouts designed for 375px viewport first
- Content max-width: 480px, centred on larger screens
- Horizontal padding: 16px on all screens
- Bottom navigation: fixed, 64px height + safe area inset

### Thumb-Reach Zones (375px screen)

```
Top zone (hard to reach):     0–120px    — avoid primary actions
Middle zone (comfortable):    120–480px  — place primary content
Bottom zone (easy reach):     480–700px  — primary actions here
Bottom nav:                   700–812px  — navigation
```

**Primary actions placement:**
- [+] button: floating, bottom-right, 56px, above navigation
- "Save" button in add flow: bottom of sheet, full width
- Reaction selector in experienced flow: middle of sheet (comfortable reach)

---

## Accessibility

- WCAG AA contrast minimum on all text/background combinations
- Minimum tap target: 44×44px on all interactive elements
- Focus states: visible 2px outline, primary colour, on all interactive elements
- Screen reader labels on all icon-only buttons (`aria-label`)
- Bottom sheet: `role="dialog"`, `aria-modal="true"`, focus trap while open
- Form fields: always have associated `<label>` elements
- Error messages: associated with inputs via `aria-describedby`

---

## Copy Voice Guide

**The voice is:** Warm, direct, human, slightly playful but never silly. Not startup-corporate. Not productivity-app clinical.

**Tests for good copy:**
1. Would a warm friend say this? ("Your vault is starting." ✅ / "Account created successfully." ❌)
2. Does it create anticipation, not obligation? ("That's my life →" ✅ / "Complete setup" ❌)
3. Is it the shortest possible version of itself?

**Button copy:**
- Primary actions: active verbs ("Save it", "Mark as experienced", "Tell Rohit")
- Secondary actions: direct nouns ("Skip", "Later")
- Never: "Submit", "Confirm", "Proceed", "OK", "Continue" (unless no better option)

**Error copy:**
- Always friendly: "Couldn't save — try again?" not "Error 500"
- Always actionable: tell the user what to do next
- Never blame the user

**Empty states:**
- Always start with a headline that expresses what the space is for (desire, not absence)
- Body explains where recommendations come from
- CTA is specific: "Save a restaurant" not "Add item"
