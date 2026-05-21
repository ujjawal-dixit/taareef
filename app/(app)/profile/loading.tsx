// app/(app)/profile/loading.tsx
// Instant skeleton — shown while parallel queries run.
// Profile latency was 800ms-2s. This makes navigation feel immediate.

export default function ProfileLoading() {
  return (
    <div style={{ maxWidth:'430px', margin:'0 auto', minHeight:'100dvh', background:'#080f0a' }}>
      <div style={{ padding:'52px 20px 0' }}>
        <div style={{ width:'48px', height:'14px', borderRadius:'4px', background:'rgba(31,206,148,0.08)', animation:'shimmer 1.6s ease-in-out infinite' }} />
      </div>
      <div style={{ padding:'20px 20px 0', textAlign:'center' }}>
        <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:'rgba(240,230,200,0.05)', margin:'0 auto 14px', animation:'shimmer 1.6s ease-in-out infinite' }} />
        <div style={{ width:'140px', height:'24px', borderRadius:'6px', background:'rgba(240,230,200,0.05)', margin:'0 auto 8px', animation:'shimmer 1.6s ease-in-out infinite' }} />
        <div style={{ width:'180px', height:'12px', borderRadius:'4px', background:'rgba(240,230,200,0.03)', margin:'0 auto', animation:'shimmer 1.6s ease-in-out infinite' }} />
        <div style={{ height:'0.5px', margin:'18px auto', maxWidth:'80px', background:'rgba(240,230,200,0.06)' }} />
      </div>
      <div style={{ padding:'0 20px 20px', display:'flex', gap:'10px' }}>
        {[0,1].map(i => (
          <div key={i} style={{ flex:1, height:'80px', borderRadius:'14px', background:'rgba(240,230,200,0.03)', border:'1px solid rgba(240,230,200,0.06)', animation:`shimmer 1.6s ease-in-out ${i * 0.1}s infinite` }} />
        ))}
      </div>
    </div>
  )
}
