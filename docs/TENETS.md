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

### T24 · Read backwards from the field, not forwards from the writer

T10 says a producer and its consumers ship together, and it is always applied
in one direction: *I changed this writer, who reads it?* Session 18 found the
other direction matters more.

`capture_people` and `capture_year` were added to the extraction schema and
wired through one producer. A second producer existed — the typed fast path in
`capture-screen.tsx`, which skips the extraction LLM whenever the form is
filled — and it wrote neither field. The corroboration rule that the whole
session was spent building was therefore **inert on the path most people use**,
and four separate audits of the enrichment route did not find it, because every
one of them asked "did this write survive?" and none asked "was this value ever
created, and by how many places?"

**Before trusting a field, list every site that writes it.** `grep` for the
field name, not for the function you changed. A field with one reader and two
writers is the shape that hides best: everything type-checks, the tests pass,
and the value is simply absent half the time.

Corollary: a field that is optional in the type system is a field the compiler
will not help you with. If a field must always be written, make the type say so
— in Session 18 making `namedPeople` required rather than optional caused the
compiler to enumerate all five construction sites in one command.

### T23 · Ask each part the question it can actually answer

Session 18 spent an evening on four consecutive failures with one shape. An LLM
was asked to guess spellings, then to pick from a list, then to re-check
another LLM. Those are string-manipulation tasks, which is what models are
weakest at — and each patch needed another patch to clean up after it. Three
models, still breaking.

Meanwhile the model already knew the answer. Given "Javan, starring Shah Rukh
Khan" it knows that is Jawan (2023), directed by Atlee. Nobody asked it. And
TMDB was being driven as a search engine when its strength is being a registry
of canonical ids and checkable facts. **Each part was doing the other part's
job badly.**

The rule: **knowledge from the model, proof from the catalogue, decisions from
arithmetic.** A model's output is a lookup key and a set of claims — never
card data. That makes hallucination structurally harmless: an invented film
produces a failed lookup, never a fabricated card, however badly the model
behaves. No prompt rule can promise that; a data-flow rule can.

Corollary: **never ask a model how confident it is.** Self-reported confidence
is fluent and uninformative. Ask for facts something else can check.

Corollary: **a second model is not a second opinion.** It shares the weights,
the training data and the blind spots. Checking correlated with the thing
checked adds confidence without adding information — which is worse than no
check at all.

**Session 18 extension — verify the FILE, not the diff.** Two defects were
introduced this session by patching with string replacement: one replacement
silently did not match, and one added a field to a spread that a later spread
overwrote. `tsc` passed both times, because both were well-typed. **A type
checker tells you the code is consistent, never that your change happened.**
After any patch, read the resulting file and check the property you were trying
to establish — not the diff, which only shows what you intended.

**Session 18 extension — this applies mid-conversation, not just before code.** Asked whether an LLM could see the user's raw phrasing, Claude answered "the capture text isn't stored" and built a recommendation around that constraint. One grep would have shown the audio route already returns the transcript so the capture screen can display it. Nothing needed storing; the design question had a different and easier answer.

A design conversation is not a lower-evidence setting than a delivery. Constraints invented in discussion are worse than wrong code, because they silently remove options before anyone evaluates them — and nobody reviews a possibility that was never raised. **Before saying a thing does not exist, grep for it, even when talking.**

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

## T20 — Check whether you already did it

**In a long session, Claude cannot trust its own memory of what it has already built.** Context is dropped as a conversation grows. The dropped work is not remembered as forgotten — it is not remembered at all, so introspection cannot catch it and confidence is unaffected.

**Before writing any code, enumerate what already exists:**

```
git fetch origin
git log --oneline HEAD..origin/main     # what landed since this branch
gh/api: list open PRs                    # including ones Claude opened itself
```

**Read the results as potentially your own.** The question is not "has someone else done this" — it is "have I done this and lost the memory of it".

**And branch from a fetched base, never a stale clone.** A stale base turns a duplicate into a merge conflict on someone else's screen.

