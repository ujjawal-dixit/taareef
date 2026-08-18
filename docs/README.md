# docs/ — Taareef knowledge base

**This folder is the single source of truth.** Project knowledge in the Claude
app is no longer maintained; anything there may be out of date.

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

| File | Contents |
|---|---|
| `../CLAUDE.md` | **Stays at the repo root** — Claude Code reads it from there by convention |
| `TENETS.md` | T1–T22, the non-negotiable rules, each with the failure that caused it |
| `GAPS.md` | Open gaps by severity; resolved ones with dates |
| `KB-DECISIONS.md` | Product and architecture decisions — append only |
| `KB-SESSION_LOG.md` | What happened each session |
| `KB-FILEMAP.md` | What every file in the repo does |
| `KB-CLAUDE.md` | Working notes on how Claude and Ujjawal collaborate |
| `WORKING_AGREEMENT.md` | The collaboration contract |
| `BACKLOG.md` | What we intend to build |
| `DATA_SAFETY.md` | Destructive-operation protocol |
| `KB-MEASUREMENT_SPEC.md` | The events layer as built |
| `KB-MEASUREMENT_DECISIONS.md` | Why the events layer is shaped that way |
| `PROJECT_BRIEF.md` | The product, from the beginning |
| `CARD_SPEC.md` | The card, canonical |
| `ONBOARDING_SPEC.md` | First-run flow |
| `10_-_UX_PRINCIPLES.md` | UX principles |
| `04_-_DATA_MODEL.md` | Data model |
| `02_-_API_SPEC.md` | API spec — **stale, predates several changes** |
| `ENV_TEMPLATE.md` | Environment variables |

## Session start

Clone the repo and read `../CLAUDE.md`, then `TENETS.md` and `GAPS.md`. That is
the whole context load. Nothing needs uploading anywhere.
