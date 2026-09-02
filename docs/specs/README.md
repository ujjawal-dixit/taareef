# docs/specs/ — Specifications awaiting implementation

> **Primary reader:** both (planning Claude and Claude Code).
> Created Session 19 — 2026-09-02.

---

## What lives here

One file per unit of work that has been **specified but not yet built**. A spec
in this folder is a brief a person could hand to any implementer and get back
the thing they meant.

A spec is **not** a decision (those go to `KB-DECISIONS.md`, append-only), not a
gap (`GAPS.md`), and not a backlog line (`BACKLOG.md`). It is the level of
detail between "we should build X" and the pull request that builds it.

Once the work described by a spec has shipped and been verified, the spec is
either deleted or moved into the doc it now describes (a card change folds into
`CARD_SPEC.md`, an API change into `02_-_API_SPEC.md`, and so on). This folder
holds only what is still pending.

## Who writes what

| Role | Does |
|---|---|
| **Planning Claude** | Product reasoning; writes the spec. Cannot write to this repo — hands the file to Ujjawal. |
| **Ujjawal** | Decides, reviews, commits the spec here, merges the eventual PR. Final authority. |
| **Claude Code** | Implements from the committed spec. Verifies the "Where this probably lives" section against the real repo before touching anything. |

## Spec template

Every spec in this folder has these sections, in this order. A section with
nothing in it says so ("None") rather than being dropped.

```markdown
# <name> — spec

> Written by: planning Claude · Session <n> · <date>
> Status: awaiting implementation

## Context
Why this is being built now. What is true today that makes it worth doing.

## Behaviour
What the thing does, from the outside. Observable, not internal. Enough that
two implementers would build the same thing.

## Design intent
The feel, the tone, the reason behind the behaviour. What a reviewer should
check for that a checklist would miss.

## Where this probably lives — UNVERIFIED
The planning Claude's best guess at files, routes, tables, components. Marked
unverified because it was written without grep access. Claude Code confirms
every path here against the live repo before editing, and corrects this
section in the implementing PR.

## Edge cases
The inputs and states that are easy to forget. Empty, missing, expired,
duplicated, offline, first-run, very long, non-English.

## Done when
A short checklist. Each item checkable — by Claude Code in its environment, or
by Ujjawal on a real phone. Say which.

## Out of scope
What this spec deliberately does not cover, so scope creep has a line to cross.

## Open questions
Anything still undecided. If the list is non-empty, the spec is not ready to
implement — it is ready to discuss.

## Assumptions I made
Everything the planning Claude took as true without verifying. Each one is a
place the spec could be wrong. Claude Code checks these first.
```
