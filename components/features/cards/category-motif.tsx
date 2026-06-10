'use client'

// components/features/cards/category-motif.tsx
// Session 10 — the folk-art motif system.
//
// Each CATEGORY carries one authentic Indian folk tradition; each SUBCATEGORY
// is a distinct composition within that tradition — siblings, not twins.
// The motif is the category's soul as ornament (a centered medallion), never a
// literal icon. The subcategory is named in the card text, not spelled out by
// the art. Fluorescent-line-on-dark, drawn in the category's vividRgb.
//
//   watch  → Warli       (film · series · documentary)
//   listen → Gond        (album · podcast · audiobook · artist)
//   read   → Madhubani   (fiction · non-fiction · poetry)
//   dine   → block-print (restaurant · café · bar · street food)
//   do     → Saora       (hike · trail · adventure · workshop · live show)
//   visit  → Kalamkari   (museum · gallery · heritage · viewpoint · market)
//
// Every medallion is built procedurally into a single SVG string and rendered
// via dangerouslySetInnerHTML — keeps the file readable and the geometry exact.

import type { Category } from '@/lib/types'

// ── color helpers ─────────────────────────────────────────────────
// All builders receive a pre-resolved palette derived from the category rgb.
type Palette = {
  c:     string // 0.90 — primary line
  soft:  string // 0.60 — secondary line
  faint: string // 0.32 — borders, ticks
  fill:  string // 0.08 — interior wash
}

function paletteFromRgb(rgb: string): Palette {
  return {
    c:     `rgba(${rgb},0.90)`,
    soft:  `rgba(${rgb},0.60)`,
    faint: `rgba(${rgb},0.32)`,
    fill:  `rgba(${rgb},0.08)`,
  }
}

function rgba(rgb: string, a: number): string {
  return `rgba(${rgb},${a})`
}

// ── shared geometry primitives ────────────────────────────────────

function sawRing(rgb: string, r1: number, r2: number, n: number, w = 1): string {
  let s = ''
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * 2 * Math.PI
    const am = ((i + 0.5) / n) * 2 * Math.PI
    const a3 = ((i + 1) / n) * 2 * Math.PI
    s += `<path d="M${Math.cos(a1) * r1} ${Math.sin(a1) * r1} L${Math.cos(am) * r2} ${Math.sin(am) * r2} L${Math.cos(a3) * r1} ${Math.sin(a3) * r1}" stroke="${rgba(rgb, 0.5)}" stroke-width="${w}" fill="none"/>`
  }
  return s
}

function dotRing(rgb: string, r: number, n: number, rad: number, op: number): string {
  let s = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI
    s += `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="${rad}" fill="${rgba(rgb, op)}"/>`
  }
  return s
}

function dashRing(rgb: string, r: number, n: number, len: number, w: number, op: number): string {
  let s = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI
    const x1 = Math.cos(a) * (r - len / 2), y1 = Math.sin(a) * (r - len / 2)
    const x2 = Math.cos(a) * (r + len / 2), y2 = Math.sin(a) * (r + len / 2)
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${rgba(rgb, op)}" stroke-width="${w}" stroke-linecap="round"/>`
  }
  return s
}

function rays(rgb: string, r1: number, r2: number, n: number, op = 0.6): string {
  let s = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI
    s += `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}" stroke="${rgba(rgb, op)}" stroke-width="1" stroke-linecap="round"/>`
  }
  return s
}

// Warli stick figure: head + spine + arms + legs, two-triangle body implied.
function warliFig(rgb: string, scale = 1): string {
  const s = scale
  return `<circle cy="${-6 * s}" r="${2.3 * s}" fill="${rgba(rgb, 0.9)}" stroke="none"/>`
    + `<path d="M0 ${-4 * s} L0 ${6 * s}" stroke="${rgba(rgb, 0.85)}" stroke-width="${1.3 * s}" stroke-linecap="round"/>`
    + `<path d="M0 ${-4 * s} L${-5 * s} ${9 * s} M0 ${-4 * s} L${5 * s} ${9 * s}" stroke="${rgba(rgb, 0.85)}" stroke-width="${1.2 * s}" stroke-linecap="round" fill="none"/>`
    + `<path d="M${-5 * s} ${1 * s} L${5 * s} ${1 * s}" stroke="${rgba(rgb, 0.85)}" stroke-width="${1.2 * s}" stroke-linecap="round"/>`
}

// Saora figure: elongated, gender-neutral, thin limbs.
function saoraFig(rgb: string, scale = 1): string {
  const s = scale
  return `<circle cy="${-10 * s}" r="${2.4 * s}" fill="${rgba(rgb, 0.9)}" stroke="none"/>`
    + `<path d="M0 ${-8 * s} L0 ${8 * s}" stroke="${rgba(rgb, 0.85)}" stroke-width="${1.3 * s}" stroke-linecap="round"/>`
    + `<path d="M0 ${-4 * s} L${-5 * s} ${1 * s} M0 ${-4 * s} L${5 * s} ${1 * s}" stroke="${rgba(rgb, 0.85)}" stroke-width="${1.2 * s}" stroke-linecap="round" fill="none"/>`
    + `<path d="M0 ${8 * s} L${-5 * s} ${16 * s} M0 ${8 * s} L${5 * s} ${16 * s}" stroke="${rgba(rgb, 0.85)}" stroke-width="${1.2 * s}" stroke-linecap="round" fill="none"/>`
}

