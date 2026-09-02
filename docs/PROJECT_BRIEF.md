# ⚠️ IMPORTANT NOTE — Read Before This File

**Product philosophy, the four core loops, the analogies, the anti-patterns, the north star moments, the journal test: all still valid and unchanged.**

**For current technical spec: read KB-CLAUDE.md first.**

**Superseded as of Session 10 (2026-06-10):**
1. **"10 categories"** → 6 categories: watch · listen · read · dine · do (Experience) · visit. See KB-CLAUDE.md.
2. **"Category Bar (always visible)"** → Deprecated. Navigation is via a 2×3 tile mosaic on the dashboard.
3. **"Explore / Find Toggle"** → Not built. Category list at /dashboard/[category] is the current pattern.
4. **"Depth Bar"** → Not built. Subcategory filter pills in category list view are the current pattern.
5. **"Do" category** → User-facing label is "Experience". Code id stays `do`.
6. **V1 scope** → Many V1 items are live. See BACKLOG.md for the accurate done/not-done split.
7. **Card design** → The locked reference is taareef-decision-cards.html (not the spec in this file). See KB-CLAUDE.md Card Design System.
8. **Navigation** → Screen 2 (category capture chips) shows 6 categories as: Watch · Listen · Read · Dine · Experience · Visit.

---

# PROJECT_BRIEF.md — Taareef

> **Primary reader:** both (planning Claude and Claude Code).
> The product vision and philosophy. Do not generalise. Do not round off nuances.
> Originally written Session 3 — May 13, 2026.

---

## The Problem

Recommendations decay.

When someone you trust says "you have to try this restaurant" or "watch this film," that signal is warm, specific, and immediately valuable. Within 48 hours, it has half-disappeared. Within two weeks, it is gone — buried in a WhatsApp message three hundred conversations deep, a saved post on Instagram you'll never revisit, a screenshot you'll never find.

The failure happens at two specific moments: when the conversation moves on, and when you try to find it and can't. Every existing tool fails completely — Instagram, WhatsApp, Notes, bookmarks, memory — none were built for recommendations. The problem is not partially solved anywhere. Taareef is not a better version of an existing solution. It is the first tool built specifically around this problem.

---

## The Core Insight

The recommendation itself is not the value. The source is.

When Arjun — who has spent years eating his way through every neighbourhood in the city, whose food instincts you have never once seen fail — tells you to try the Andhra place in Bandra, that signal is qualitatively different from a top-10 article. It carries trust, context, and a specific voice.

Taareef preserves the source. Always. Visibly. On every card, in every list view, in every search result. The source is never buried. It is the most prominent piece of metadata on the card. It is the entire differentiator.

---

## The User

Deeply culturally engaged — food, film, music, books, travel are identity, not hobby. Has a small network of specialist sources — each trusted in one or two categories, not generalists. Recommendations arrive with context and reason, making the source inseparable from the value.

Primary failure points: WhatsApp and Instagram — recommendations arrive in conversational noise and are immediately unrecoverable. Both capture and retrieval are equally broken.

---

## The Emotion

Intimate discovery. The feeling of being guided by people you trust toward experiences that are right for you at the right moment. Not productivity. Not organisation. Not social performance. A private companion for exploration — warm, personal, honest.

At scale: self-knowledge. The vault becomes a memoir — everywhere you went, everything you experienced, everyone who pointed you there. What you were suggested and when. What you experienced and when. Who you trust. What you explore most.

---

## The Philosophy

**Privacy:** Inward by default, outward only by choice. The vault is always personal. You don't share what you were suggested — you share what you experienced, and only when you choose to be generous. Never performative. Never an audience.

**Trust:** Human recommendation is categorically different from algorithmic recommendation. Trust is earned through track record, not proximity. A YouTube channel you've followed for years and a cinephile friend are equally valid sources.

**Engagement:** Small, purposeful, precious. We celebrate relations and experiences. The app exists to serve life outside it — never to trap you inside it.

**The mission:** We celebrate relations and experiences.

---

## The Journal Test

Every feature decision is filtered through one question: does this make Taareef feel more like a private journal or less like one?

More — build it. Less — don't.

Examples:
- Public follower counts → less → fail
- Tell Arjun you went → more → pass
- Star ratings visible to others → less → fail
- Personal Wrapped at year end → more → pass
- Trending recommendations → less → fail
- A curated list shared with one friend → more → pass

---

## The Four Core Loops

**Loop 1 — The Recommendation Journey**
From recommendation received → experienced → source acknowledged.
NSM: Priya recommends a restaurant. You save it in seconds. Months later you rediscover it on a Friday evening. You go. You tell Priya. She feels seen. The loop closes.
Feeling: Complete.

