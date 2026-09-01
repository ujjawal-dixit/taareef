// lib/enrichment/meta-writer.ts
//
// ONE SAFE WAY TO WRITE CARD METADATA.
//
// WHY THIS EXISTS
// Enrichment writes a card's metadata several times in one request: the
// correlation id, then the poster, then details and streaming. Every one of
// those writes was hand-built as `{ ...meta, someField }`, where `meta` is a
// snapshot taken when the function started.
//
// That pattern loses data, silently, and it did so three times in one session:
//
//   · enrichment_id written, then erased by the next write (found S18, PR #10)
//   · original_title written, then erased 50 lines later in the SAME function
//     by a comment warning about exactly this (found S18, audit)
//   · last_band never written on the confirm path at all, because a patch
//     targeted one branch and nobody read the resulting file (found S18, audit)
//
// The common cause is not carelessness. It is that `{ ...meta }` LOOKS like it
// preserves everything, and a type-checker agrees, because the object really
// is a valid RecMetadata. Nothing is wrong with the code except that it is
// merging onto a value that has since moved on.
//
// So the fix is not another careful review. It is to make the unsafe thing
// unavailable: an accumulator that carries the running state forward, so each
// write merges onto what was ACTUALLY last written rather than onto a memory
// of it.
//
// Rule for this codebase: enrichment paths never spread `rec.metadata`
// directly. They take a MetaWriter and call .patch().

import type { RecMetadata } from '@/lib/types'

export interface MetaWriter {
  /**
   * Merge a patch into the running state and return the full object to write.
   * The returned value always contains every field written so far in this
   * request, so a later write cannot drop an earlier one.
   */
  patch(fields: Record<string, unknown>): RecMetadata
  /** The current accumulated state, for reads. */
  current(): RecMetadata
}

/**
 * Starts from the row as it was read. Every subsequent patch builds on the
 * previous one rather than on this starting point.
 *
 * Not a database read-through: within one request we know everything we have
 * written, and re-reading would cost a round trip on the save path for no
 * additional safety. It does NOT protect against a concurrent writer in
 * another request — see the note on last-write-wins below.
 */
export function metaWriter(initial: RecMetadata | Record<string, unknown>): MetaWriter {
  let state: RecMetadata = { ...(initial as RecMetadata) }

  return {
    patch(fields: Record<string, unknown>): RecMetadata {
      state = { ...state, ...fields } as RecMetadata
      return state
    },
    current(): RecMetadata {
      return state
    },
  }
}

// CONCURRENCY NOTE
// Supabase updates here are last-write-wins on the whole metadata column, so
// two requests enriching the same card simultaneously can still lose fields.
// That was a live problem while the detail screen re-fired enrichment (fixed
// S18: enrichment now runs once per card). This accumulator solves the
// within-request case, which is where all three observed data losses occurred.
// The cross-request case would need a jsonb merge in SQL, and is not worth the
// complexity until something can legitimately enrich one card twice at once.