// Madhubani double-line + cross-tick border ring.
function madhuBorder(rgb: string, r1: number, r2: number): string {
  let s = `<circle r="${r1}" stroke="${rgba(rgb, 0.55)}" stroke-width="1.2" fill="none"/>`
    + `<circle r="${r2}" stroke="${rgba(rgb, 0.55)}" stroke-width="1.2" fill="none"/>`
  const n = 48
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI
    s += `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}" stroke="${rgba(rgb, 0.4)}" stroke-width="0.7"/>`
  }
  return s
}

// Block-print scalloped frame with jhaalar dots.
function blockFrame(rgb: string): string {
  let s = `<circle r="82" stroke="${rgba(rgb, 0.35)}" stroke-width="1" fill="none"/>`
    + `<circle r="78" stroke="${rgba(rgb, 0.5)}" stroke-width="1.1" fill="none"/>`
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * 2 * Math.PI
    s += `<circle cx="${Math.cos(a) * 80}" cy="${Math.sin(a) * 80}" r="0.9" fill="${rgba(rgb, 0.5)}"/>`
  }
  return s
}

// Saora fishnet border — drawn ring, then hatch closing inward.
function netBorder(rgb: string, r: number): string {
  let s = `<circle r="${r}" stroke="${rgba(rgb, 0.5)}" stroke-width="1.2" fill="none"/>`
    + `<circle r="${r - 4}" stroke="${rgba(rgb, 0.3)}" stroke-width="0.7" fill="none"/>`
  const n = 44
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI
    s += `<line x1="${Math.cos(a) * (r - 4)}" y1="${Math.sin(a) * (r - 4)}" x2="${Math.cos(a) * r}" y2="${Math.sin(a) * r}" stroke="${rgba(rgb, 0.35)}" stroke-width="0.6"/>`
  }
  return s
}

// Kalamkari floral-arabesque border ring.
function kalBorder(rgb: string, r: number): string {
  let s = `<circle r="${r}" stroke="${rgba(rgb, 0.5)}" stroke-width="1.2" fill="none"/>`
    + `<circle r="${r - 5}" stroke="${rgba(rgb, 0.28)}" stroke-width="0.7" fill="none"/>`
  const n = 24
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360
    s += `<g transform="rotate(${a})"><path d="M0 ${-r} q3 ${-(r * 0.04)} 0 ${-(r * 0.07)}" stroke="${rgba(rgb, 0.4)}" stroke-width="0.7" fill="none"/><circle cy="${-r - 2}" r="0.9" fill="${rgba(rgb, 0.5)}"/></g>`
  }
  return s
}

// ── WATCH · WARLI ─────────────────────────────────────────────────

function warliFilm(rgb: string, p: Palette): string {
  let s = sawRing(rgb, 76, 84, 28)
  s += `<circle r="62" stroke="${rgba(rgb, 0.5)}" stroke-width="1"/>`
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360
    s += `<g transform="rotate(${a}) translate(0,-62)">${warliFig(rgb, 1)}</g>`
  }
  // center: lone figure + projection beam
  s += `<g transform="translate(0,0)"><path d="M0 -4 L-26 -30 L26 -30 Z" fill="${p.fill}" stroke="${rgba(rgb, 0.4)}" stroke-width="0.8"/>${warliFig(rgb, 1.3)}</g>`
  return s
}

function warliSeries(rgb: string, p: Palette): string {
  let s = sawRing(rgb, 76, 84, 28)
  s += `<circle r="62" stroke="${rgba(rgb, 0.5)}" stroke-width="1"/>`
  s += `<circle r="40" stroke="${rgba(rgb, 0.32)}" stroke-width="1"/>`
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360
    s += `<g transform="rotate(${a}) translate(0,-62)">${warliFig(rgb, 1)}</g>`
  }
  // center: three stacked figures = chapters returning
  s += `<g transform="translate(-13,0)">${warliFig(rgb, 0.9)}</g>`
  s += `<g transform="translate(0,-3)">${warliFig(rgb, 0.9)}</g>`
  s += `<g transform="translate(13,0)">${warliFig(rgb, 0.9)}</g>`
  return s
}

function warliDoc(rgb: string, p: Palette): string {
  let s = sawRing(rgb, 76, 84, 28)
  s += `<circle r="62" stroke="${rgba(rgb, 0.5)}" stroke-width="1"/>`
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360
    s += `<g transform="rotate(${a}) translate(0,-62)">${warliFig(rgb, 1)}</g>`
  }
  // center: the Warli sun = the witness
  s += `<circle r="17" stroke="${p.c}" stroke-width="1.6" fill="none"/>`
  s += `<circle r="7" fill="${p.c}"/>`
  s += rays(rgb, 19, 26, 16)
  return s
}

// ── LISTEN · GOND ─────────────────────────────────────────────────

function gondAlbum(rgb: string, p: Palette): string {
  let s = ''
  ;[82, 76, 70, 58, 52, 40, 34].forEach((r) => { s += `<circle r="${r}" stroke="${rgba(rgb, 0.4)}" stroke-width="1" fill="none"/>` })
  s += dashRing(rgb, 73, 52, 7, 1.4, 0.6) + dashRing(rgb, 55, 44, 7, 1.3, 0.55) + dashRing(rgb, 37, 32, 6, 1.2, 0.5)
  s += dotRing(rgb, 64, 40, 1.5, 0.7) + dotRing(rgb, 46, 30, 1.4, 0.65) + dotRing(rgb, 26, 18, 1.3, 0.6)
  s += `<circle r="18" stroke="${rgba(rgb, 0.85)}" stroke-width="1.4" fill="none"/>`
  for (let i = 0; i < 10; i++) {
    const a = i * 36
    s += `<g transform="rotate(${a})"><path d="M0 -7 q3 -4 0 -12 q-3 8 0 12" fill="${rgba(rgb, 0.55)}"/></g>`
  }
  s += `<circle r="4.5" fill="${rgba(rgb, 0.95)}"/>`
  return s
}

