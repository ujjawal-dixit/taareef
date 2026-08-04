'use client'

// components/features/navigation/app-providers.tsx
//
// WHY THIS FILE EXISTS (Session 15, 2026-07-29):
//
// AppShell used to be rendered *inside* each page. Next.js tears a page
// down when you navigate, so the shell — and everything it held — was
// destroyed and rebuilt on every screen change. Two consequences:
//
//   1. Wasteful. The nav and capture sheet remount constantly.
//   2. Blocking. Enrichment takes 5-20 seconds; a person rarely stays on
//      one screen that long. Anything watching a save had to die when
//      they moved, which is precisely the moment it mattered.
//
// A Next.js layout does NOT remount when you move between the pages
// beneath it. So save state lives here, above the router, and survives.
//
// THE CONTAINER MOVED TOO, and that fixed a real bug.
// The centred-column chrome had been written four separate times and
// had drifted — the card detail screen had no width cap at all, so on
// anything wider than a phone the dashboard was a centred column while
// the detail screen sprawled edge to edge. AppFrame now defines it once
// and decides nav presence by route.
//
// BUILT FOR WHAT COMES NEXT:
// `inFlight` tracks saves from request to enrichment. Nothing consumes
// it yet. It is the foundation for the save peek — the card that rises
// from the bottom and fills in with its poster while you carry on.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { useRouter }              from 'next/navigation'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { AppFrame }               from './app-frame'
import { CaptureScreen }          from '@/components/features/capture/capture-screen'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import type { CreateRecommendationInput, Recommendation } from '@/lib/types'

/**
 * A save in progress. Kept for the lifetime of the app session so any
 * screen can reflect it, and so it outlives the screen it started on.
 */
export type InFlightSave = {
  tempId: string
  temp:   Recommendation
  saved:  Recommendation | null
  failed: boolean
}

/**
 * Screens react to saves by subscribing rather than by owning the save.
 * The category list uses this to insert a card optimistically and then
 * swap in the real one — behaviour that previously lived in the page and
 * therefore died with it.
 */
export type SaveListener = {
  onOptimistic?: (temp: Recommendation) => void
  onSaved?:      (real: Recommendation, tempId: string) => void
  onFailed?:     (tempId: string) => void
}

type SaveCtx = {
  openCapture:  () => void
  closeCapture: () => void
  isCaptureOpen: boolean
  inFlight:     InFlightSave[]
  subscribe:    (listener: SaveListener) => () => void
}

const SaveContext = createContext<SaveCtx>({
  openCapture:   () => {},
  closeCapture:  () => {},
  isCaptureOpen: false,
  inFlight:      [],
  subscribe:     () => () => {},
})

export function useSave() {
  return useContext(SaveContext)
}

/**
 * Subscribe to save events for as long as the calling component is
 * mounted. The listener is held in a ref so a screen can pass an inline
 * object without re-subscribing on every render.
 */
export function useSaveEvents(listener: SaveListener) {
  const { subscribe } = useSave()
  const ref = useRef(listener)
  ref.current = listener

  useEffect(() => {
    return subscribe({
      onOptimistic: (t)     => ref.current.onOptimistic?.(t),
      onSaved:      (r, id) => ref.current.onSaved?.(r, id),
      onFailed:     (id)    => ref.current.onFailed?.(id),
    })
  }, [subscribe])
}

function SaveProvider({ children }: { children: ReactNode }) {
  const router     = useRouter()
  const { toast }  = useToast()
  const { create } = useCreateRecommendation()

  const [isCaptureOpen, setCaptureOpen] = useState(false)
  const [inFlight, setInFlight]         = useState<InFlightSave[]>([])

  // A Set rather than state: subscribing must never trigger a re-render.
  const listeners = useRef(new Set<SaveListener>())

  const subscribe = useCallback((listener: SaveListener) => {
    listeners.current.add(listener)
    return () => { listeners.current.delete(listener) }
  }, [])

  const openCapture  = useCallback(() => setCaptureOpen(true),  [])
  const closeCapture = useCallback(() => setCaptureOpen(false), [])

  const handleSaved = useCallback(async (input: CreateRecommendationInput) => {
    const tempId = `temp-${Date.now()}`

    // A complete Recommendation so subscribers can render it immediately,
    // before the server has replied.
    const temp: Recommendation = {
      id:         tempId,
      user_id:    '',
      status:     'saved',
      reaction:   null,
      priority:   input.priority ?? 'medium',
      metadata:   input.metadata ?? {},
      url:        input.url       ?? null,
      image_url:  input.image_url ?? null,
      notes:      input.notes     ?? null,
      location:   input.location  ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...input,
    }

    setInFlight(prev => [...prev, { tempId, temp, saved: null, failed: false }])
    listeners.current.forEach(l => l.onOptimistic?.(temp))

    // Close immediately. The save continues without the sheet, which is
    // what keeps the flow at two taps.
    closeCapture()

    await create(
      input,
      undefined,
      (real) => {
        setInFlight(prev => prev.map(s => s.tempId === tempId ? { ...s, saved: real } : s))
        listeners.current.forEach(l => l.onSaved?.(real, tempId))
        toast('Saved ✦', 'success')
        // Refresh server components so dashboard counts stay truthful.
        router.refresh()
      },
      (err) => {
        setInFlight(prev => prev.map(s => s.tempId === tempId ? { ...s, failed: true } : s))
        listeners.current.forEach(l => l.onFailed?.(tempId))
        toast(err, 'error')
      },
    )
  }, [create, toast, router, closeCapture])

  return (
    <SaveContext.Provider value={{ openCapture, closeCapture, isCaptureOpen, inFlight, subscribe }}>
      {children}
      <CaptureScreen isOpen={isCaptureOpen} onClose={closeCapture} onSaved={handleSaved} />
    </SaveContext.Provider>
  )
}

/**
 * Everything that must outlive a single screen. Rendered once, from
 * app/(app)/layout.tsx.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SaveProvider>
        <AppFrame>{children}</AppFrame>
      </SaveProvider>
    </ToastProvider>
  )
}
