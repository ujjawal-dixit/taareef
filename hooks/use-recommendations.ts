// hooks/use-recommendations.ts
// Client-side hook for recommendation mutations.
// Optimistic UI — card appears instantly, syncs in background.
// Error handling — inline on card, never a blocking modal.
// Never use this for reads — reads happen server-side in page.tsx.

'use client'

import { useState, useCallback } from 'react'
import type {
  Recommendation,
  CreateRecommendationInput,
  UpdateRecommendationInput,
  ApiResponse,
} from '@/lib/types'

type MutationState = {
  isLoading: boolean
  error: string | null
}

// ============================================================
// CREATE RECOMMENDATION
// ============================================================

export function useCreateRecommendation() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  })

  const create = useCallback(async (
    input: CreateRecommendationInput,
    onOptimisticAdd?: (tempRec: Partial<Recommendation>) => void,
    onSuccess?: (rec: Recommendation) => void,
    onError?: (error: string) => void
  ) => {
    setState({ isLoading: true, error: null })

    // Generate a temporary ID for optimistic UI
    const tempId = `temp-${Date.now()}`

    // Optimistic add — card appears immediately
    if (onOptimisticAdd) {
      onOptimisticAdd({
        id: tempId,
        ...input,
        status: 'saved',
        reaction: null,
        priority: input.priority ?? 'medium',
        metadata: input.metadata ?? {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const result: ApiResponse<Recommendation> = await response.json()

      if (!response.ok || result.error || !result.data) {
        const errorMessage = result.error ?? 'Couldn\'t save — try again?'
        setState({ isLoading: false, error: errorMessage })
        onError?.(errorMessage)
        return null
      }

      setState({ isLoading: false, error: null })
      onSuccess?.(result.data)
      return result.data

    } catch (err) {
      console.error('[useCreateRecommendation]', err)
      const errorMessage = 'Couldn\'t save — try again?'
      setState({ isLoading: false, error: errorMessage })
      onError?.(errorMessage)
      return null
    }
  }, [])

  return { create, ...state }
}

// ============================================================
// UPDATE RECOMMENDATION
// ============================================================

export function useUpdateRecommendation() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  })

  const update = useCallback(async (
    id: string,
    input: UpdateRecommendationInput,
    onSuccess?: (rec: Recommendation) => void,
    onError?: (error: string) => void
  ) => {
    setState({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const result: ApiResponse<Recommendation> = await response.json()

      if (!response.ok || result.error || !result.data) {
        const errorMessage = result.error ?? 'Couldn\'t update — try again?'
        setState({ isLoading: false, error: errorMessage })
        onError?.(errorMessage)
        return null
      }

      setState({ isLoading: false, error: null })
      onSuccess?.(result.data)
      return result.data

    } catch (err) {
      console.error('[useUpdateRecommendation]', err)
      const errorMessage = 'Couldn\'t update — try again?'
      setState({ isLoading: false, error: errorMessage })
      onError?.(errorMessage)
      return null
    }
  }, [])

  return { update, ...state }
}

// ============================================================
// DISMISS RECOMMENDATION (soft delete)
// ============================================================

export function useDismissRecommendation() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  })

  const dismiss = useCallback(async (
    id: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    setState({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
      })

      const result: ApiResponse<{ id: string }> = await response.json()

      if (!response.ok || result.error) {
        const errorMessage = result.error ?? 'Couldn\'t dismiss — try again?'
        setState({ isLoading: false, error: errorMessage })
        onError?.(errorMessage)
        return false
      }

      setState({ isLoading: false, error: null })
      onSuccess?.()
      return true

    } catch (err) {
      console.error('[useDismissRecommendation]', err)
      const errorMessage = 'Couldn\'t dismiss — try again?'
      setState({ isLoading: false, error: errorMessage })
      onError?.(errorMessage)
      return false
    }
  }, [])

  return { dismiss, ...state }
}
