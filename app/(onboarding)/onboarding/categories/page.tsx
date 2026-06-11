'use client'

// app/(onboarding)/onboarding/categories/page.tsx
// Screen 3 — category preference question.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CAT_LIST = [
  { id: 'watch',  label: 'Watch',      vividHex: '#3C82FF', vividRgb: '60,130,255'  },
  { id: 'listen', label: 'Listen',     vividHex: '#DC3C82', vividRgb: '220,60,130'  },
  { id: 'read',   label: 'Read',       vividHex: '#F09114', vividRgb: '240,145,20'  },
  { id: 'dine',   label: 'Dine',       vividHex: '#DA5526', vividRgb: '218,85,38'   },
  { id: 'do',     label: 'Experience', vividHex: '#10C3B6', vividRgb: '16,195,182'  },
  { id: 'visit',  label: 'Visit',      vividHex: '#1991E1', vividRgb: '25,145,225'  },
]

export default function CategoriesPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    if (id === 'all') {
      setSelected(selected.length === CAT_LIST.length ? [] : CAT_LIST.map((c) => c.id))
      return
    }
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  async function handleContinue() {
    if (selected.length === 0) {
      setError(true)
      setTimeout(() => setError(false), 2000)
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, default_categories: selected }, { onConflict: 'user_id' })

      router.push('/dashboard')
    } catch {
      setSaving(false)
    }
  }

  const allSelected = selected.length === CAT_LIST.length

  return (
    <main style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 390, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 72, paddingBottom: 120 }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: '#F4F3EE', lineHeight: 1.15, margin: '0 0 10px', textAlign: 'center' }}>
          What do people<br />recommend to you most?
        </h1>
        <p style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'rgba(244,243,238,0.38)', textAlign: 'center', margin: '0 0 40px' }}>
          Pick all that feel right
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CAT_LIST.map((cat) => {
            const isSelected = selected.includes(cat.id)
            return (
              <button key={cat.id} onClick={() => toggle(cat.id)} style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: isSelected ? `1px solid ${cat.vividHex}` : '0.5px solid rgba(255,255,255,0.10)', background: isSelected ? `rgba(${cat.vividRgb},0.12)` : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', color: isSelected ? cat.vividHex : 'rgba(244,243,238,0.55)', transition: 'color 0.15s ease' }}>
                  {cat.label}
                </span>
                {isSelected && (
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: cat.vividHex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </button>
            )
          })}

          <button onClick={() => toggle('all')} style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: allSelected ? '1px solid rgba(244,243,238,0.30)' : '0.5px solid rgba(255,255,255,0.08)', background: allSelected ? 'rgba(244,243,238,0.06)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' }}>
            <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', color: allSelected ? 'rgba(244,243,238,0.75)' : 'rgba(244,243,238,0.30)' }}>Everything</span>
            {allSelected && (
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(244,243,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            )}
          </button>
        </div>

        {error && <p style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'rgba(218,85,38,0.80)', textAlign: 'center', marginTop: 16 }}>Pick at least one to get started</p>}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', background: 'linear-gradient(to top, #0a0a0a 60%, transparent)' }}>
        <div style={{ maxWidth: 390, margin: '0 auto' }}>
          <button onClick={handleContinue} disabled={saving} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: selected.length > 0 ? '#1fce94' : 'rgba(255,255,255,0.08)', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 18, color: selected.length > 0 ? '#0a0a0a' : 'rgba(244,243,238,0.20)', cursor: selected.length > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease', letterSpacing: '-0.01em' }}>
            {saving ? 'One moment...' : "That's my life →"}
          </button>
        </div>
      </div>
    </main>
  )
}