function gondPodcast(rgb: string, p: Palette): string {
  let s = ''
  ;[30, 40, 50, 60, 70, 80].forEach((r, k) => {
    const n = Math.round(r * 0.9)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI
      s += `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="1.5" fill="${rgba(rgb, 0.6 - k * 0.06)}"/>`
    }
  })
  ;[35, 45, 55, 65, 75].forEach((r, k) => {
    const n = Math.round(r * 0.8)
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * 2 * Math.PI
      s += `<line x1="${Math.cos(a) * (r - 2)}" y1="${Math.sin(a) * (r - 2)}" x2="${Math.cos(a) * (r + 2)}" y2="${Math.sin(a) * (r + 2)}" stroke="${rgba(rgb, 0.4 - k * 0.05)}" stroke-width="1" stroke-linecap="round"/>`
    }
  })
  s += `<circle r="22" stroke="${rgba(rgb, 0.8)}" stroke-width="1.3" fill="none"/>`
  for (let i = 0; i < 14; i++) {
    const a = i * (360 / 14)
    s += `<g transform="rotate(${a})"><line x1="0" y1="-10" x2="0" y2="-18" stroke="${rgba(rgb, 0.55)}" stroke-width="1.3" stroke-linecap="round"/><circle cy="-20" r="1.3" fill="${rgba(rgb, 0.6)}"/></g>`
  }
  s += `<circle r="5" fill="${rgba(rgb, 0.95)}"/>`
  return s
}

function gondAudiobook(rgb: string, p: Palette): string {
  let s = ''
  ;[0, 180].forEach((off) => {
    let path = 'M 0 0'
    for (let t = 0; t <= 720; t += 6) {
      const a = (t + off) * Math.PI / 180
      const r = t / 720 * 78
      path += ` L ${Math.cos(a) * r} ${Math.sin(a) * r}`
    }
    s += `<path d="${path}" stroke="${rgba(rgb, 0.5)}" stroke-width="1.3" fill="none"/>`
  })
  ;[0, 180].forEach((off) => {
    for (let t = 30; t <= 720; t += 26) {
      const a = (t + off) * Math.PI / 180
      const r = t / 720 * 78
      s += `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="1.7" fill="${rgba(rgb, 0.7)}"/>`
    }
  })
  for (let i = 0; i < 16; i++) {
    const a = i * 22.5
    s += `<g transform="rotate(${a})"><path d="M0 -82 q2.5 -4 0 -9 q-2.5 5 0 9" fill="${rgba(rgb, 0.4)}"/></g>`
  }
  s += `<circle r="5" fill="${rgba(rgb, 0.95)}"/>`
  return s
}

function gondArtist(rgb: string, p: Palette): string {
  let s = ''
  const n = 40, r1 = 80, r2 = 86
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * 2 * Math.PI, am = ((i + 0.5) / n) * 2 * Math.PI, a3 = ((i + 1) / n) * 2 * Math.PI
    s += `<path d="M${Math.cos(a1) * r1} ${Math.sin(a1) * r1} L${Math.cos(am) * r2} ${Math.sin(am) * r2} L${Math.cos(a3) * r1} ${Math.sin(a3) * r1}" stroke="${rgba(rgb, 0.4)}" stroke-width="0.9" fill="none"/>`
  }
  s += `<circle r="72" stroke="${rgba(rgb, 0.3)}" stroke-width="1"/>`
  s += dotRing(rgb, 72, 40, 1.4, 0.45) + dashRing(rgb, 66, 40, 5, 0.9, 0.4)
  // songbird
  s += `<g stroke="${rgba(rgb, 0.92)}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="M-4 22 q-18 -10 -12 -32 q4 -16 20 -16 q15 0 15 13 q0 11 -9 17 q11 4 11 18 q0 13 -15 13 q-13 0 -15 -11 Z" fill="${rgba(rgb, 0.10)}"/>`
    + `<path d="M16 -18 q11 -11 7 -24 q-1 -5 -7 -7"/>`
    + `<circle cx="15" cy="-50" r="4.4" fill="${rgba(rgb, 0.92)}" stroke="none"/>`
    + `<path d="M15 -54 l0 -7 M11 -53 l-3 -6 M19 -53 l3 -6" stroke-width="1.1"/>`
    + `<path d="M19 -50 l8 -2"/>`
    + `</g>`
  // beaded tail plumes
  s += `<g stroke="${rgba(rgb, 0.55)}" stroke-width="1.2" stroke-linecap="round">`
  for (let i = 0; i < 11; i++) {
    const a = (104 + i * 7) * Math.PI / 180
    s += `<line x1="${Math.cos(a) * 18}" y1="${Math.sin(a) * 18 + 8}" x2="${Math.cos(a) * 58}" y2="${Math.sin(a) * 58 + 8}"/>`
    for (let k = 1; k <= 4; k++) {
      const rr = 18 + k * 10
      s += `<circle cx="${Math.cos(a) * rr}" cy="${Math.sin(a) * rr + 8}" r="1.3" fill="${rgba(rgb, 0.6)}"/>`
    }
    s += `<circle cx="${Math.cos(a) * 62}" cy="${Math.sin(a) * 62 + 8}" r="2.4" stroke="${rgba(rgb, 0.6)}" stroke-width="0.8" fill="${rgba(rgb, 0.12)}"/>`
  }
  s += `</g>`
  // fish-scale body infill
  s += `<g stroke="${rgba(rgb, 0.5)}" stroke-width="0.8" fill="none">`
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const x = -14 + col * 7, y = -8 + row * 6
      s += `<path d="M${x} ${y} q3.5 4 7 0"/>`
    }
  }
  s += `</g>`
  return s
}

