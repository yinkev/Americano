"use client"

/**
 * Service Worker Integration for Search
 *
 * This module provides integration between the search functionality
 * and the service worker for offline capabilities.
 */

/**
 * Register service worker (if not already registered by next-pwa)
 */
export async function registerSearchServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported in this browser")
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    console.log("Service Worker registered for search caching")

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available
            console.log("New service worker available. Please refresh.")
          }
        })
      }
    })
  } catch (error) {
    console.error("Service Worker registration failed:", error)
  }
}

/**
 * Check if search API is available (online or cached)
 */
export async function isSearchAvailable(): Promise<boolean> {
  // Check if online
  if (navigator.onLine) {
    return true
  }

  // Check if service worker has cached search API
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      const cache = await caches.open("apis")
      const cachedResponse = await cache.match("/api/search")
      return cachedResponse !== undefined
    } catch (error) {
      console.error("Failed to check cache:", error)
      return false
    }
  }

  return false
}

/**
 * Add search results to cache for offline access
 */
export async function cacheSearchResponse(
  query: string,
  response: Response
): Promise<void> {
  if (!("caches" in window)) return

  try {
    const cache = await caches.open("search-results-v1")
    const cacheKey = `/api/search?q=${encodeURIComponent(query)}`
    await cache.put(cacheKey, response.clone())
  } catch (error) {
    console.error("Failed to cache search response:", error)
  }
}

/**
 * Get cached search response for offline access
 */
export async function getCachedSearchResponse(query: string): Promise<Response | null> {
  if (!("caches" in window)) return null

  try {
    const cache = await caches.open("search-results-v1")
    const cacheKey = `/api/search?q=${encodeURIComponent(query)}`
    const cachedResponse = await cache.match(cacheKey)
    return cachedResponse || null
  } catch (error) {
    console.error("Failed to get cached search response:", error)
    return null
  }
}

/**
 * Clear old search cache entries
 */
export async function clearOldSearchCache(maxAge = 24 * 60 * 60 * 1000): Promise<void> {
  if (!("caches" in window)) return

  try {
    const cache = await caches.open("search-results-v1")
    const requests = await cache.keys()
    const now = Date.now()

    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const dateHeader = response.headers.get("date")
        if (dateHeader) {
          const cacheDate = new Date(dateHeader).getTime()
          if (now - cacheDate > maxAge) {
            await cache.delete(request)
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to clear old search cache:", error)
  }
}

/**
 * Preload popular searches for offline access
 */
export async function preloadPopularSearches(queries: string[]): Promise<void> {
  if (!navigator.onLine) {
    console.warn("Cannot preload searches while offline")
    return
  }

  for (const query of queries) {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        await cacheSearchResponse(query, response)
      }
    } catch (error) {
      console.error(`Failed to preload search for "${query}":`, error)
    }
  }
}

/**
 * Sync pending searches when coming back online
 */
export function setupOfflineSync(): void {
  if (typeof window === "undefined") return

  window.addEventListener("online", async () => {
    console.log("Back online - syncing search data...")

    // Clear old cache entries
    await clearOldSearchCache()

    // Optionally preload recent searches
    // This could be implemented with IndexedDB integration
  })

  window.addEventListener("offline", () => {
    console.log("Offline - using cached search results")
  })
}
