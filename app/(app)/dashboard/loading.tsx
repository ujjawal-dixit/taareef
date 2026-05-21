// app/(app)/dashboard/loading.tsx
// Instant skeleton shown while dashboard fetches.
// Makes navigation feel immediate — no blank screen.

export default function DashboardLoading() {
  return (
    <div style={{
      maxWidth:   '430px', margin: '0 auto',
      minHeight:  '100dvh', background: '#080f0a',
      paddingBottom: '80px',
    }}>
      {/* Wordmark skeleton */}
      <div style={{ padding: '56px 20px 0', textAlign: 'center' }}>
        <div style={{
          width: '120px', height: '44px', borderRadius: '8px',
          background: 'rgba(31,206,148,0.08)',
          margin: '0 auto 8px',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }} />
        <div style={{
          width: '60px', height: '12px', borderRadius: '4px',
          background: 'rgba(240,230,200,0.05)',
          margin: '0 auto',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }} />
        <div style={{
          height: '0.5px', margin: '16px auto 0', maxWidth: '160px',
          background: 'rgba(31,206,148,0.12)',
        }} />
      </div>

      {/* Tile grid skeleton — 2×4 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', padding: '24px 14px 0',
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            height: '140px', borderRadius: '16px',
            background: 'rgba(240,230,200,0.03)',
            border: '1px solid rgba(240,230,200,0.06)',
            animation: `shimmer 1.6s ease-in-out ${i * 0.08}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}