// ── READ · MADHUBANI ──────────────────────────────────────────────

function madhuFiction(rgb: string, p: Palette): string {
  let s = madhuBorder(rgb, 86, 80)
  s += `<circle r="74" stroke="${rgba(rgb, 0.3)}" stroke-width="1"/>`
  for (let i = 0; i < 16; i++) {
    const a = i * (360 / 16)
    s += `<g transform="rotate(${a})"><path d="M0 -30 Q9 -52 0 -72 Q-9 -52 0 -30" stroke="${rgba(rgb, 0.7)}" stroke-width="1.2" fill="none"/><path d="M0 -36 Q5 -52 0 -66 Q-5 -52 0 -36" stroke="${rgba(rgb, 0.4)}" stroke-width="0.7" fill="none"/></g>`
  }
  for (let i = 0; i < 12; i++) {
    const a = i * 30 + 15
    s += `<g transform="rotate(${a})"><path d="M0 -16 Q6 -30 0 -42 Q-6 -30 0 -16" stroke="${rgba(rgb, 0.85)}" stroke-width="1.2" fill="${rgba(rgb, 0.10)}"/></g>`
  }
  s += `<circle r="15" stroke="${rgba(rgb, 0.75)}" stroke-width="1.2" fill="none"/>`
  s += `<circle r="11" stroke="${rgba(rgb, 0.5)}" stroke-width="0.8" fill="none"/>`
  for (let i = 0; i < 8; i++) {
    const a = i * 45 * Math.PI / 180
    s += `<circle cx="${Math.cos(a) * 8}" cy="${Math.sin(a) * 8}" r="1.4" fill="${rgba(rgb, 0.7)}"/>`
  }
  s += `<circle r="3.5" fill="${rgba(rgb, 0.9)}"/>`
  return s
}

function madhuNonFiction(rgb: string, p: Palette): string {
  let s = madhuBorder(rgb, 86, 80)
  s += `<rect x="-66" y="-66" width="132" height="132" stroke="${rgba(rgb, 0.32)}" stroke-width="1" fill="none"/>`
  s += `<rect x="-60" y="-60" width="120" height="120" stroke="${rgba(rgb, 0.5)}" stroke-width="1.3" fill="none"/>`
  s += `<rect x="-55" y="-55" width="110" height="110" stroke="${rgba(rgb, 0.3)}" stroke-width="0.7" fill="none"/>`
  const fish = (tx: number, ty: number, rot: number) =>
    `<g transform="translate(${tx},${ty}) rotate(${rot})">`
    + `<path d="M-26 0 Q0 -18 30 0 Q0 18 -26 0 Z" stroke="${rgba(rgb, 0.85)}" stroke-width="1.4" fill="${rgba(rgb, 0.06)}"/>`
    + `<path d="M-22 0 Q0 -13 24 0 Q0 13 -22 0 Z" stroke="${rgba(rgb, 0.4)}" stroke-width="0.7" fill="none"/>`
    + `<path d="M-26 0 L-40 -10 L-34 0 L-40 10 Z" stroke="${rgba(rgb, 0.8)}" stroke-width="1.2" fill="${rgba(rgb, 0.06)}"/>`
    + `<circle cx="20" cy="0" r="2.4" fill="${rgba(rgb, 0.9)}"/>`
    + `<g stroke="${rgba(rgb, 0.45)}" stroke-width="0.6"><path d="M-14 -6 q8 6 0 12 M-4 -8 q8 8 0 16 M6 -7 q7 7 0 14"/></g>`
    + `</g>`
  s += fish(0, -26, 8) + fish(0, 26, 188)
  ;[[-50, -50], [50, -50], [50, 50], [-50, 50]].forEach(([x, y]) => {
    s += `<g transform="translate(${x},${y})"><path d="M0 -7 Q4 0 0 7 Q-4 0 0 -7" stroke="${rgba(rgb, 0.6)}" stroke-width="0.9" fill="none"/></g>`
  })
  return s
}