**Origin:** Session 17. Ujjawal asked for A1a and A4. Claude built them, opened PR #3, and merged it. Two hours later — the earlier turn no longer in context — Claude built the identical fixes again and opened PR #4, which arrived with merge conflicts.

Claude then found PR #3, guessed it came from Claude Code, and wrote that guess into this tenet as fact. It had not been checked. One API call showed both PRs were authored by the same git identity Claude had configured, pushed with the token only Claude held. **The tenet was originally written to solve a coordination problem between tools that never occurred**, while the real cause — Claude repeating its own lost work — went unaddressed.

**The compounding failure is the one to remember.** The wrong diagnosis was not a guess held loosely; it was a guess presented to Ujjawal as an explanation, built into a rule, and committed. When the cause of something is unknown, say unknown and check — an invented cause is worse than an open question, because it stops the search and it ships.

**Corollary — the same applies across surfaces.** If Claude Code or Cowork is also working the repo, the open PR is the claim, and it is opened before the code. But that is the secondary case. The primary case is Claude duplicating itself.

## T21 — Verify before explaining, not after being challenged

When explaining something that happened in the repo, the database, or a deploy, **check the record before offering a cause.** Not once the explanation is questioned.

If the cause cannot be checked, say **"unknown, checking"** and check. An invented cause is worse than an open question, because a plausible story ends the search and then ships.

**The tell:** a hedge word followed by confident use of the hedged thing. *"Someone — Claude Code, at a guess —"* and then three paragraphs treating Claude Code as established. **If a claim needs a hedge, it needs a lookup, not a softer verb.**

**Origin:** Session 17. Finding an unexpected merged PR, Claude guessed it came from Claude Code, wrote that guess into TENETS.md as fact, and committed it. One API call — the one eventually run when Ujjawal pushed back — showed both PRs were authored by the same git identity Claude had configured, using the token only Claude held. The invented cause was on its way to becoming a permanent rule addressing a problem that had never occurred.

---

## T22 — Long sessions end; handoff files are the memory

**Claude's context degrades as a session grows, and it cannot perceive this happening.** Dropped work is not remembered as forgotten — it is not remembered at all, so confidence is unaffected and introspection cannot catch it.

Therefore:

- **A session that has run long enough to lose turns should end, not push on.** The knowledge-base files exist so a fresh session loses nothing but the fog.
- **Claude proposes the handoff** when a session has produced several deliveries or when it notices it is reconstructing something it should already know. It does not wait to be told.
- **Nothing important lives only in the conversation.** A decision that matters is written to `KB-DECISIONS.md`, a gap to `GAPS.md`, a rule to `TENETS.md` — at the time it is made, not at session end. Chat is not storage.
- **Session close is not optional.** `KB-SESSION_LOG.md`, `GAPS.md`, and any changed KB file are updated before the session ends.

**Origin:** Session 17. Claude built A1a and A4, opened PR #3, lost that turn from context as the conversation grew, and two hours later rebuilt the identical work as PR #4. The duplication was invisible from the inside; it surfaced only as a merge conflict on Ujjawal's phone.

**The general form:** every safeguard in this file assumes Claude can remember the session it is in. That assumption weakens over a long conversation. Writing things down is not documentation overhead — it is the only memory that does not decay.

---

## Standing calendar item

**Every session, before anything else:** run the vault status query against `recommendations`.

⚠️ **Read the right column.** `max(created_at)` on status-grouped rows is the **save** date, not the transition date — reading it as "last completion" produced a two-month figure that was wrong by six weeks and reprioritised a whole session. Use `status_changed_at` (added Session 17). When a metric drives a decision, state which column it reads and whether that column means what the metric claims.

**Every session:** check the weekly snapshot's `oldest_untouched_days`. If it climbs one per day, the bottom of the vault is dead. If it ever **drops**, something down there was rescued — stop and find out what caused it.

**Quarterly:** check `https://console.groq.com/docs/deprecations`. Groq retires models on roughly a six-month cycle.
