# CARD_SPEC.md — Taareef Card Field Specification
> **Primary reader:** Claude Code.
> Complete field specification for every category — stacked view and open view.
> Last updated: Session 10 — 2026-06-10
> Build every card component from this file. Do not modify without explicit approval.

> **Build status — Session 19, 2026-09-02.** This file is fully realised by
> `components/features/cards/full-card.tsx` — the locked two-zone card (RIM ·
> FACE · WELL · INFO, the notch, the vow footer, 432px), rendered on the detail
> screen and the source of truth for the share/export path. It is **not** yet
> matched by `GridCard` and `CompactRow` in
> `components/features/cards/recommendation-card.tsx` — the category-list grid
> and compact rows still carry their pre-Session-9 layout. Rebuilding them to
> this spec is BACKLOG.md Priority 7 (see also KB-FILEMAP.md). Until then, "build
> every card component from this file" holds for the full card only.

---

## Two Views — Definition

**Stacked view** — scanning mode. Only what helps the user decide whether to tap. Never more than 3 information fields beyond title and source.

**Open view** (the detail screen interaction layer) — deciding mode. Full information. Everything needed to act on the recommendation.

---

## The Card as a Shareable Artifact

The card (top zone of the detail screen) is the product's shareable artifact. `cardRef` lives on the outermost object div — this is what html2canvas captures for sharing.

**Always on the card:**
- The notch: *taareef — from [source name]* in the poster's top-right corner
- Title — Cormorant Garamond italic, always
- Decision line (metaLine) — category-specific
- Cast line — where applicable
- Note/tip (if written) — 2-line clamped, left border in category color
- Vow footer — *to watch* / *to read* etc., transforms when experienced
- Subcategory label — bottom-right

**Never on the card front:**
- Category badge (removed — notch carries the category soul)
- Footer handshake (removed — source lives only in the notch)
- Runtime, rating, synopsis, full cast

**OTT logo:** On the poster bottom-left, on a dark scrim. Only when there is a poster image and a known platform. Never in the info zone.

---

## Card Anatomy (locked reference: taareef-decision-cards.html)

```
Object (432px fixed height, contact shadow)
└── Rim (lit physical edge)
    └── Face (flex column, #0e1421 gradient)
        ├── Well (flex:1 — flexes to fill)
        │   ├── Poster / Criterion
        │   ├── 14% category wash (poster only)
        │   ├── Marriage gradient (32%, to #0e1421)
        │   ├── OTT logo (bottom-left, dark scrim, poster only)
        │   └── Notch (top-right, 28px, real dash bar)
        └── Info (flex:0 — hugs content)
            ├── Title (Cormorant italic 500, 25/22/19px)
            ├── Decision line / metaLine (DM Sans 11px, ink-soft)
            ├── Cast line (DM Sans 11px, ink-faint)
            ├── Tip (Cormorant italic 12.5px, 2-line clamp)
            └── Footer (vow + subcategory)
```

---

## Criterion Mode (no poster)

When no poster image: CategoryMotif centered at size={150} on a radial-gradient background.
- Background: `radial-gradient(ellipse at 50% 42%, rgba(rgb,0.20) 0%, rgba(10,10,10,0.96) 60%, #0a0a0a 100%)`
- The motif is the category's soul as ornament. It does not depict the subcategory literally.
- No category icon when motif is present — one or the other, never both.

---

## Image Rules

**Poster exists:** fill + object-fit cover + 14% category wash (mix-blend-mode overlay, z-index 4). Marriage gradient 32%.

**No poster:** Criterion mode — CategoryMotif on radial bg. Marriage still renders (32%).

---

## Universal Rules — All Categories

1. Source always visible. Every card. Every view. Never hidden.
2. Reactions unlock only after experiencing — never on saved cards.
3. Tip shown on card if written. Not shown in compact list rows.
4. Tell source only for loved or good. Never okay or skip.
5. No rating field. Reaction after experience replaces it.
6. `what_to_order` (Dine) and `dates` (Visit) are dedicated metadata fields, not notes.

---

## WATCH