function madhuPoetry(rgb: string, p: Palette): string {
  let s = madhuBorder(rgb, 86, 80)
  s += `<circle r="74" stroke="${rgba(rgb, 0.3)}" stroke-width="1"/>`
  for (let i = 0; i < 24; i++) {
    const a = i * 15
    s += `<g transform="rotate(${a})"><path d="M0 -68 q4 -4 0 -8" stroke="${rgba(rgb, 0.4)}" stroke-width="0.8" fill="none"/><circle cy="-64" r="1.2" fill="${rgba(rgb, 0.5)}"/></g>`
  }
  s += `<g stroke="${rgba(rgb, 0.9)}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="M4 30 Q-14 18 -10 -6 Q-7 -22 8 -24 Q20 -25 20 -14 Q20 -6 12 -2" fill="${rgba(rgb, 0.08)}"/>`
    + `<circle cx="14" cy="-32" r="4" fill="${rgba(rgb, 0.9)}" stroke="none"/>`
    + `<path d="M14 -36 l0 -7 M11 -35 l-3 -6 M17 -35 l3 -6" stroke-width="1"/>`
    + `<path d="M18 -32 l7 -1"/>`
    + `</g>`
  s += `<g stroke="${rgba(rgb, 0.6)}" stroke-width="1" fill="none" stroke-linecap="round">`
  for (let i = 0; i < 11; i++) {
    const a = (-150 + i * 13) * Math.PI / 180
    const ex = Math.cos(a) * 60, ey = Math.sin(a) * 60 - 6
    s += `<path d="M2 -6 Q${ex * 0.5} ${ey * 0.5 - 10} ${ex} ${ey}"/>`
    s += `<circle cx="${ex}" cy="${ey}" r="2.6" stroke="${rgba(rgb, 0.7)}" stroke-width="0.8" fill="${rgba(rgb, 0.12)}"/>`
    s += `<circle cx="${ex}" cy="${ey}" r="1" fill="${rgba(rgb, 0.8)}" stroke="none"/>`
  }
  s += `</g>`
  return s
}

// ── DINE · BLOCK-PRINT ────────────────────────────────────────────

function blockRestaurant(rgb: string, p: Palette): string {
  let s = blockFrame(rgb)
  s += `<g stroke="${rgba(rgb, 0.85)}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="M0 60 Q-4 40 0 24"/>`
    + `<path d="M0 24 Q-40 -2 -22 -44 Q-8 -64 0 -64 Q8 -64 22 -44 Q40 -2 0 24 Z" fill="${rgba(rgb, 0.06)}"/>`
    + `<path d="M0 18 Q-30 -4 -16 -40 Q-6 -54 0 -54 Q6 -54 16 -40 Q30 -4 0 18 Z" stroke="${rgba(rgb, 0.45)}" stroke-width="0.8"/>`
    + `</g>`
  for (let i = 0; i < 5; i++) {
    const y = -44 + i * 15
    s += `<g transform="translate(0,${y})"><circle r="3.4" stroke="${rgba(rgb, 0.7)}" stroke-width="0.9" fill="none"/><circle r="1.2" fill="${rgba(rgb, 0.8)}"/>`
    for (let k = 0; k < 6; k++) {
      const a = k * 60 * Math.PI / 180
      s += `<circle cx="${Math.cos(a) * 6}" cy="${Math.sin(a) * 6}" r="1" fill="${rgba(rgb, 0.55)}"/>`
    }
    s += `</g>`
  }
  s += `<path d="M0 30 Q-18 28 -26 16" stroke="${rgba(rgb, 0.6)}" stroke-width="1" fill="none"/><path d="M0 30 Q18 28 26 16" stroke="${rgba(rgb, 0.6)}" stroke-width="1" fill="none"/>`
  return s
}

function blockCafe(rgb: string, p: Palette): string {
  // Unique clip id per render so multiple cards on one screen don't collide.
  const clipId = `cafeclip-${rgb.replace(/[^0-9]/g, '')}`
  let s = ''
  const step = 30
  for (let r = -1; r < 7; r++) {
    for (let col = -1; col < 7; col++) {
      const x = col * step + (r % 2 ? step / 2 : 0) - 90, y = r * step - 90
      s += `<g transform="translate(${x},${y})">`
      for (let k = 0; k < 4; k++) {
        const a = k * 90
        s += `<path d="M0 -3 Q3 -7 0 -11 Q-3 -7 0 -3" transform="rotate(${a})" stroke="${rgba(rgb, 0.6)}" stroke-width="0.8" fill="${rgba(rgb, 0.10)}"/>`
      }
      s += `<circle r="1.2" fill="${rgba(rgb, 0.7)}"/>`
      s += `<path d="M0 0 L${step} 0" stroke="${rgba(rgb, 0.18)}" stroke-width="0.6"/><path d="M0 0 L${step / 2} ${step}" stroke="${rgba(rgb, 0.18)}" stroke-width="0.6"/>`
      s += `</g>`
    }
  }
  return `<defs><clipPath id="${clipId}"><circle r="78"/></clipPath></defs>`
    + `<g clip-path="url(#${clipId})">${s}</g>`
    + `<circle r="78" stroke="${rgba(rgb, 0.4)}" stroke-width="1"/>`
    + `<circle r="74" stroke="${rgba(rgb, 0.25)}" stroke-width="0.7"/>`
}

function blockBar(rgb: string, p: Palette): string {
  let s = blockFrame(rgb)
  for (let i = 0; i < 8; i++) {
    const a = i * 45
    s += `<g transform="rotate(${a}) translate(0,-46)"><path d="M0 -16 Q14 -10 12 6 Q10 18 0 18 Q-12 16 -10 2 Q-9 -8 0 -10 Q6 -10 6 -3 Q6 1 2 2" stroke="${rgba(rgb, 0.8)}" stroke-width="1.2" fill="${rgba(rgb, 0.06)}" stroke-linejoin="round"/><circle cy="-2" r="1.3" fill="${rgba(rgb, 0.7)}"/></g>`
  }
  s += `<circle r="13" stroke="${rgba(rgb, 0.7)}" stroke-width="1.2" fill="none"/>`
  for (let i = 0; i < 6; i++) {
    const a = i * 60
    s += `<g transform="rotate(${a})"><path d="M0 -5 Q3 -9 0 -13 Q-3 -9 0 -5" fill="${rgba(rgb, 0.5)}"/></g>`
  }
  s += `<circle r="3" fill="${rgba(rgb, 0.85)}"/>`
  return s
}

