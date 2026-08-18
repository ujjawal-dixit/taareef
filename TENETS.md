# TENETS.md — Taareef

> The non-negotiable rules of how we work. Numbered so they can be cited in conversation ("that violates T2").
> Every tenet here was earned by something going wrong. The story is included, because a rule without its cause gets discarded the first time it's inconvenient.
> Last updated: Session 17 — 2026-08-16

---

## T1 — Consistency is the default

Any inconsistency must be a deliberate decision with a stated reason, recorded in `KB-DECISIONS.md`. Unexplained inconsistency is a bug, not a style choice.

When two screens offer the same action, they get the same treatment unless we have written down why not.

**Origin:** "Sign in" rendered as 13px grey at 38% opacity on Screen 0, and as bright neon uppercase two screens later. Same action, opposite emphasis, no reason. Without this tenet that's a taste debate; with it, it's a defect.

---

## T2 — Verify assumptions against the codebase and prior decisions

Before asserting anything about the code, the database, a third-party service, or a past decision — check it. Verified claims and inferred claims must be **labelled differently** in every response.

Trust increases the obligation to check, not the licence to skip it.

**Origin:** a nine-day silent outage (model shut down, error message blamed the user's screenshot), a phantom guest save (documented as working, never built), a wrong database region carried across sessions, a "legacy subtype" migration that targeted values which didn't exist, and three consecutive wrong explanations for why a second Google account could sign in. Every one came from reasoning from plausibility instead of evidence.

**Session 17 extension — enumerate presence before concluding absence.** Four errors in one session shared one shape: deciding something was missing without listing what was there.

| Concluded | Actually |
|---|---|
| `place_id` was thrown away | It was under `place_photo_refs`; the key name was guessed |
| `status` was unconstrained | Six per-category CHECK constraints already existed |
| The nightly backup had failed | It was 01:03 IST, two hours before the job was due |
| A1a and A4 were unbuilt | Claude Code had already shipped them |

**Before changing a thing, list what already governs it** — every constraint on the table, every key actually present in the JSON, every call site of the function, every open PR. A check that returns "missing" is a prompt to enumerate, never a conclusion.

**In practice:** clone the repo fresh rather than pull into a working directory. Query the live database rather than trust documentation. Read the provider's docs before theorising about their API. When something is directly testable, propose the test rather than a mechanism.

**Session 17 extension — the knowledge base is a hypothesis, not a fact.** Three times in one session, something described in the KB as existing either didn't or didn't do what its description implied: the anonymous cleanup job (never written), `claim_anonymous_saves`'s "six layered guards" (real, but two of them silently discarded the sessions we most needed), and an anonymous identity that was assumed to exist on page load but was only created at first save. **When reusing an existing function, read its body, not its description.**

---

## T3 — Destructive operations require a written pre-flight

Any SQL that drops, updates or deletes gets:
1. A **preview** `SELECT` showing exactly which rows or objects will be affected
2. A **transaction test** — `BEGIN` … `ROLLBACK` — to confirm it runs without error
3. The real run
4. A **verification** query proving the intended state, and only the intended state

The checklist is followed, not recalled. See `DATA_SAFETY.md` for the full protocol.

**Origin:** two migrations run against production with no guard rails. Both fine, by luck rather than process. The next one contains `DROP POLICY`, where a mistake doesn't lose rows — it changes who can read them.

---

## T4 — Every delivered file comes with its exact repo address

No file is ever handed over without stating precisely where it goes: `lib/constants/models.ts`, not "the models file." For new files, say explicitly where they sit relative to files already known.

**Origin:** several deliveries contained three files all named `route.ts`. In Session 13 two of them were pasted into each other's paths, and the error only surfaced as a Vercel build failure.

---

## T5 — Discuss before building

No code is written without explicit confirmation. Every build session states: what we're building, the industry lens, the best-practice decision, and the watch-out.

---

## T6 — Never write a file from memory

Clone the live repo or query the live database first. If neither is possible, ask for the file to be pasted. Never guess file contents.

Read exact file bytes before any edit. Never deliver a full-file replacement for a file that hasn't been read in full.

**Session 17 extension:** re-clone at the start of any turn that follows a commit, and check the commit hash **before** the first edit, not after. An edit made on a stale clone silently reverts work that was already merged.

---

## T7 — Complete files only

Every delivery is a complete, `tsc --noEmit`-clean file. No snippets, no diffs, no "add this line around line 40."

---

## T8 — UI preservation

Never change, rebuild, or replace existing UI without stopping and explicitly confirming what would change. Default is preserve; changing UI requires per-instance opt-in.

**Note:** a broad instruction ("make the architecture leaner", "I trust you") is not per-instance opt-in. Blanket permission is exactly what this tenet exists to resist — propose the specific change and wait.

---

## T9 — RCA over plausibility

If a bug survives two fix attempts, stop guessing a third time. Instrument the exact decision points with structured logging, get one piece of real evidence from a live test, and diagnose from that.

**Origin:** the Gokul Bar bug — three plausible, confident, wrong hypotheses before instrumentation revealed the real cause in a single test save.

**Session 17 extension:** when the person's account of what they did contradicts the diagnosis, **their account is the evidence and the diagnosis is the hypothesis.** A first diagnosis of "browsed without saving" was corrected only when Ujjawal described the actual steps he took.

---

## T10 — Producer and consumer ship together

When adding or renaming a field in any stored shape, grep every consumer of that shape **in the same delivery**.

**Origin:** the photo-picker regression — Build 1 added `photo_refs` to candidates, the strip-confirm handler was never updated to copy them through, and it looked like a later build had broken an earlier one.

---

## T11 — Experience before inventory

When reviewing any workflow, walk the user's actual path first. Only then diff against the spec.

**Origin:** a spec-diff of onboarding produced eight tidy questions about button labels and found nothing that mattered. One question about what actually happens to a first-time user found that the guest save was never persisted at all.

---

## T12 — End every response with three things

1. What changed
2. What is next
3. How we could improve the process

The third is not optional and not decorative. It is where the tenets above came from.

---

## T13 — Test instructions are steps, not summaries

Numbered. One action each. What correct looks like, and what broken looks like.

Also: a test must be checkable **in the environment where it runs**. A step whose expected result is impossible there is worse than no test.

**Origin:** a verification step told Ujjawal to expect his save count from the Supabase SQL editor, where `auth.uid()` is always NULL. The correct answer was 0, it looked like a failure, and the migration was fine all along.

**Session 17 extension:** tests Claude runs to check its own work are not tests Ujjawal can run. Both are needed, and they are different artifacts. Claude can query the database; only Ujjawal can tap through the app.

---

## T14 — Additive first, then switch, then remove

When a shared export changes, ship it in three commits: add the new form alongside the old, move every consumer, then delete the old. Every intermediate state must compile.

**Origin:** GitHub's web editor commits one file at a time, so a rename shipped `anon.ts` without `isAnonymous` while the sign-in button still imported it. Two red deployments that were never really broken — just caught mid-change.

---

## T15 — Completeness is not sufficiency

Before delivering, ask: *is this the whole of the thing, or just enough of it to act on?* Then grep for the pattern elsewhere.

**Origin:** the recurring shape of every mistake in Session 16. A model assumed live rather than checked. `linkIdentity` chosen without asking how it fails. Missing images claimed to fall back to motifs without testing. An image guard added to one component and closed out while three others stayed unguarded.

Each time the answer was sufficient to act on, and sufficiency was treated as completeness. A confident wrong answer is worse than not knowing, because it stops the search.

---

## T16 — Ask what the person can do about it

For any failure state, the question is not only *what does it show* but *what can they do next*. A failure with no escape hatch is not handled.

**Origin:** a dead photo URL was hidden correctly and still hid the "add a photo" link, because the card knew the image had failed and the screen did not. The bug was never the broken image — it was the missing way out.

---

## T17 — Preview before you destroy

**No `DELETE` or `UPDATE` is ever run until the same `WHERE` clause has been run as a `SELECT` and the returned count has been read.**

This is a compulsion, not a guideline. It applies to every destructive statement without exception, including — especially — the ones that feel additive and safe. "It felt safe" is the reasoning that precedes accidents.

Every function that destroys or overwrites takes a `dry_run` parameter **defaulting to `true`**. The caller must consciously pass `false`. See `cleanup_anonymous_users()` and `restore_from_backup()` as the reference implementations.

Before and after states are captured in the **same query** where possible, so verification is a comparison rather than a recollection.

**Origin:** Session 17. Claude applied the preview-then-run pattern to the cleanup function and skipped it entirely for a batch of schema changes, purely because the schema changes *felt* additive. One of those "safe" changes shipped a primary key that silently forbade the single most important row in the system, and it survived a twelve-point verification because every check asked *does this exist* and none asked *does this work*.

**Corollary — a schema is not verified until something has successfully written to it.** Build the consumer in the same delivery as the table.

---

## T18 — One file, one purpose, one run

A delivered SQL file is **either** something you run once (DDL) **or** something you run repeatedly (verification). Never both. Verification returns **one result table from one statement**, because that is all the Supabase SQL Editor will display.

Every SQL file carries a header stating:
```
WHAT THIS DOES:
SAFE TO RE-RUN:  yes / no — run once
HOW TO RUN:      paste whole file / run parts in order
CORRECT OUTPUT:
```

**Deliver for the tool actually in use.** Multi-statement scripts fail silently in the Supabase editor — it shows only the last result and manages its own transaction, so `BEGIN`/`ROLLBACK` blocks inside a delivered file do not work as written.

**And where a tool exists to do the job, use it rather than generating instructions.** Claude has direct database access; handing over SQL to be pasted introduced a truncation error that cost a full turn and had nothing to do with the work.

**Origin:** Session 17. A migration file mixed run-once DDL with five separate test statements. Four returned invisibly, the editor showed only the last, and a script that had actually succeeded looked like it had failed at step one.

---

## T19 — Branch, preview, merge

**Nothing reaches `main` without a pull request.** Enforced by a GitHub ruleset on the repo, not by anyone's care — enforcement by promise fails, enforcement by setting does not.

The flow, in order:
1. Claude creates a branch and opens a PR
2. Vercel builds a preview for that branch
3. **Ujjawal opens the preview on a real phone and uses it**
4. Ujjawal merges
5. Only then does it go live

**Step 3 is the review. The diff is not.** Reading unfamiliar TypeScript is a weak check; using the app is a strong one. Ujjawal knows what Taareef should feel like and Claude does not — that judgement is where his attention belongs.

**Tiering, so ceremony matches risk:**

| Change | Rule |
|---|---|
| Docs, KB files, comments | Claude merges |
| Backend / analytics, no UI | Claude merges if types and the golden suite pass |
| **Touches any screen** | Ujjawal opens the preview, then merges |
| **Touches user data or auth** | Ujjawal reviews the diff as well |

**One concern per PR.** A batch spanning four unrelated concerns means a single failure has a blast radius of four.

**What this does not do:** it does not prevent bad judgement, only unreviewed access. Every substantive Session 17 mistake would have passed through a PR unnoticed. What it guarantees is that no mistake reaches production without having been seen running first, and that every one is reversible.

---

## T20 — One surface owns a task, and the PR is the claim

Claude is reachable through several surfaces — this chat, Claude Code, Cowork — and **they are the same worker in separate rooms, not several workers.** They share context and reach the same conclusions, and they cannot see each other.

**Only one surface works a given task at a time.**

**The open PR is how that is declared.** Whoever picks up a task opens a PR — draft is fine — **before writing code**. The PR is the claim. Anyone starting work checks open PRs and recent commits on `main` first, exactly as they enumerate existing constraints before altering a table.

Mechanically: `git fetch` and read open PRs before creating a branch. A branch cut from a stale base is how the duplication becomes a merge conflict rather than a quick "already handled".

**Division by kind of work, not by convenience:**

| Surface | Owns |
|---|---|
| Chat | Deciding — architecture, trade-offs, whether to build at all |
| Claude Code | Executing a decision already made, inside the repo |
| Cowork | The case study and other non-code tracks |

**Origin:** Session 17. Ujjawal asked chat to build A1a and A4; Claude Code, holding the same context, built the same two fixes in parallel. Both independently found that `calculateConfidence` is a Levenshtein spelling test, both used the same Gokul Bar and Chungking Express examples, and both opened a PR. PR #3 merged; PR #4 arrived with merge conflicts and was closed as a duplicate.

**Why this is worse than human duplication:** two people notice within minutes and one says "I'm on it". Two Claude instances duplicate silently and confidently for an hour, because identical context produces near-identical work. The similarity of the output is the symptom, not a coincidence. Left unchecked, the second merger resolves conflicts in code they did not write, and two half-designs end up interleaved — the two-copies problem (T10), arriving faster.

---

## Standing calendar item

**Every session, before anything else:** run the vault status query against `recommendations`.

⚠️ **Read the right column.** `max(created_at)` on status-grouped rows is the **save** date, not the transition date — reading it as "last completion" produced a two-month figure that was wrong by six weeks and reprioritised a whole session. Use `status_changed_at` (added Session 17). When a metric drives a decision, state which column it reads and whether that column means what the metric claims.

**Every session:** check the weekly snapshot's `oldest_untouched_days`. If it climbs one per day, the bottom of the vault is dead. If it ever **drops**, something down there was rescued — stop and find out what caused it.

**Quarterly:** check `https://console.groq.com/docs/deprecations`. Groq retires models on roughly a six-month cycle.
