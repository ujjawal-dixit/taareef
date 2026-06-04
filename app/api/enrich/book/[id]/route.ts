// app/api/enrich/book/route.ts
// Google Books enrichment for Read category.
// No API key required under 10K requests/day.
// GOOGLE_BOOKS_API_KEY in Vercel extends this to 100K/day if needed.
//
// Strategy:
// - Search by title (+ author hint from metadata if available)
// - If single high-confidence result → confirm automatically, set cover directly
// - If multiple plausible results → store top 3 as candidates for user to confirm
// - If no cover exists → store metadata only (author, year, pages, genre)
//   Criterion mode handles the visual fallback gracefully
//
// Called from use-recommendations.ts after successful Read save.
// Also called retroactively from rec-detail when card has no image.

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

type Params = { params: Promise<{ id: string }> }

type BookCandidate = {
  google_id:    string
  title:        string
  authors:      string[]
  author:       string          // primary author display string
  cover_url:    string | null
  published_year: number | null
  pages:        number | null
  genre:        string | null   // first category Google Books returns
  description:  string | null
  language:     string | null
}

// Confidence threshold — if the top result's title matches closely, auto-confirm
function titleMatchScore(query: string, result: string): number {
  const norm   = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const q = norm(query)
  const r = norm(result)
  if (q === r) return 1.0
  if (r.startsWith(q) || q.startsWith(r)) return 0.90
  // Word overlap
  const qWords = new Set(q.split(/\s+/))
  const rWords = r.split(/\s+/)
  const overlap = rWords.filter(w => qWords.has(w)).length
  return overlap / Math.max(qWords.size, rWords.length)
}

function extractCandidate(item: Record<string, unknown>): BookCandidate {
  const vol     = (item.volumeInfo as Record<string, unknown>) ?? {}
  const imgLinks= (vol.imageLinks as Record<string, string>) ?? {}

  // Prefer higher resolution cover — zoom=1 gives ~128px, zoom=2 gives ~300px
  const rawCover = imgLinks.thumbnail ?? imgLinks.smallThumbnail ?? null
  // Force HTTPS and bump resolution
  const cover_url = rawCover
    ? rawCover.replace('http://', 'https://').replace('&zoom=1', '&zoom=2')
    : null

  const authors        = (vol.authors as string[]) ?? []
  const publishedDate  = typeof vol.publishedDate === 'string' ? vol.publishedDate : null
  const published_year = publishedDate ? parseInt(publishedDate.slice(0, 4)) : null
  const categories     = (vol.categories as string[]) ?? []
  // Google Books categories are often compound e.g. "Fiction / Literary" — take first segment
  const genre          = categories[0]?.split('/')?.[0]?.trim() ?? null

  return {
    google_id:      (item.id as string) ?? '',
    title:          (vol.title as string) ?? '',
    authors,
    author:         authors.slice(0, 2).join(', ') || 'Unknown',
    cover_url,
    published_year,
    pages:          typeof vol.pageCount === 'number' ? vol.pageCount : null,
    genre,
    description:    typeof vol.description === 'string'
      ? vol.description.slice(0, 500)   // truncate — we store summaries not full text
      : null,
    language:       typeof vol.language === 'string' ? vol.language : null,
  }
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 })

    const { data: rec } = await supabase
      .from('recommendations')
      .select('id, title, category, metadata, image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!rec) return NextResponse.json({ data: { enriched: false, reason: 'not_found' }, error: null })
    if (rec.category !== 'read') return NextResponse.json({ data: { enriched: false, reason: 'wrong_category' }, error: null })
    if (rec.image_url) return NextResponse.json({ data: { enriched: false, reason: 'already_has_image' }, error: null })

    const existingMeta = (rec.metadata as Record<string, unknown>) ?? {}

    // Build search query — include author hint if we have it
    const authorHint   = typeof existingMeta.author === 'string' ? existingMeta.author : null
    const searchQuery  = authorHint
      ? `${rec.title} ${authorHint}`
      : rec.title
    const apiKey       = process.env.GOOGLE_BOOKS_API_KEY
    const keyParam     = apiKey ? `&key=${apiKey}` : ''

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5&orderBy=relevance&langRestrict=en${keyParam}`

    console.log(`[BookEnrich] Searching Google Books for: "${searchQuery}"`)

    const res  = await fetch(url)
    const data = await res.json()

    if (!res.ok || !data.items?.length) {
      console.log(`[BookEnrich] No results for: "${rec.title}"`)
      await supabase.from('recommendations')
        .update({ metadata: { ...existingMeta, books_no_results: true } })
        .eq('id', id).eq('user_id', user.id)
      return NextResponse.json({ data: { enriched: false, reason: 'no_results' }, error: null })
    }

    const candidates = (data.items as Record<string, unknown>[])
      .slice(0, 3)
      .map(extractCandidate)

    const top        = candidates[0]
    const topScore   = titleMatchScore(rec.title, top.title)
    const autoConfirm = topScore >= 0.88 && candidates.length === 1

    console.log(`[BookEnrich] Top result: "${top.title}" score=${topScore.toFixed(2)} auto=${autoConfirm}`)

    if (autoConfirm) {
      // High confidence single match — set cover and metadata directly
      // No candidate strip needed
      await supabase.from('recommendations')
        .update({
          image_url: top.cover_url ?? null,
          metadata:  {
            ...existingMeta,
            google_books_id:  top.google_id,
            author:           top.author,
            published_year:   top.published_year,
            pages:            top.pages,
            genre:            top.genre,
            description:      top.description,
            language:         top.language,
            books_candidates: null,
          },
        })
        .eq('id', id).eq('user_id', user.id)

      return NextResponse.json({
        data: {
          enriched:      true,
          auto_confirmed:true,
          cover_url:     top.cover_url,
          author:        top.author,
        },
        error: null,
      })
    }

    // Multiple candidates or lower confidence — store for user confirmation
    await supabase.from('recommendations')
      .update({ metadata: { ...existingMeta, books_candidates: candidates } })
      .eq('id', id).eq('user_id', user.id)

    return NextResponse.json({
      data: { enriched: true, candidates, awaiting_confirmation: true },
      error: null,
    })

  } catch (err) {
    console.error('[BookEnrich] Unexpected:', err)
    return NextResponse.json({ data: { enriched: false }, error: null })
  }
}

// ── CONFIRM CANDIDATE ─────────────────────────────────────────────
// Called when user taps a book cover option in the card detail.

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 })

    const body = await request.json() as BookCandidate

    const { data: rec } = await supabase
      .from('recommendations')
      .select('metadata')
      .eq('id', id).eq('user_id', user.id)
      .single()

    if (!rec) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const existingMeta = (rec.metadata as Record<string, unknown>) ?? {}

    await supabase.from('recommendations')
      .update({
        image_url: body.cover_url ?? null,
        metadata:  {
          ...existingMeta,
          google_books_id:  body.google_id,
          author:           body.author,
          published_year:   body.published_year,
          pages:            body.pages,
          genre:            body.genre,
          description:      body.description,
          language:         body.language,
          books_candidates: null,
        },
      })
      .eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ data: { confirmed: true, cover_url: body.cover_url }, error: null })

  } catch (err) {
    console.error('[BookEnrich PATCH]', err)
    return NextResponse.json({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}