function blockStreetFood(rgb: string, p: Palette): string {
  let s = blockFrame(rgb)
  ;[64, 46, 28].forEach((r, idx) => {
    let path = ''
    const n = 48
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * 2 * Math.PI
      const rr = r + Math.sin(a * 6) * 4
      path += (i ? 'L' : 'M') + (Math.cos(a) * rr) + ' ' + (Math.sin(a) * rr) + ' '
    }
    s += `<path d="${path}Z" stroke="${rgba(rgb, 0.55)}" stroke-width="1" fill="none"/>`
    const m = 10 + idx * 2
    for (let i = 0; i < m; i++) {
      const a = (i / m) * 2 * Math.PI
      s += `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="1.6" fill="${rgba(rgb, 0.6)}"/>`
    }
  })
  for (let i = 0; i < 8; i++) {
    const a = i * 45
    s += `<g transform="rotate(${a})"><path d="M0 -4 Q3 -9 0 -14 Q-3 -9 0 -4" stroke="${rgba(rgb, 0.7)}" stroke-width="0.9" fill="${rgba(rgb, 0.12)}"/></g>`
  }
  s += `<circle r="3" fill="${rgba(rgb, 0.85)}"/>`
  return s
}

// ── DO · SAORA ────────────────────────────────────────────────────

function saoraHike(rgb: string, p: Palette): string {
  let s = netBorder(rgb, 70)
  s += `<path d="M-46 36 L-20 -10 L4 36 Z" stroke="${rgba(rgb, 0.6)}" stroke-width="1.2" fill="${rgba(rgb, 0.05)}"/>`
  s += `<path d="M-8 36 L24 -28 L52 36 Z" stroke="${rgba(rgb, 0.75)}" stroke-width="1.3" fill="${rgba(rgb, 0.07)}"/>`
  for (let i = 0; i < 5; i++) {
    s += `<line x1="${10 + i * 5}" y1="${-10 + i * 8}" x2="${38 - i * 5}" y2="${-10 + i * 8}" stroke="${rgba(rgb, 0.3)}" stroke-width="0.6"/>`
  }
  s += `<circle cx="24" cy="-30" r="2.4" fill="${rgba(rgb, 0.8)}"/>`
  s += `<g transform="translate(-24,8)">${saoraFig(rgb, 0.9)}</g>`
  return s
}

