'use client'

import { type DBSchema, type IDBPDatabase, openDB } from 'idb'

/**
 * Offline Search Database Schema
 */
interface OfflineSearchDB extends DBSchema {
  searchResults: {
    key: string // query hash
    value: {
      query: string
      results: any[]
      timestamp: number
      filters?: any
    }
    indexes: { 'by-timestamp': number }
  }
  recentSearches: {
    key: number // auto-increment
    value: {
      query: string
      timestamp: number
      filters?: any
    }
    indexes: { 'by-timestamp': number }
  }
}

const DB_NAME = 'americano-search-offline'
const DB_VERSION = 1
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24 hours
const MAX_RECENT_SEARCHES = 50

/**
 * Initialize IndexedDB for offline search
 */
async function getDB(): Promise<IDBPDatabase<OfflineSearchDB>> {
  return openDB<OfflineSearchDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Search results cache
      if (!db.objectStoreNames.contains('searchResults')) {
        const searchResultsStore = db.createObjectStore('searchResults', {
          keyPath: 'query',
        })
        searchResultsStore.createIndex('by-timestamp', 'timestamp')
      }

      // Recent searches history
      if (!db.objectStoreNames.contains('recentSearches')) {
        const recentSearchesStore = db.createObjectStore('recentSearches', {
          keyPath: 'id',
          autoIncrement: true,
        })
        recentSearchesStore.createIndex('by-timestamp', 'timestamp')
      }
    },
  })
}

/**
 * Generate cache key from query and filters
 */
function generateCacheKey(query: string, filters?: any): string {
  const normalized = query.toLowerCase().trim()
  const filterStr = filters ? JSON.stringify(filters) : ''
  return `${normalized}::${filterStr}`
}

/**
 * Cache search results in IndexedDB
 */
export async function cacheSearchResults(
  query: string,
  results: any[],
  filters?: any,
): Promise<void> {
  try {
    const db = await getDB()
    const key = generateCacheKey(query, filters)

    await db.put('searchResults', {
      query: key,
      results,
      timestamp: Date.now(),
      filters,
    })

    // Also save to recent searches
    await saveRecentSearch(query, filters)
  } catch (error) {
    console.error('Failed to cache search results:', error)
  }
}

/**
 * Get cached search results from IndexedDB
 */
export async function getCachedSearchResults(query: string, filters?: any): Promise<any[] | null> {
  try {
    const db = await getDB()
    const key = generateCacheKey(query, filters)
    const cached = await db.get('searchResults', key)

    if (!cached) return null

    // Check if cache is still valid (within 24 hours)
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION
    if (isExpired) {
      // Remove expired cache
      await db.delete('searchResults', key)
      return null
    }

    return cached.results
  } catch (error) {
    console.error('Failed to get cached search results:', error)
    return null
  }
}

/**
 * Save recent search to history
 */
export async function saveRecentSearch(query: string, filters?: any): Promise<void> {
  try {
    const db = await getDB()

    // Add new search
    await db.add('recentSearches', {
      query,
      timestamp: Date.now(),
      filters,
    } as any)

    // Clean up old searches (keep only last 50)
    const allSearches = await db.getAllFromIndex('recentSearches', 'by-timestamp')
    if (allSearches.length > MAX_RECENT_SEARCHES) {
      const toDelete = allSearches.slice(0, allSearches.length - MAX_RECENT_SEARCHES)
      for (const search of toDelete) {
        await db.delete('recentSearches', (search as any).id)
      }
    }
  } catch (error) {
    console.error('Failed to save recent search:', error)
  }
}

/**
 * Get recent searches from history
 */
export async function getRecentSearches(limit = 10): Promise<
  Array<{
    query: string
    timestamp: number
    filters?: any
  }>
> {
  try {
    const db = await getDB()
    const searches = await db.getAllFromIndex('recentSearches', 'by-timestamp')

    // Return most recent searches first
    return searches
      .reverse()
      .slice(0, limit)
      .map(({ query, timestamp, filters }) => ({ query, timestamp, filters }))
  } catch (error) {
    console.error('Failed to get recent searches:', error)
    return []
  }
}

/**
 * Clear all offline search data
 */
export async function clearOfflineSearchData(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('searchResults')
    await db.clear('recentSearches')
  } catch (error) {
    console.error('Failed to clear offline search data:', error)
  }
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [online, setOnline] = React.useState(isOnline())

  React.useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

// Import React for the hook
import * as React from 'react'
