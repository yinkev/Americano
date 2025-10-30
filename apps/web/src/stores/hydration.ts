/**
 * Store Hydration Utilities
 *
 * Utilities for managing store hydration from localStorage.
 * Handles SSR compatibility and prevents hydration mismatches.
 *
 * Features:
 * - SSR-safe hydration checks
 * - Migration support
 * - Error recovery
 * - Version management
 */

'use client'

import { useEffect, useState } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'

/**
 * Hook to check if a Zustand persist store has been hydrated
 *
 * Usage:
 * ```tsx
 * function Component() {
 *   const hasHydrated = useHasHydrated(useAnalyticsStore)
 *
 *   if (!hasHydrated) {
 *     return <div>Loading...</div>
 *   }
 *
 *   return <div>Content</div>
 * }
 * ```
 */
export function useHasHydrated<T>(
  store: UseBoundStore<StoreApi<T>> & {
    persist?: {
      hasHydrated: () => boolean
      rehydrate: () => void
    }
  },
): boolean {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (store.persist?.hasHydrated()) {
      setHasHydrated(true)
    } else {
      const unsubscribe = store.persist?.onFinishHydration?.(() => {
        setHasHydrated(true)
      })
      return unsubscribe
    }
  }, [store])

  return hasHydrated
}

/**
 * Hook to manually trigger store rehydration
 *
 * Useful for testing or when you need to reload state from storage
 */
export function useRehydrate<T>(
  store: UseBoundStore<StoreApi<T>> & {
    persist?: {
      rehydrate: () => void
    }
  },
) {
  return () => {
    store.persist?.rehydrate()
  }
}

/**
 * Hook to clear persisted store data
 *
 * Useful for logout or reset functionality
 */
export function useClearPersistedState<T>(
  store: UseBoundStore<StoreApi<T>> & {
    persist?: {
      clearStorage: () => void
    }
  },
) {
  return () => {
    store.persist?.clearStorage()
  }
}

/**
 * Component wrapper that shows fallback UI until store is hydrated
 *
 * Usage:
 * ```tsx
 * <HydrationBoundary
 *   store={useAnalyticsStore}
 *   fallback={<Skeleton />}
 * >
 *   <AnalyticsDashboard />
 * </HydrationBoundary>
 * ```
 */
export function HydrationBoundary<T>({
  store,
  fallback = null,
  children,
}: {
  store: UseBoundStore<StoreApi<T>> & {
    persist?: {
      hasHydrated: () => boolean
      rehydrate: () => void
    }
  }
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const hasHydrated = useHasHydrated(store)

  if (!hasHydrated) {
    return fallback as React.ReactElement
  }

  return children as React.ReactElement
}

/**
 * Utility to safely read from localStorage
 *
 * Handles SSR and parsing errors gracefully
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const item = window.localStorage.getItem(key)
    if (!item) {
      return fallback
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return fallback
  }
}

/**
 * Utility to safely write to localStorage
 *
 * Handles SSR and stringify errors gracefully
 */
export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Utility to clear localStorage key
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Hook to check localStorage availability
 *
 * Useful for showing warnings when storage is disabled
 */
export function useIsStorageAvailable(): boolean {
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    try {
      const test = '__storage_test__'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      setIsAvailable(true)
    } catch {
      setIsAvailable(false)
    }
  }, [])

  return isAvailable
}

/**
 * Migration helper for store versions
 *
 * Handles version migrations with validation
 */
export function createMigration<T>(migrations: Record<number, (state: any) => T>) {
  return (persistedState: any, version: number): T => {
    let state = persistedState

    // Apply migrations in sequence
    const versions = Object.keys(migrations)
      .map(Number)
      .sort((a, b) => a - b)

    for (const v of versions) {
      if (v > version && migrations[v]) {
        state = migrations[v](state)
      }
    }

    return state
  }
}

/**
 * Storage wrapper with custom serialization
 *
 * Useful for compressing data or encrypting sensitive state
 */
export function createCustomStorage<T>({
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: {
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
} = {}) {
  return {
    getItem: (key: string): T | null => {
      const value = safeLocalStorageGet(key, null)
      if (value === null) return null
      try {
        return deserialize(value)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: T): void => {
      try {
        const serialized = serialize(value)
        safeLocalStorageSet(key, serialized)
      } catch (error) {
        console.error('Storage serialization error:', error)
      }
    },
    removeItem: (key: string): void => {
      safeLocalStorageRemove(key)
    },
  }
}
