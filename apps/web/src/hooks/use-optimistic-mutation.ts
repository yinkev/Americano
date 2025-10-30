/**
 * Optimistic Mutation Hook
 * Wave 2: Optimistic Updates
 *
 * React 19 useTransition-based optimistic updates for user actions
 * Provides instant UI feedback with automatic rollback on failure
 *
 * Based on React 19 useTransition documentation from context7
 */

'use client'

import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  successMessage?: string
  errorMessage?: string
}

interface OptimisticMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>
  isPending: boolean
  error: Error | null
  data: TData | null
}

/**
 * Hook for optimistic mutations with automatic rollback
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useOptimisticMutation({
 *   mutationFn: async (id: string) => {
 *     const res = await fetch(`/api/insights/${id}/acknowledge`, { method: 'POST' })
 *     return res.json()
 *   },
 *   successMessage: 'Insight acknowledged',
 *   onSuccess: () => {
 *     // Refresh data or update cache
 *   },
 * })
 *
 * <button onClick={() => mutate(insightId)} disabled={isPending}>
 *   {isPending ? 'Acknowledging...' : 'Acknowledge'}
 * </button>
 * ```
 */
export function useOptimisticMutation<TData = unknown, TVariables = void>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage = 'An error occurred',
}: OptimisticMutationOptions<TData, TVariables>): OptimisticMutationResult<TData, TVariables> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const mutate = useCallback(
    async (variables: TVariables) => {
      setError(null)

      // Use startTransition to mark this as a non-urgent update
      // This keeps the UI responsive during the mutation
      startTransition(async () => {
        try {
          const result = await mutationFn(variables)
          setData(result)

          // Show success toast if message provided
          if (successMessage) {
            toast.success(successMessage)
          }

          // Call success callback
          onSuccess?.(result, variables)
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)

          // Show error toast
          toast.error(errorMessage)

          // Call error callback
          onError?.(error, variables)
        }
      })
    },
    [mutationFn, onSuccess, onError, successMessage, errorMessage],
  )

  return {
    mutate,
    isPending,
    error,
    data,
  }
}

/**
 * Hook for optimistic updates with immediate UI changes and rollback
 *
 * @example
 * ```tsx
 * const [optimisticItems, updateOptimistic] = useOptimistic(items)
 *
 * const handleToggle = (id: string) => {
 *   // Immediately update UI
 *   updateOptimistic((current) =>
 *     current.map((item) =>
 *       item.id === id ? { ...item, completed: !item.completed } : item
 *     )
 *   )
 *
 *   // Then make API call (will rollback if fails)
 *   mutate({ id, completed: !item.completed })
 * }
 * ```
 */
export function useOptimistic<T>(
  initial: T,
): [T, (updater: (current: T) => T) => void, () => void] {
  const [optimisticState, setOptimisticState] = useState<T>(initial)
  const [actualState, setActualState] = useState<T>(initial)

  const updateOptimistic = useCallback((updater: (current: T) => T) => {
    setOptimisticState((current) => updater(current))
  }, [])

  const rollback = useCallback(() => {
    setOptimisticState(actualState)
  }, [actualState])

  const commit = useCallback((newState: T) => {
    setActualState(newState)
    setOptimisticState(newState)
  }, [])

  return [optimisticState, updateOptimistic, rollback]
}
