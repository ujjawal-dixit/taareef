'use client'

// components/features/cards/platform-logo.tsx
// Streaming-platform logo for the poster's bottom-left scrim (locked placement).
// Inline brand SVGs — render immediately, no external files, never broken.
// Platform strings from Watchmode (metadata.streaming_platforms).

type Mark = (h: number) => string

const NETFLIX: Mark = (h) => {
  const w = h * 0.62
  return `<svg height="${h}" viewBox="0 0 56 90" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="Netflix"><path d="M8 0 v90 h12 V35 l16 55 h12 V0 H36 v50 L20 0 Z" fill="#E50914"/></svg>`
}

const PRIME: Mark = (h) => {
  const w = h * 3.1
  return `<svg height="${h}" viewBox="0 0 120 30" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="Prime Video"><text x="0" y="17" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#ffffff" letter-spacing="-0.5">prime</text><path d="M2 23 q34 9 64 0" stroke="#1FAEE9" stroke-width="3.4" fill="none" stroke-linecap="round"/></svg>`
}

const HOTSTAR: Mark = (h) => {
  const w = h * 4.0
  return `<svg height="${h}" viewBox="0 0 160 30" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="Hotstar"><defs><linearGradient id="hs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F80E0"/><stop offset="1" stop-color="#0B1F3A"/></linearGradient></defs><path d="M14 2 l3.4 7.6 8.2.8-6.2 5.5 1.8 8-7.2-4.3-7.2 4.3 1.8-8L6.4 10.4l8.2-.8Z" fill="url(#hs)" stroke="#3DA5FF" stroke-width="0.8"/><text x="32" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#ffffff">hotstar</text></svg>`
}

const JIOCINEMA: Mark = (h) => {
  const w = h * 4.4
  return `<svg height="${h}" viewBox="0 0 176 30" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="JioCinema"><text x="0" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="#ffffff">Jio</text><text x="34" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="400" fill="#E0E0E0">Cinema</text></svg>`
}

const APPLETV: Mark = (h) => {
  const w = h * 2.9
  return `<svg height="${h}" viewBox="0 0 116 30" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="Apple TV+"><path d="M16 8 c-1.5-2-4-2.2-5-2.2-2 0-3.4 1-4.4 1-1 0-2.4-1-4-1-2 0-4 1.2-5 3.2-2.2 3.8-.6 9.4 1.6 12.5 1 1.4 2.2 3 3.8 3 1.5 0 2-1 4-1s2.4 1 4 1c1.6 0 2.6-1.5 3.6-3 .8-1.2 1.2-2.3 1.6-3.6-3.5-1.3-4-6.2-.8-8.3Z M12.5 4.2 c.8-1 1.4-2.4 1.2-3.8-1.2 0-2.6.8-3.4 1.8-.7.8-1.4 2.2-1.2 3.5 1.3.1 2.6-.6 3.4-1.5Z" fill="#ffffff"/><text x="26" y="21" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#ffffff">tv</text><text x="44" y="20" font-family="Arial, sans-serif" font-size="15" font-weight="400" fill="#ffffff">+</text></svg>`
}

const DISNEY: Mark = (h) => {
  const w = h * 3.4
  return `<svg height="${h}" viewBox="0 0 136 30" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="Disney+"><text x="0" y="20" font-family="Georgia, serif" font-size="17" font-style="italic" font-weight="700" fill="#ffffff">Disney</text><text x="58" y="16" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">+</text></svg>`
}

const LIONSGATE: Mark = (h) => {
  const w = h * 4.6
  return `<svg height="${h}" viewBox="0 0 184 30" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-label="Lionsgate Play"><text x="0" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff" letter-spacing="0.5">LIONSGATE</text><text x="104" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="300" fill="#E0A93B">play</text></svg>`
}

const GENERIC: Mark = (h) => {
  const s = h
  return `<svg height="${s}" width="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Streaming"><rect x="2" y="3" width="20" height="18" rx="4" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.85"/><path d="M10 8 L16 12 L10 16 Z" fill="#ffffff" opacity="0.92"/></svg>`
}

const MARKS: Record<string, Mark> = {
  'netflix':         NETFLIX,
  'prime video':     PRIME,
  'hotstar':         HOTSTAR,
  'jiohotstar':      HOTSTAR,
  'disney+ hotstar': HOTSTAR,
  'jiocinema':       JIOCINEMA,
  'apple tv+':       APPLETV,
  'apple tv':        APPLETV,
  'disney+':         DISNEY,
  'lionsgate play':  LIONSGATE,
}

type PlatformLogoProps = {
  platform: string
  height?: number
}

export function PlatformLogo({ platform, height = 13 }: PlatformLogoProps) {
  const key  = platform.toLowerCase().trim()
  const mark = MARKS[key] ?? GENERIC

  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        height:         `${height + 9}px`,
        padding:        '0 8px',
        borderRadius:   '5px',
        background:     'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(4px)',
        boxShadow:      '0 1px 4px rgba(0,0,0,0.5)',
      }}
      dangerouslySetInnerHTML={{ __html: mark(height) }}
    />
  )
}
