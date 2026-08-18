# ONBOARDING_SPEC.md — Taareef First-Run Experience
> Complete specification for the 4-screen onboarding flow.
> Screen by screen. Copy string by copy string. Interaction by interaction.
> Last updated: Session 10 — 2026-06-10 (updated for 6-category system)
> **Session 14 reconciliation note added below — read this before treating anything past it as current build status.**

---

## ⚠️ RECONCILIATION NOTE — Session 14 — 2026-07-22

**This spec was written Session 10 and describes intent. It does not describe what's shipped.** Claude read the actual repo directly this session (`git clone` of github.com/ujjawal-dixit/taareef). The line above claiming "Not yet built as of Session 10" has been removed from this header because it's now known to be wrong — do not treat anything below this note as an accurate description of current build status until the reconciliation session resolves each row of this table.

| This spec says | The shipped code (`app/page.tsx`, `.../onboarding/demo/page.tsx`, `.../onboarding/categories/page.tsx`) actually has |
|---|---|
| Warm off-white background (#FAFAF7), terracotta/sage/gold palette | Dark background (#0a0a0a), neon green accent (#1fce94) — matches the rest of the app's actual dark theme |
| Headline: "Every recommendation you'll ever get. One place." | "Your recommendations — collected and enriched." plus a "taareef" logotype header not mentioned in spec at all |
| Primary button: "See how it works" | "Check it out" |
| Tagline "Save what you trust. Share what you love." | Not in spec at all — appears to be an addition made directly in code |
| 3 seeded example cards (Parasite, Pali Village Café, Currents) | Only 2 exist (Parasite, Pali Village Café) — Currents/Tame Impala was never added |
| Example cards auto-dismiss after 5 real saves | Code says 3 (`EXAMPLE_AUTO_DISMISS_AFTER = 3`) |
| Screen 4 — one 4-second tooltip on `[+]` | Searched the whole `app/` tree — no tooltip implementation found anywhere. Genuine gap. |
| Illustration: static, hand-drawn, top-half | Built as an interactive SVG with mouse-parallax (`ShelfIllustration` component, follows cursor via `mousemove`) — spec doesn't describe this behavior at all |
| Screens 1 and 2 as separate routes | Built as one combined file, `app/(onboarding)/onboarding/demo/page.tsx` (246 lines) — same behavior, different file structure than implied |

**Open question for the reconciliation session, not yet decided:** is the dark-theme, shipped version the actual current direction (plausible — it's consistent with the rest of the app, which is dark-themed throughout), and this spec document is what's stale? Or was the dark theme an unapproved drift? Nothing here should be "fixed" in either direction until that's explicitly decided out loud.

---

## Design Philosophy

**From Duolingo:** Value before friction. Experience the product before signup.
**From Headspace:** Questions that feel like conversation, not forms.
**From Calm:** The onboarding IS the product. Tone from screen one.
**From Notion:** Show don't tell. Examples do the teaching.
**From Linear:** Trust the design. Zero hand-holding.
**From Letterboxd:** No pressure, no urgency. It waits for you.

**The synthesis principle:** Show the magic before asking for anything. When you do ask — one thing at a time, warmly, and make the answer immediately visible.

**Total time from open to inside the product:** Under 90 seconds.
**Required fields before seeing value:** Zero.
**Decisions that feel like decisions:** One (the category question).
**Signup friction:** One tap (Google).

---

## State Management

**Guest session:**
- Guest save stored in `localStorage` under key `taareef_guest_save`
- After Google OAuth: localStorage save migrated to Supabase automatically
- If user closes without signing in: save is lost (acceptable — they can re-save)
- Show "Your save is waiting" on return without signin

**Category preferences:**
- Selected categories stored in `localStorage` during onboarding
- After signin: written to `user_preferences` table as `{ default_categories: string[] }`
- Used to configure the adaptive home screen

**Example cards:**
- Stored as constants in `/constants/example-cards.ts`
- Shown to all users during onboarding
- Dismissed automatically after 5 real saves
- Can be individually dismissed with swipe-left at any time
- Never re-appear after dismissal (`taareef_examples_dismissed` in localStorage)

---

## Screen 0 — The Landing

**Route:** `/` (unauthenticated)

**Layout:** Full screen. No navigation. No header. Background: warm off-white (#FAFAF7). Content vertically centred.

**Illustration:** Warm, hand-drawn style. A softly lit shelf: a book spine, a film reel, a small map folded open, a wine glass, a pair of headphones. Objects arranged naturally, not in a grid — like a bedside table. Upper 50% of screen. Colour palette: warm terracotta, muted sage, soft gold, cream. No people — objects only.

**Copy:**
```
Headline (display size, centred, Cormorant Garamond italic):
"Every recommendation you'll ever get.
One place."
```
No subheadline. No feature list. No bullets.

**Buttons (bottom 30%):**
```
Primary (full width, warm terracotta bg, white text):
"See how it works"

Secondary link (smaller, muted):
"Already have an account? Sign in"
```

**What does NOT appear:**
- No "Sign up free" button
- No feature list, no pricing, no social proof, no email input

**Interaction:**
- "See how it works" → Screen 1
- "Already have an account? Sign in" → /login

---

## Screen 1 — The Demo Vault

**Route:** `/onboarding/demo` (no auth required)

**Layout:** Looks exactly like the real app. Navigation bar visible but [+] is the only interactive element. Subtle banner at very top (dismissible): "This is what your Taareef looks like →"

**The three seeded example cards** (same design as production cards, muted 90% opacity, small "example" chip top-right):

```
Card 1 — Watch
  Title: Parasite
  Subtype: film
  Source: "From Ahmed"
  Tip: "Watch it knowing nothing"
  Image: TMDB poster (cached at build time)
  Status: saved

Card 2 — Dine
  Title: Pali Village Café
  Subtype: café
  Source: "From Rohit"
  Tip: "Try the eggs benedict"
  Image: static restaurant photo (Unsplash, not live API)
  Status: saved

Card 3 — Listen
  Title: Currents
  Subtype: album
  Source: "From that drive home"
  Tip: "Best album for a long drive"
  Image: Spotify album art (cached at build time)
  Metadata: { artist: 'Tame Impala' }
  Status: saved
```

**Invitation prompt (sticky bottom, above nav):**
```
"This is what your Taareef looks like.
Save your first one. →"
```
Tap anywhere → opens Screen 2.

**What the user can interact with:**
- [+] button → Screen 2
- Invitation card → Screen 2
- Example cards → read-only detail view (no edit actions)

**What the user cannot interact with:**
- Category filter pills (visible, not interactive)
- Edit or delete on example cards

---

## Screen 2 — The First Save (Guest)

**Trigger:** [+] or invitation card from Screen 1.
**Presentation:** Bottom sheet, slides up, 80% screen height.

**Layout:**
```
Header: "Save a recommendation"
[×] dismiss (returns to Screen 1)

─────────────────────────────────────

Field 1: What is it?
Placeholder: "Restaurant name, film title, album..."
Auto-focus: yes

─────────────────────────────────────

Field 2: What kind?
Horizontal scrollable row of 6 category chips:
  Watch · Listen · Read · Dine · Experience · Visit

Selected: category vividColor background, white text
Single select only

─────────────────────────────────────

Field 3: Who told you about it?
Placeholder: "Arjun, that newsletter, a friend..."
Required: No

─────────────────────────────────────

Primary button (full width):
"Save it"
Disabled until title + category selected
```

**On "Save it":**
1. Sheet closes, slide-down animation
2. Card appears immediately in demo vault (optimistic, above example cards)
3. Example chip → full card style within 500ms
4. Invitation card transforms into signin prompt

**Signin prompt (replaces invitation card):**
```
Headline: "Your vault is starting."
Body: "Create an account to keep it — and everything
you'll save from now on."

Primary (full width): "Continue with Google"
Divider: "— or —"
Secondary (outlined): "Continue with Email"
```

**Design rule:** The card the user just saved must be visibly preserved behind the signin prompt. The prompt is translucent (backdrop blur). They can see what they are protecting.

**On Google OAuth complete:** Guest save migrated from localStorage → Supabase. User lands on Screen 3.

---

## Screen 3 — The One Question

**Route:** `/onboarding/categories` (post-auth, first session only)

**Layout:** Full screen. No navigation. Light off-white (#FAFAF7). Content centred, scrollable.

**Copy:**
```
Question (large, warm, centred, Cormorant Garamond italic):
"What do people recommend
to you most?"

Subtext (smaller, muted):
"Pick all that feel right"
```

**Category grid** (6 categories as large tappable chips, full-width or 2-col):
```
Watch
Listen
Read
Dine
Experience
Visit
Everything
```

**Chip states:**
- Unselected: white bg, muted border, dark text
- Selected: category vividColor bg, white text, subtle checkmark
- Multi-select: any combination
- "Everything": selects all 6 simultaneously

**Validation:** ≥1 required. 0 selected + button tap → gentle shake + "Pick at least one to get started" (fades after 2s).

**Primary button (full width, fixed bottom):**
```
"That's my life →"
```
NOT "Continue". NOT "Next". The → is part of the copy.

**On tap:** Selected categories → Supabase user_preferences. Navigate to Screen 4.

---

## Screen 4 — The Configured Home

**Route:** `/dashboard` (first session)

**What appears:**
- The real app home screen. Not a tutorial.
- Their first real save at the very top
- Example cards below (still showing, demarcated)
- Only selected categories shown
- No loading screen from Screen 3
- No "Setup complete!" message, no confetti, no modal

**The one tooltip:**
Appears 500ms after Screen 4 loads. Attached to the [+] button.
```
"Tap [+] any time to save a recommendation in seconds."
```
Small rounded card, warm background, white text. Arrow pointing to [+]. Fade-in 200ms. Disappears after 4 seconds. Never shown again (`taareef_tooltip_shown: true` in localStorage).

**Example cards:**
- Still visible, still muted, still labelled "example"
- Dismissible individually via swipe-left
- Auto-disappear after 5 real saves
- No "dismiss all" button

---

## Error States

```
Sign in fails:
"Couldn't sign in — please try again"
(Toast, bottom, auto-dismisses 3s)

Save fails during guest flow:
"Couldn't save — try again?"
(On the card itself, retry tap target)

No categories selected + button tapped:
"Pick at least one to get started"
(Below grid, fades after 2s)

Network unavailable during save:
"Saved — will sync when you're back online"
(Toast — save queued in localStorage)
```

---

## Constants File: `/constants/example-cards.ts`

```typescript
import type { Recommendation } from '@/lib/types'

export const EXAMPLE_CARDS: Partial<Recommendation>[] = [
  {
    id: 'example-1',
    title: 'Parasite',
    category: 'watch',
    source_type: 'friend',
    source_name: 'Ahmed',
    notes: 'Watch it knowing nothing',
    image_url: '/examples/parasite.jpg', // cached at build time
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'film', director: 'Bong Joon-ho', release_year: 2019 },
  },
  {
    id: 'example-2',
    title: 'Pali Village Café',
    category: 'dine',
    source_type: 'friend',
    source_name: 'Rohit',
    notes: 'Try the eggs benedict',
    image_url: '/examples/pali-village.jpg', // static from Unsplash
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'café', city: 'Mumbai' },
  },
  {
    id: 'example-3',
    title: 'Currents',
    category: 'listen',
    source_type: 'self',
    source_name: 'that drive home',
    notes: 'Best album for a long drive',
    image_url: '/examples/currents.jpg', // cached Spotify artwork
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'album', artist: 'Tame Impala', release_year: 2015 },
  },
]

export const EXAMPLE_CARD_IDS = EXAMPLE_CARDS.map(c => c.id)

export function isExampleCard(id: string): boolean {
  return EXAMPLE_CARD_IDS.includes(id)
}
```

> **Note added Session 14:** the actual file at this path currently contains only 2 of these 3 cards (Currents/Tame Impala is missing), and uses `EXAMPLE_AUTO_DISMISS_AFTER = 3` rather than the "5 real saves" described above. See BACKLOG.md.
