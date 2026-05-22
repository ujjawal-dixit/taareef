import { getCategoryConfig } from '@/constants/categories'
import type { Category } from '@/lib/types'

type Props = { category?: Category; onAdd?: () => void }

export function EmptyState({ category, onAdd }: Props) {
  if (!category) return <HomeEmpty onAdd={onAdd} />
  const config = getCategoryConfig(category)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'52px 24px', minHeight:'calc(100dvh - 400px)', justifyContent:'center' }}>
      <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:`radial-gradient(circle at 44% 36%, ${config.colourHex}22 0%, ${config.colourHex}05 100%)`, border:`1px solid ${config.colourHex}28`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px', boxShadow:`0 0 40px ${config.colourHex}10` }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={config.colourHex} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.80 }}>
          <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20M12 3l4 6M12 3l-4 6"/>
        </svg>
      </div>
      <h2 style={{ fontFamily:'var(--f-display)', fontWeight:400, fontStyle:'italic', fontSize:'24px', letterSpacing:'-0.01em', color:'rgba(240,230,200,0.95)', lineHeight:1.2, marginBottom:'10px' }}>{config.emptyState.headline}</h2>
      <p style={{ fontFamily:'var(--f-body)', fontSize:'13px', fontWeight:300, color:'rgba(240,230,200,0.50)', lineHeight:1.70, maxWidth:'220px', marginBottom:'32px' }}>{config.emptyState.body}</p>
      {onAdd && (
        <button onClick={onAdd} style={{ background:config.colourHex, color:'#080f0a', fontFamily:'var(--f-ui)', fontSize:'13px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', padding:'0 24px', height:'48px', borderRadius:'10px', border:'none', cursor:'pointer', boxShadow:`0 4px 20px ${config.colourHex}42`, WebkitTapHighlightColor:'transparent', display:'flex', alignItems:'center' }}>
          {config.emptyState.cta}
        </button>
      )}
    </div>
  )
}

function HomeEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'52px 24px', minHeight:'calc(100dvh - 400px)', justifyContent:'center' }}>
      <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'radial-gradient(circle at 44% 36%, rgba(31,206,148,0.18) 0%, rgba(31,206,148,0.03) 100%)', border:'1px solid rgba(31,206,148,0.20)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px', boxShadow:'0 0 40px rgba(31,206,148,0.08)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1fce94" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.80 }}>
          <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20M12 3l4 6M12 3l-4 6"/>
        </svg>
      </div>
      <h2 style={{ fontFamily:'var(--f-display)', fontWeight:400, fontStyle:'italic', fontSize:'24px', letterSpacing:'-0.01em', color:'rgba(240,230,200,0.95)', lineHeight:1.2, marginBottom:'10px' }}>Your vault is waiting</h2>
      <p style={{ fontFamily:'var(--f-body)', fontSize:'13px', fontWeight:300, color:'rgba(240,230,200,0.50)', lineHeight:1.75, maxWidth:'210px', marginBottom:'32px' }}>Every recommendation someone gives you — restaurants, films, music, books — one place, with who told you, always.</p>
      {onAdd && (
        <button onClick={onAdd} aria-label="Save your first recommendation" style={{ display:'flex', alignItems:'center', gap:'14px', background:'none', border:'none', cursor:'pointer', padding:'10px 0', WebkitTapHighlightColor:'transparent' }}>
          <div style={{ height:'0.5px', width:'32px', background:'#1fce94', opacity:0.38 }} />
          <span style={{ fontFamily:'var(--f-body)', fontSize:'11px', fontWeight:600, letterSpacing:'0.13em', textTransform:'uppercase', color:'#1fce94' }}>Save your first one</span>
          <div style={{ height:'0.5px', width:'32px', background:'#1fce94', opacity:0.38 }} />
        </button>
      )}
    </div>
  )
}