**Loop 2 — The Capture Loop**
One tap, one sentence. Card appears. Source intact. Effortless.
NSM: At dinner. Someone recommends a restaurant. You tap the audio button, speak one sentence. You put your phone down. The card is there — source intact, category right. It saved itself.
Feeling: Effortless.

**Loop 3 — The Rediscovery Loop**
Friday evening. Scroll without intent. Find something forgotten. It's exactly right.
NSM: Friday evening, no plans. Scroll without intent. Find a film Arjun mentioned eight months ago. His name, his note, all there. Watch it. Halfway through think — this is exactly what I needed tonight.
Feeling: Being taken care of by your past self and the people you trust.

**Loop 4 — The Relationship Loop**
Experience something. Tell the person. Something completes between two people.
NSM: Went to the place Rohit recommended. It was everything he said. Mark it loved. One tap — "Finally went. You were so right." Rohit replies two hours later. Something completed between two people.
Feeling: A recommendation became a moment between two people.

**Loop 5 — The Self-Knowledge Loop** → V3
The vault becomes a mirror. What you saved, experienced, who you trusted, what you explored. Taareef Wrapped territory. Gated at 50+ saves.

---

## Capture Methods — V1 (Live)

Three entry points:

**Voice** — tap, speak, done. Whisper transcription. Extraction layer parses into pre-filled card. Confirmation step always required.

**Screenshot** — upload or share. Vision model extracts recommendation. Pre-filled card appears. Confirmation step always required.

**Manual** — open app, type details, save.

All three feed into the same confirmation flow. The card always appears before saving.

---

## The Analogies

- **Letterboxd** — ritual and restraint. Logging feels like a private ritual, not data entry.
- **Spotify** — taste as identity and generosity. A shared list is a gift, not a performance.
- **Linear** — speed as a value statement. The save flow must be invisible and instant.
- **Shazam** — collapse discovery and capture into one gesture. One tap. Done.
- **Readwise** — rediscovery as the payoff. The vault rewards you for filling it.
- **Airbnb** — category navigation. One tap changes everything.

---

## Anti-Patterns

**The Performance Trap** — public-facing elements that turn saving into signalling.
**The Completeness Obsession** — retroactive cataloguing of past experiences.
**The Feature Creep Identity Crisis** — reasonable-sounding additions that dilute core purpose.
**The warning:** Goodreads didn't decide to become broken. One reasonable feature at a time.

---

## V1 Scope — Current State

**See BACKLOG.md for the accurate done/not-done split.**

What's live: Google OAuth · 6-category system · all 3 capture methods · TMDB/Spotify/Google Books enrichment · Watchmode streaming platforms · card detail with exact locked design · mark as experienced + reaction · folk-art motif system (24 medallions) · OTT logo on poster · edit screen · feedback form · dashboard mosaic.

**What's missing from V1:** Onboarding flow (4 screens) · seeded example cards · grid/compact card variants rebuilt to locked design.

**V1 "Done" Definition:**
Users can save and capture, retrieve when they want, with perfect UI, and every part of code working well.

---

## V2 — After V1 Is Loved

URL parse · Web Share Target · ShazamKit · Keyword search · PWA · Offline queue · Multi-source stacking · Tell source nudge · Recommendation Receipt · Import from Google Maps · Import from Instagram · Google Places enrichment for Dine

---

## V3 — Growth + Monetisation

Taareef Wrapped (50+ saves) · People Layer · Taareef for Two · Public lists · Collections · Semantic search · Stripe paywall (200 saves) · Browser extension · Discovery Mode · Reminders · Contextual questions to user

---

## North Star Metrics

| Version | Metric | Question |
|---|---|---|
| V1 | First week saves | Does the builder save ≥3 things in week 1? |
| V2 | Friday evening moment | Does it happen within 14 days of first save? |
| V3 | Weekly active savers | ≥1 save/week sustained; free-to-pro conversion ~6% |

---

## Monetisation

Free through V1 and V2. Paywall at 200 saves. Pro at $4.99/mo or $39/yr. Positioned as patronage, not a gate.

---

## Locked Product Decisions

1. No public profiles — ever
2. No algorithmic recommendations
3. No ratings system — reaction only, post-experience
4. No social feed
5. No forced engagement — no streaks, no push notification cadences
6. Save flow max 8 seconds, 2 taps
7. Source always visible — every card, every view, always
8. Nuance fields in detail view only — never at save time
9. Soft delete only
10. Reaction enum: loved / good / okay / skip — exactly 4 options
11. Status states are category-specific — not a global enum
12. People Layer warmth shown as signal, never percentage
13. Wrapped gated at 50+ saves
14. Paywall at 200 saves
15. "Tell source?" only on loved / good — never okay / skip
16. Journal Test applied to every feature decision
17. `do` category id stays `do` in code and DB — user-facing label is "Experience"
18. 6 categories only — watch · listen · read · dine · do · visit. No additions.
