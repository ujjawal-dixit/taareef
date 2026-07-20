// app/api/places/photo/route.ts
// Resolves Google Places photo references to displayable image URLs.
// Called lazily — only when a user opens the photo picker — so photo
// API spend follows curiosity, not every save (Solution 6: cost-aware).
//
// POST { refs: string[] }  →  { urls: (string | null)[], error: null }
// urls[i] corresponds to refs[i]; unresolvable refs return null.

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'

const MONTHLY_LIMIT = 1000  // mirrors the enrich route's self-imposed ceiling
const MAX_REFS      = 6     // picker shows at most a handful — cap abuse

export async function POST(request: NextRequest) {
  try {
    // Auth — this endpoint spends billable API calls; never leave it open
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ urls: null, error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.error('[places/photo] GOOGLE_PLACES_API_KEY not configured')
      return NextResponse.json({ urls: null, error: 'Not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => null) as { refs?: unknown } | null
    const refs = Array.isArray(body?.refs)
      ? body.refs
          .filter((r): r is string => typeof r === 'string' && r.startsWith('places/'))
          .slice(0, MAX_REFS)
      : []

    if (refs.length === 0) {
      return NextResponse.json({ urls: [], error: null })
    }

    // Respect the monthly ceiling shared with enrichment
    try {
      const { data: usage } = await supabase
        .from('api_usage')
        .select('call_count')
        .eq('id', 'google_places')
        .single()
      if (usage && usage.call_count >= MONTHLY_LIMIT) {
        return NextResponse.json({ urls: null, error: 'Monthly limit reached' }, { status: 429 })
      }
    } catch { /* counter read failure is non-fatal */ }

    // Resolve all refs in parallel — each is one billable photo call
    const urls = await Promise.all(refs.map(async ref => {
      try {
        const res = await fetch(
          `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&skipHttpRedirect=true`,
          { headers: { 'X-Goog-Api-Key': apiKey } }
        )
        if (!res.ok) return null
        const data = await res.json() as { photoUri?: string }
        return data.photoUri ?? null
      } catch { return null }
    }))

    // Count what we actually spent. The RPC increments by 1 per call —
    // a small loop is fine at n ≤ 6 and keeps the RPC signature unchanged.
    const resolved = urls.filter(Boolean).length
    try {
      for (let i = 0; i < resolved; i++) {
        await supabase.rpc('increment_api_usage', { api_id: 'google_places' })
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ urls, error: null })
  } catch (error) {
    console.error('[places/photo] error:', error)
    return NextResponse.json({ urls: null, error: 'Internal error' }, { status: 500 })
  }
}
