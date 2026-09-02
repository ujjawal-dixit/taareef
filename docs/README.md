# docs/ — Taareef knowledge base

> **Primary reader:** both (planning Claude and Claude Code).

**This folder is the single source of truth.** Project knowledge in the Claude
app is no longer maintained; anything there may be out of date.

**Three participants now.** Ujjawal decides, reviews, merges — final authority.
A planning Claude does product reasoning and writes specs; it cannot write to
this repo, so it hands specs to Ujjawal, who commits them. Claude Code
implements. Every file below carries a **Primary reader** line under its title
saying who it is written for.

## Why it moved here (Session 17, 2026-08-18)

Knowledge files were being uploaded to Claude project knowledge by hand while
code was committed to the repo. The two drifted: `TENETS.md` was absent from
project knowledge entirely and `GAPS.md` was two versions behind, while eleven
files existed **only** in project knowledge and were not backed up anywhere.

Location was the visible problem. **Timing was the real one** — docs were
updated separately from the code they described, so they were always a step
behind. Here, a doc changes in the *same pull request* as the thing it
describes, which makes drift structurally impossible rather than something
anyone has to remember.

## The rule

> **If a change makes a document wrong, the document is updated in the same PR.**

Not afterwards, not at session close. A PR that changes behaviour and leaves a
document describing the old behaviour is incomplete.

## What is where

| File | Reader | Contents |
|---|---|---|
| `../CLAUDE.md` | Claude Code | **Stays at the repo root** — Claude Code reads it from there by convention |
| `TENETS.md` | both | T1–T25, the non-negotiable rules, each with the failure that caused it |
| `GAPS.md` | both | Open gaps by severity; resolved ones with dates |
| `KB-DECISIONS.md` | both | Product and architecture decisions — append only |
| `KB-SESSION_LOG.md` | both | What happened each session |
| `KB-FILEMAP.md` | Claude Code | What every file in the repo does |
| `KB-CLAUDE.md` | both | Session-start context: design philosophy and current technical spec |
| `BACKLOG.md` | both | What we intend to build |
| `DATA_SAFETY.md` | Claude Code | Destructive-operation protocol |
| `KB-MEASUREMENT_SPEC.md` | both | The events layer — original spec, now built (S17–18) |
| `KB-MEASUREMENT_DECISIONS.md` | both | Why the events layer is shaped that way |
| `PROJECT_BRIEF.md` | both | The product, from the beginning |
| `CARD_SPEC.md` | Claude Code | The card, canonical — realised by `full-card.tsx`; grid/compact rows not yet |
| `ONBOARDING_SPEC.md` | both | First-run flow — includes a removed Screen 3, kept for the reasoning |
| `10_-_UX_PRINCIPLES.md` | both | UX principles — **stale (Session 5); read KB-CLAUDE.md and CARD_SPEC.md instead** |
| `04_-_DATA_MODEL.md` | Claude Code | Data model — **lower half stale (retired category names); schema block current** |
| `02_-_API_SPEC.md` | Claude Code | API spec — **stale, contradicts itself; read the route files** |
| `ENV_TEMPLATE.md` | Claude Code | Environment variables |
| `specs/` | both | Specs written by the planning Claude, awaiting implementation. See `specs/README.md` |

## Session start

Clone the repo and read `../CLAUDE.md`, then `TENETS.md` and `GAPS.md`. That is
the whole context load. Nothing needs uploading anywhere.