function saoraTrail(rgb: string, p: Palette): string {
  let s = netBorder(rgb, 70)
  let path = 'M'
  for (let t = 0; t <= 540; t += 10) {
    const a = t * Math.PI / 180
    const r = 60 - t / 540 * 52
    path += `${Math.cos(a) * r} ${Math.sin(a) * r} L`
  }
  path = path.slice(0, -2)
  s += `<path d="${path}" stroke="${rgba(rgb, 0.55)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
  for (let t = 20; t <= 520; t += 40) {
    const a = t * Math.PI / 180
    const r = 60 - t / 540 * 52
    s += `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="1.5" fill="${rgba(rgb, 0.7)}"/>`
  }
  s += `<g transform="translate(54,2) scale(0.7)">${saoraFig(rgb, 1)}</g>`
  return s
}

function saoraAdventure(rgb: string, p: Palette): string {
  let s = netBorder(rgb, 70)
  for (let i = 0; i < 8; i++) {
    const a = i * 45
    s += `<g transform="rotate(${a})"><path d="M0 -18 L4 -42 L-4 -42 Z" fill="${rgba(rgb, 0.12)}" stroke="${rgba(rgb, 0.5)}" stroke-width="0.8"/></g>`
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + 45
    s += `<g transform="rotate(${a}) translate(0,-58) scale(0.62)">${saoraFig(rgb, 1)}</g>`
  }
  s += `<circle r="11" stroke="${rgba(rgb, 0.8)}" stroke-width="1.3" fill="none"/>`
  s += `<circle r="3.5" fill="${rgba(rgb, 0.9)}"/>`
  return s
}

function saoraWorkshop(rgb: string, p: Palette): string {
  let s = netBorder(rgb, 70)
  ;[50, 38, 24].forEach((d, i) => {
    s += `<rect x="${-d}" y="${-d}" width="${d * 2}" height="${d * 2}" stroke="${rgba(rgb, 0.6 - i * 0.1)}" stroke-width="1.1" fill="none" transform="rotate(${i * 15})"/>`
  })
  s += `<circle r="4" fill="${rgba(rgb, 0.85)}"/>`
  ;[[0, -60], [0, 60], [-60, 0], [60, 0]].forEach(([x, y]) => {
    s += `<g transform="translate(${x},${y}) scale(0.6)">${saoraFig(rgb, 1)}</g>`
  })
  return s
}

function saoraLiveShow(rgb: string, p: Palette): string {
  let s = netBorder(rgb, 70)
  s += `<circle r="50" stroke="${rgba(rgb, 0.3)}" stroke-width="1"/>`
  for (let i = 0; i < 10; i++) {
    const a = i * 36
    s += `<g transform="rotate(${a}) translate(0,-50) scale(0.66)">${saoraFig(rgb, 1)}</g>`
  }
  for (let i = 0; i < 10; i++) {
    const a1 = i * 36 * Math.PI / 180, a2 = (i + 1) * 36 * Math.PI / 180
    s += `<path d="M${Math.cos(a1) * 44} ${Math.sin(a1) * 44} L${Math.cos(a2) * 44} ${Math.sin(a2) * 44}" stroke="${rgba(rgb, 0.3)}" stroke-width="0.7"/>`
  }
  s += `<g transform="scale(1.05)">${saoraFig(rgb, 1)}</g>`
  return s
}

// ── VISIT · KALAMKARI ─────────────────────────────────────────────

function kalMuseum(rgb: string, p: Palette): string {
  let s = kalBorder(rgb, 70)
  s += `<g stroke="${rgba(rgb, 0.85)}" stroke-width="1.4" fill="none" stroke-linejoin="round">`
    + `<path d="M-30 44 L-30 -6 Q-30 -38 0 -38 Q30 -38 30 -6 L30 44"/>`
    + `<path d="M-22 -28 L0 -56 L22 -28"/>`
    + `<path d="M0 -56 L0 -64"/><circle cy="-66" r="2.5" fill="${rgba(rgb, 0.85)}" stroke="none"/>`
    + `<path d="M-44 44 L-44 -2 L-30 -2 M44 44 L44 -2 L30 -2"/>`
    + `<path d="M-30 14 L30 14 M-30 28 L30 28" stroke="${rgba(rgb, 0.4)}" stroke-width="0.8"/>`
    + `</g>`
  s += `<g transform="translate(0,2)"><circle r="7" stroke="${rgba(rgb, 0.7)}" stroke-width="1" fill="none"/>`
  for (let i = 0; i < 8; i++) {
    const a = i * 45
    s += `<path d="M0 -7 Q2 -12 0 -15 Q-2 -12 0 -7" transform="rotate(${a})" stroke="${rgba(rgb, 0.6)}" stroke-width="0.7" fill="none"/>`
  }
  s += `<circle r="2" fill="${rgba(rgb, 0.85)}"/></g>`
  return s
}

function kalGallery(rgb: string, p: Palette): string {
  let s = kalBorder(rgb, 70)
  s += `<circle r="54" stroke="${rgba(rgb, 0.35)}" stroke-width="1"/>`
  for (let i = 0; i < 16; i++) {
    const a = i * (360 / 16)
    s += `<g transform="rotate(${a})"><path d="M0 -30 Q7 -48 0 -52 Q-7 -48 0 -30" stroke="${rgba(rgb, 0.65)}" stroke-width="1.1" fill="${rgba(rgb, 0.05)}"/></g>`
  }
  for (let i = 0; i < 12; i++) {
    const a = i * 30 + 15
    s += `<g transform="rotate(${a})"><path d="M0 -14 Q5 -28 0 -34 Q-5 -28 0 -14" stroke="${rgba(rgb, 0.85)}" stroke-width="1.1" fill="${rgba(rgb, 0.10)}"/></g>`
  }
  s += `<circle r="11" stroke="${rgba(rgb, 0.7)}" stroke-width="1" fill="none"/>`
  for (let i = 0; i < 8; i++) {
    const a = i * 45 * Math.PI / 180
    s += `<circle cx="${Math.cos(a) * 6}" cy="${Math.sin(a) * 6}" r="1.2" fill="${rgba(rgb, 0.6)}"/>`
  }
  s += `<circle r="3" fill="${rgba(rgb, 0.9)}"/>`
  return s
}

function kalHeritage(rgb: string, p: Palette): string {
  let s = kalBorder(rgb, 70)
  s += `<g stroke="${rgba(rgb, 0.85)}" stroke-width="1.4" fill="none" stroke-linejoin="round">`
    + `<path d="M-26 20 Q-26 -16 0 -16 Q26 -16 26 20 Z" fill="${rgba(rgb, 0.06)}"/>`
    + `<path d="M0 -16 L0 -30"/><circle cy="-33" r="3" fill="${rgba(rgb, 0.85)}" stroke="none"/>`
    + `<path d="M-38 20 L38 20 L38 30 L-38 30 Z"/>`
    + `<path d="M-30 20 L-30 30 M30 20 L30 30 M0 -16 L0 20" stroke="${rgba(rgb, 0.4)}" stroke-width="0.8"/>`
    + `</g>`
  ;[-48, 48].forEach((x) => {
    s += `<g transform="translate(${x},0)" stroke="${rgba(rgb, 0.6)}" stroke-width="1.1" fill="none"><path d="M-5 30 L-5 -20 Q-5 -26 0 -26 Q5 -26 5 -20 L5 30"/><circle cy="-30" r="2" fill="${rgba(rgb, 0.7)}" stroke="none"/></g>`
  })
  return s
}

function kalViewpoint(rgb: string, p: Palette): string {
  let s = kalBorder(rgb, 70)
  s += `<circle cy="-8" r="17" stroke="${rgba(rgb, 0.8)}" stroke-width="1.3" fill="none"/>`
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * 2 * Math.PI
    s += `<line x1="${Math.cos(a) * 20}" y1="${Math.sin(a) * 20 - 8}" x2="${Math.cos(a) * 27}" y2="${Math.sin(a) * 27 - 8}" stroke="${rgba(rgb, 0.5)}" stroke-width="0.9" stroke-linecap="round"/>`
  }
  s += `<circle cy="-8" r="4" fill="${rgba(rgb, 0.85)}"/>`
  s += `<g stroke="${rgba(rgb, 0.7)}" stroke-width="1.3" fill="${rgba(rgb, 0.05)}" stroke-linejoin="round">`
    + `<path d="M-58 40 Q-34 8 -10 40 Z"/>`
    + `<path d="M-16 44 Q18 0 54 44 Z" fill="${rgba(rgb, 0.07)}"/>`
    + `</g>`
  for (let i = 0; i < 5; i++) {
    s += `<line x1="${4 + i * 7}" y1="${20 + i * 4}" x2="${30 - i * 5}" y2="${20 + i * 4}" stroke="${rgba(rgb, 0.3)}" stroke-width="0.6"/>`
  }
  return s
}

function kalMarket(rgb: string, p: Palette): string {
  let s = kalBorder(rgb, 70)
  s += `<g stroke="${rgba(rgb, 0.8)}" stroke-width="1.2" fill="none" stroke-linejoin="round">`
  ;[-34, 0, 34].forEach((x) => {
    s += `<path d="M${x - 15} 38 L${x - 15} 6 Q${x - 15} -8 ${x} -8 Q${x + 15} -8 ${x + 15} 6 L${x + 15} 38"/>`
    s += `<path d="M${x - 19} 6 Q${x} -2 ${x + 19} 6" stroke="${rgba(rgb, 0.55)}" stroke-width="0.9"/>`
  })
  s += `<path d="M-52 38 L52 38" stroke-width="1.3"/>`
  s += `</g>`
  ;[-17, 17].forEach((x) => {
    s += `<g transform="translate(${x},-14)"><line x1="0" y1="-6" x2="0" y2="-2" stroke="${rgba(rgb, 0.5)}" stroke-width="0.8"/><path d="M-4 -2 Q0 6 4 -2 Z" stroke="${rgba(rgb, 0.75)}" stroke-width="1" fill="${rgba(rgb, 0.12)}"/><circle cy="0" r="1" fill="${rgba(rgb, 0.9)}"/></g>`
  })
  s += `<g transform="translate(0,-30)"><path d="M-4 0 Q0 9 4 0 Z" stroke="${rgba(rgb, 0.8)}" stroke-width="1.1" fill="${rgba(rgb, 0.14)}"/><circle cy="2" r="1.2" fill="${rgba(rgb, 0.9)}"/></g>`
  return s
}

// ── REGISTRY ──────────────────────────────────────────────────────
// Each category maps subtype → builder, with a `default` fallback so any
// unrecognized or missing subtype still renders a true medallion of that
// tradition. Keys are lowercased; common aliases are mapped to the same builder.

type Builder = (rgb: string, p: Palette) => string

const REGISTRY: Record<Category, { default: Builder } & Record<string, Builder>> = {
  watch: {
    default:       warliFilm,
    film:          warliFilm,
    movie:         warliFilm,
    series:        warliSeries,
    show:          warliSeries,
    tv:            warliSeries,
    documentary:   warliDoc,
    doc:           warliDoc,
  },
  listen: {
    default:       gondAlbum,
    album:         gondAlbum,
    song:          gondAlbum,
    podcast:       gondPodcast,
    audiobook:     gondAudiobook,
    artist:        gondArtist,
  },
  read: {
    default:       madhuFiction,
    fiction:       madhuFiction,
    book:          madhuFiction,
    novel:         madhuFiction,
    'non-fiction': madhuNonFiction,
    nonfiction:    madhuNonFiction,
    article:       madhuNonFiction,
    manga:         madhuPoetry,
    poetry:        madhuPoetry,
    poem:          madhuPoetry,
  },
  dine: {
    default:       blockRestaurant,
    restaurant:    blockRestaurant,
    cafe:          blockCafe,
    'café':        blockCafe,
    bar:           blockBar,
    'street food': blockStreetFood,
    streetfood:    blockStreetFood,
  },
  do: {
    default:       saoraHike,
    hike:          saoraHike,
    trail:         saoraTrail,
    ride:          saoraTrail,
    adventure:     saoraAdventure,
    workshop:      saoraWorkshop,
    class:         saoraWorkshop,
    'live show':   saoraLiveShow,
    liveshow:      saoraLiveShow,
  },
  visit: {
    default:       kalMuseum,
    museum:        kalMuseum,
    exhibition:    kalMuseum,
    gallery:       kalGallery,
    heritage:      kalHeritage,
    concert:       kalHeritage,
    play:          kalHeritage,
    theatre:       kalHeritage,
    viewpoint:     kalViewpoint,
    market:        kalMarket,
  },
}

function pickBuilder(category: Category, subtype: string | null): Builder {
  const table = REGISTRY[category]
  if (!table) return REGISTRY.watch.default
  if (subtype) {
    const key = subtype.toLowerCase().trim()
    if (table[key]) return table[key]
  }
  return table.default
}

// ── COMPONENT ─────────────────────────────────────────────────────

type CategoryMotifProps = {
  category: Category
  rgb:      string          // "r,g,b" from CategoryConfig.vividRgb
  subtype?: string | null   // metadata.subtype, optional
  size?:    number          // px; defaults to 188
}

export function CategoryMotif({ category, rgb, subtype = null, size = 188 }: CategoryMotifProps) {
  const palette = paletteFromRgb(rgb)
  const inner   = pickBuilder(category, subtype)(rgb, palette)

  return (
    <svg
      style={{
        position:      'absolute',
        top:           '50%',
        left:          '50%',
        transform:     'translate(-50%,-52%)',
        zIndex:        5,
        pointerEvents: 'none',
        width:         `${size}px`,
        height:        `${size}px`,
      }}
      viewBox="-100 -100 200 200"
      fill="none"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}
