// lib/utils/enrich.ts
// Fire-and-forget enrichment trigger.
// Called client-side after a successful save.
// Never blocks the save flow — silent failure is acceptable.
// Film/TV → TMDB poster. Music → Spotify artwork.

export async function triggerEnrichment(id: string): Promise<void> {
  // Only enrich real records, not temp optimistic ones
  if (id.startsWith('temp-')) return

  try {
    // Fire and forget — we don't await the result
    fetch(`/api/enrich/${id}`, { method: 'POST' }).catch(() => {
      // Silent — enrichment failure never surfaces to user
    })
  } catch {
    // Silent
  }
}