Folk tradition: Warli (cobalt #3C82FF, rgb 60,130,255, deepDark #030810)

### Film
**metaLine (card):** Year · Genre · Runtime
**castLine:** Director
**Open:** Director · Genre · Year · Runtime · Note · Reactions · Tell source
**Subtype:** `film` | **Metadata:** `director`, `genres`, `release_year`, `runtime_minutes`, `tmdb_id`

### Series
**metaLine:** Ongoing/Completed · Seasons
**castLine:** Created by
**Open:** Created by · Platform · Seasons · Status · Note · Reactions · Tell source
**Status states:** saved → experienced → dismissed
**Subtype:** `series` | **Metadata:** `created_by`, `series_status`, `seasons`, `streaming_platforms`

### Documentary
**metaLine:** Year · Subject
**castLine:** Director
**Open:** Director · Subject · Year · Runtime · Note · Reactions · Tell source
**Subtype:** `documentary` | **Metadata:** `director`, `release_year`, `runtime_minutes`

---

## LISTEN

Folk tradition: Gond (rose #DC3C82, rgb 220,60,130, deepDark #090206)
No "currently listening" state. Confirmed.

### Album
**metaLine:** Artist · Year
**castLine:** Genre
**Open:** Artist · Genre · Year · Tracks · Note · Reactions · Tell source
**Subtype:** `album` | **Metadata:** `artist`, `genre`, `release_year`, `total_tracks`, `spotify_id`

### Podcast
**metaLine:** Host
**castLine:** Genre
**Open:** Host · Category · Avg episode length · Specific episode (if in note) · Note · Reactions
**Subtype:** `podcast` | **Metadata:** `host`, `category_label`, `avg_episode_length`

### Audiobook
**metaLine:** Author
**castLine:** read by [Narrator] (if known)
**Open:** Author · Narrator · Note · Reactions · Tell source
**Subtype:** `audiobook` | **Metadata:** `author`, `narrator`

### Artist
**metaLine:** Genre
**castLine:** — (none)
**Open:** Genre · Active since · Known for · Note · Reactions
**Subtype:** `artist` | **Metadata:** `genre`, `active_since`, `known_for`

---

## READ

Folk tradition: Madhubani (amber #F09114, rgb 240,145,20, deepDark #080401)

### Fiction
**metaLine:** Author · Year
**castLine:** Sub-genre (free text: Literary fiction / Magical realism / Historical fiction etc.)
**Open:** Author · Sub-genre · Year · Note · Reactions · Tell source
**Status states:** saved → reading → finished → abandoned → dismissed
**Subtype:** `fiction` | **Metadata:** `author`, `subgenre`, `year`, `progress_pct`

### Non-fiction
**metaLine:** Author · Year
**castLine:** Sub-genre (free text: Narrative non-fiction / Biography / Essay etc.)
**Open:** Author · Sub-genre · Year · Note · Reactions · Tell source
**Status states:** saved → reading → finished → abandoned → dismissed
**Subtype:** `non-fiction` | **Metadata:** `author`, `subgenre`, `year`, `progress_pct`

### Poetry
**metaLine:** Author · Year
**castLine:** — (none)
**Open:** Author · Year · Note · Reactions · Tell source
**Status states:** saved → reading → finished → abandoned → dismissed
**Subtype:** `poetry` | **Metadata:** `author`, `year`

**Reading progress:** shown as a thin visual bar in compact row — not a percentage number. Subtle.
**Sub-genre** replaces publisher for all Read subtypes.

---

## DINE

Folk tradition: Block-print/Jaipur (burnt orange #DA5526, rgb 218,85,38, deepDark #090300)
**`what_to_order`** = dedicated `metadata.what_to_order` field — NOT the note. Free text. Multiple items or none. Capture extracts automatically. Displayed as "Order — [text]" in Zone A.

### Restaurant
**metaLine:** Type · City
**castLine:** — (cuisine removed from stacked)
**Open:** Type · Neighbourhood · City · What to order (if present) · Note · Reactions · Tell source
**Type vocabulary:** Fine dining / Casual / Neighbourhood / Hole-in-the-wall
**Subtype:** `restaurant` | **Metadata:** `type`, `neighbourhood`, `city`, `what_to_order`, `cuisine`

### Café
**metaLine:** City
**castLine:** — (none)
**Open:** Neighbourhood · City · Note · Reactions
**Subtype:** `café` | **Metadata:** `neighbourhood`, `city`

### Bar
**metaLine:** Type · City
**castLine:** — (none)
**Open:** Type · Neighbourhood · City · What to drink (same `what_to_order` field) · Note · Reactions · Tell source
**Type vocabulary:** Cocktail bar / Wine bar / Rooftop / Speakeasy / Dive
**Subtype:** `bar` | **Metadata:** `type`, `neighbourhood`, `city`, `what_to_order`

### Street food
**metaLine:** City
**castLine:** — (none)
**Open:** City · What to order · Note · Reactions
**Subtype:** `street food` | **Metadata:** `city`, `what_to_order`

---

## DO (Experience)

Folk tradition: Saora (teal #10C3B6, rgb 16,195,182, deepDark #010e0d)
User-facing label: **Experience**. Code id remains `do`. Verb: "I experienced". verbPast: "experienced".

### Hike
**metaLine:** Location · Difficulty
**castLine:** Distance
**Open:** Location · Difficulty · Distance · Duration · Note · Reactions
**Difficulty vocabulary:** Easy / Moderate / Hard / Expert
**Status states:** saved → done → dismissed
**Subtype:** `hike` | **Metadata:** `city`, `difficulty`, `distance`, `duration`

### Trail
**metaLine:** Location
**castLine:** Distance
**Open:** Location · Distance · Duration · Note · Reactions
**Status states:** saved → done → dismissed
**Subtype:** `trail` | **Metadata:** `city`, `distance`, `duration`

### Adventure
**metaLine:** Location
**castLine:** — (none)
**Open:** Location · What it involves (one word: bungee/scuba/paragliding) · Duration · Note · Reactions
**Subtype:** `adventure` | **Metadata:** `city`, `involves`, `duration`

### Workshop
**metaLine:** Location
**castLine:** — (none)
**Open:** Location · What it covers · Duration · Note · Reactions
**Subtype:** `workshop` | **Metadata:** `city`, `subject`, `duration`

### Live show
**metaLine:** Venue · City
**castLine:** — (none)
**Open:** Venue · City · Date · Note · Reactions
**Subtype:** `live show` | **Metadata:** `venue`, `city`, `dates`

---

## VISIT

Folk tradition: Kalamkari (sky #1991E1, rgb 25,145,225, deepDark #010810)
**Dates are P1** — most important field in this category. An exhibition closes. A concert sells out.

**Urgency system (metadata.dates, free text string):**

| Condition | Display |
|---|---|
| No dates | Absent |
| Closing >30 days | Dim white |
| Closing ≤30 days | Cerulean vivid 78% |
| Closing ≤7 days | Cerulean vivid 100% + small filled dot before text |
| Already closed | Strikethrough, grey 22% |

### Museum
**metaLine:** City
**castLine:** Venue
**Open:** Venue · City · Current show · Note · Reactions
**Status states:** saved → experienced → dismissed
**Subtype:** `museum` | **Metadata:** `venue`, `city`, `current_show`

### Gallery
**metaLine:** City
**castLine:** Neighbourhood
**Open:** City · Neighbourhood · Current show (if known) · Note · Reactions
**Subtype:** `gallery` | **Metadata:** `city`, `neighbourhood`, `current_show`

### Heritage
**metaLine:** City + urgency date (if ≤30 days)
**castLine:** Venue
**Open:** Venue · City · Dates · Note · Reactions
**Subtype:** `heritage` | **Metadata:** `venue`, `city`, `dates`

### Viewpoint
**metaLine:** Location
**castLine:** — (none)
**Open:** Location · How to get there · Note · Reactions
**Subtype:** `viewpoint` | **Metadata:** `city`, `how_to_reach`

### Market
**metaLine:** City + urgency date (if applicable)
**castLine:** — (none)
**Open:** City · Neighbourhood · Timing · Note · Reactions
**Subtype:** `market` | **Metadata:** `city`, `neighbourhood`, `dates`

---

## Status States Per Category — Summary

| Category | Valid Status States |
|---|---|
| watch | saved → experienced → dismissed |
| listen | saved → experienced → dismissed |
| read | saved → reading → finished → abandoned → dismissed |
| dine | saved → experienced → dismissed |
| do | saved → done → dismissed |
| visit | saved → experienced → dismissed |

---

## Tell Source Logic

| Source Type | CTA | Button | Action |
|---|---|---|---|
| friend / family / colleague | "Tell [name]?" · "Let them know their rec landed." | SEND | Native share, pre-written warm message |
| instagram / twitter / youtube | "Found via [handle]" · "Visit their page?" | VISIT | Opens profile in browser |
| article / newsletter / podcast | "Enjoyed it?" · "Share this with a friend." | SHARE | Native share with card |
| self | None | None | No loop to close |

Only appears for loved or good. Never for okay or skip.

**Warm message on SEND:**
- Loved: "Finally [verbPast] [title] — you were so right. Thank you ♥"
- Good: "[VerbPast] [title] — it was great! Thanks for the rec."
