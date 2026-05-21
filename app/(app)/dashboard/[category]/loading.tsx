export default function CategoryLoading() {
  return (
    <div style={{ maxWidth:'430px', margin:'0 auto', minHeight:'100dvh', background:'#080f0a', paddingBottom:'80px' }}>
      <div style={{ padding:'52px 20px 0', display:'flex', alignItems:'center', gap:'5px' }}>
        <div style={{ width:'50px', height:'16px', borderRadius:'4px', background:'rgba(31,206,148,0.08)', animation:'shimmer 1.6s ease-in-out infinite' }} />
      </div>
      <div style={{ padding:'20px 14px 0', display:'flex', flexDirection:'column', gap:'8px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height:'80px', borderRadius:'14px', background:'rgba(240,230,200,0.03)', border:'1px solid rgba(240,230,200,0.06)', animation:`shimmer 1.6s ease-in-out ${i * 0.07}s infinite` }} />
        ))}
      </div>
    </div>
  )
}
