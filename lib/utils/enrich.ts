// Fire-and-forget enrichment trigger. Called after successful save.
// Film/TV → TMDB. Music → Spotify. Never blocks the UI.
export async function triggerEnrichment(id: string): Promise<void> {
  if (id.startsWith('temp-')) return
  fetch(`/api/enrich/${id}`, { method: 'POST' }).catch(() => {})
}
