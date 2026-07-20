// components/features/places/photo-picker.tsx
// The place photo picker — "when the machine isn't sure, the human
// decides — in one tap." One reusable component, three future surfaces
// (detail screen now; save flow and edit screen in Build 3).
//
// Deliberately dumb: it resolves refs to images and reports the user's
// choice via onSelect. Persistence (PATCH, live state) belongs to the
// parent, which owns the recommendation's state. Lazy by design: no
// photo API call happens until the person opens the picker.

'use client'

import { useState } from 'react'

type PlacePhotoPickerProps = {
  refs:       string[]                          // Google photo resource names from metadata
  currentUrl: string | null                     // the card's current image (highlighted)
  accentRgb:  string                            // category accent, e.g. cfg.vividRgb
  onSelect:   (url: string) => Promise<void> | void
  onUpload:   () => void                        // opens the shared hidden file input
}

export function PlacePhotoPicker({
  refs, currentUrl, accentRgb, onSelect, onUpload,
}: PlacePhotoPickerProps) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [urls,    setUrls]    = useState<(string | null)[] | null>(null)
  const [saving,  setSaving]  = useState<string | null>(null)

  async function openPicker() {
    setOpen(true)
    if (urls !== null || refs.length === 0) return   // already resolved — no repeat spend
    setLoading(true)
    try {
      const res  = await fetch('/api/places/photo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refs }),
      })
      const json = await res.json() as { urls: (string | null)[] | null }
      setUrls(json.urls ?? [])
    } catch {
      setUrls([])
    } finally {
      setLoading(false)
    }
  }

  async function pick(url: string) {
    if (saving || url === currentUrl) return
    setSaving(url)
    try { await onSelect(url) } finally { setSaving(null) }
  }

  // Collapsed: a quiet affordance, consistent with the app's link-style buttons
  if (!open) {
    return (
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <button
          onClick={openPicker}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300,
            color: 'rgba(255,255,255,0.28)', padding: '4px 8px',
            WebkitTapHighlightColor: 'transparent',
            textDecoration: 'underline', textUnderlineOffset: '3px',
            textDecorationColor: 'rgba(255,255,255,0.12)',
          }}
        >
          change photo
        </button>
      </div>
    )
  }

  const resolved = (urls ?? []).filter((u): u is string => !!u)

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: `rgba(${accentRgb},0.60)`, marginBottom: '10px',
      }}>
        Choose a photo
      </div>

      {loading && (
        <div style={{
          fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300,
          color: 'rgba(255,255,255,0.35)', padding: '8px 0',
        }}>
          Fetching photos…
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {resolved.map((url, idx) => {
            const isCurrent = url === currentUrl
            const isSaving  = saving === url
            return (
              <button
                key={idx}
                onClick={() => pick(url)}
                disabled={!!saving || isCurrent}
                style={{
                  width: '72px', height: '72px', flexShrink: 0,
                  borderRadius: '8px', overflow: 'hidden', padding: 0,
                  cursor: isCurrent ? 'default' : saving ? 'not-allowed' : 'pointer',
                  border: isCurrent
                    ? `2px solid rgba(${accentRgb},0.85)`
                    : '1px solid rgba(255,255,255,0.12)',
                  opacity: isSaving ? 0.5 : 1,
                  background: 'rgba(255,255,255,0.04)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={isCurrent ? 'Current photo' : `Photo option ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />
              </button>
            )
          })}

          {/* Upload tile — the user's own photo always wins over any API */}
          <button
            onClick={onUpload}
            disabled={!!saving}
            style={{
              width: '72px', height: '72px', flexShrink: 0,
              borderRadius: '8px',
              border: `1px dashed rgba(${accentRgb},0.35)`,
              background: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--f-body)', fontSize: '9px', fontWeight: 300,
              color: `rgba(${accentRgb},0.65)`, textAlign: 'center', lineHeight: 1.4,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            your own photo
          </button>
        </div>
      )}

      {!loading && resolved.length === 0 && (
        <div style={{
          fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300,
          color: 'rgba(255,255,255,0.35)', padding: '4px 0',
        }}>
          No photos available — you can add your own.
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px',
      }}>
        {/* Source credit for Google-hosted photos */}
        <span style={{
          fontFamily: 'var(--f-body)', fontSize: '9px', fontWeight: 300,
          color: 'rgba(255,255,255,0.22)',
        }}>
          {resolved.length > 0 ? 'Photos · Google Maps' : ''}
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300,
            color: 'rgba(255,255,255,0.28)', padding: '4px 0',
            WebkitTapHighlightColor: 'transparent',
            textDecoration: 'underline', textUnderlineOffset: '3px',
            textDecorationColor: 'rgba(255,255,255,0.14)',
          }}
        >
          done
        </button>
      </div>
    </div>
  )
}
