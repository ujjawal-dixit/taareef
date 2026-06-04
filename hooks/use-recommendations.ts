'use client'

// hooks/use-recommendations.ts
// Client-side mutations with optimistic UI.
// After successful create: triggers background enrichment for film/music.
// After enrichment: card updates with real artwork automatically on next load.

import { useState, useCallback } from 'react'
import { triggerEnrichment }     from '@/lib/utils/enrich'
import type {
  Recommendation,
  CreateRecommendationInput,
  UpdateRecommendationInput,
  ApiResponse,
} from '@/lib/types'

// ── CREATE ────────────────────────────────────────────────────────

export function useCreateRecommendation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const create = useCallback(async (
    input:         CreateRecommendationInput,
    onOptimistic?: (temp: Partial<Recommendation>) => void,
    onSuccess?:    (rec: Recommendation) => void,
    onError?:      (msg: string) => void,
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/recommendations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })

      const result: ApiResponse<Recommendation> = await res.json()

      if (!res.ok || result.error || !result.data) {
        const msg = result.error ?? "Couldn't save — try again?"
        setError(msg)
        onError?.(msg)
        setIsLoading(false)
        return null
      }

      const saved = result.data

      // Trigger background enrichment — fire-and-forget, never blocks UI.
      // watch → TMDB (film + TV)
      // listen → Spotify
      // read → Google Books
      if (saved.category === 'watch' || saved.category === 'listen') {
        triggerEnrichment(saved.id)
      } else if (saved.category === 'read') {
        fetch(`/api/enrich/book/${saved.id}`, { method: 'POST' }).catch(() => {})
      }

      setIsLoading(false)
      onSuccess?.(saved)
      return saved

    } catch (err) {
      console.error('[useCreateRecommendation]', err)
      const msg = "Couldn't save — try again?"
      setError(msg)
      onError?.(msg)
      setIsLoading(false)
      return null
    }
  }, [])

  return { create, isLoading, error }
}

// ── UPDATE ────────────────────────────────────────────────────────

export function useUpdateRecommendation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const update = useCallback(async (
    id:         string,
    input:      UpdateRecommendationInput,
    onSuccess?: (rec: Recommendation) => void,
    onError?:   (msg: string) => void,
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })

      const result: ApiResponse<Recommendation> = await res.json()

      if (!res.ok || result.error || !result.data) {
        const msg = result.error ?? "Couldn't update — try again?"
        setError(msg)
        onError?.(msg)
        setIsLoading(false)
        return null
      }

      setIsLoading(false)
      onSuccess?.(result.data)
      return result.data

    } catch (err) {
      console.error('[useUpdateRecommendation]', err)
      const msg = "Couldn't update — try again?"
      setError(msg)
      onError?.(msg)
      setIsLoading(false)
      return null
    }
  }, [])

  return { update, isLoading, error }
}

// ── DISMISS ───────────────────────────────────────────────────────

export function useDismissRecommendation() {
  const [isLoading, setIsLoading] = useState(false)

  const dismiss = useCallback(async (
    id:         string,
    onSuccess?: () => void,
    onError?:   (msg: string) => void,
  ) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/recommendations/${id}`, { method: 'DELETE' })
      const result: ApiResponse<{ id: string }> = await res.json()

      if (!res.ok || result.error) {
        onError?.(result.error ?? "Couldn't dismiss — try again?")
        setIsLoading(false)
        return false
      }

      onSuccess?.()
      setIsLoading(false)
      return true

    } catch (err) {
      console.error('[useDismissRecommendation]', err)
      onError?.("Couldn't dismiss — try again?")
      setIsLoading(false)
      return false
    }
  }, [])

  return { dismiss, isLoading }
}
