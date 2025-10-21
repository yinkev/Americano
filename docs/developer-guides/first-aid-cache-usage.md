# First Aid Cache - Developer Usage Guide

**For**: Frontend and API Developers
**Story**: 3.3 AC#3 - First Aid Cross-Reference Caching
**Date**: 2025-10-17

---

## Quick Start

### Import the Cache

```typescript
import { firstAidCache } from '@/lib/first-aid-cache'
```

### Basic Usage Pattern

```typescript
// 1. Generate cache key
const key = firstAidCache.generateKey({
  type: 'concept',
  conceptId: 'concept-123'
})

// 2. Try to get from cache
let references = firstAidCache.get(key)

// 3. On cache miss, fetch and store
if (!references) {
  references = await fetchReferencesFromDB(conceptId)
  firstAidCache.set(key, references, { ttl: 3600000 })
}

// 4. Use the references
return references
```

---

## Frontend Component Examples

### Example 1: First Aid Cross-Reference Component

```typescript
import { useState, useEffect } from 'react'
import { firstAidCache } from '@/lib/first-aid-cache'

interface FirstAidCrossReferenceProps {
  lectureId: string
  scrollPosition: number
}

export function FirstAidCrossReference({
  lectureId,
  scrollPosition
}: FirstAidCrossReferenceProps) {
  const [references, setReferences] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [cacheMetrics, setCacheMetrics] = useState<{
    cached: boolean
    time: string
  } | null>(null)

  useEffect(() => {
    const fetchReferences = async () => {
      setIsLoading(true)

      try {
        // Call API with position parameter for scroll-based caching
        const response = await fetch(
          `/api/first-aid/mappings/${lectureId}?position=${scrollPosition}`
        )
        const data = await response.json()

        setReferences(data.mappings)
        setCacheMetrics({
          cached: data.cached,
          time: data.cached ? data.cacheHitTime : data.dbFetchTime
        })
      } catch (error) {
        console.error('Failed to fetch references:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce scroll-triggered requests
    const timeout = setTimeout(fetchReferences, 300)
    return () => clearTimeout(timeout)
  }, [lectureId, scrollPosition])

  return (
    <div className="first-aid-references">
      {/* Cache metrics badge (dev mode only) */}
      {process.env.NODE_ENV === 'development' && cacheMetrics && (
        <div className={`cache-badge ${cacheMetrics.cached ? 'hit' : 'miss'}`}>
          {cacheMetrics.cached ? '⚡ Cached' : '🔍 DB'} ({cacheMetrics.time}ms)
        </div>
      )}

      {/* Loading state */}
      {isLoading && <div>Loading references...</div>}

      {/* References display */}
      {references.map(ref => (
        <ReferenceCard key={ref.id} reference={ref} />
      ))}
    </div>
  )
}
```

### Example 2: Scroll Position Tracking

```typescript
import { useState, useCallback } from 'react'
import { debounce } from 'lodash'

function LectureViewer({ lectureId }: { lectureId: string }) {
  const [scrollPosition, setScrollPosition] = useState(0)

  // Debounced scroll handler
  const handleScroll = useCallback(
    debounce((event: React.UIEvent<HTMLDivElement>) => {
      const position = event.currentTarget.scrollTop
      setScrollPosition(position)
    }, 300),
    []
  )

  return (
    <div className="lecture-viewer" onScroll={handleScroll}>
      <LectureContent lectureId={lectureId} />

      {/* First Aid references panel */}
      <FirstAidCrossReference
        lectureId={lectureId}
        scrollPosition={scrollPosition}
      />
    </div>
  )
}
```

### Example 3: Cache Invalidation on Content Update

```typescript
async function uploadNewEdition(editionData: EditionData) {
  try {
    // 1. Upload new edition
    const response = await fetch('/api/first-aid/upload', {
      method: 'POST',
      body: JSON.stringify(editionData)
    })

    if (!response.ok) throw new Error('Upload failed')

    // 2. Invalidate cache for this edition
    await fetch('/api/first-aid/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'invalidateEdition',
        edition: editionData.year
      })
    })

    // 3. Show success message
    toast.success(`Edition ${editionData.year} uploaded and cache cleared`)
  } catch (error) {
    toast.error('Failed to upload edition')
  }
}
```

---

## API Usage Examples

### Example 4: Server-Side Caching in API Route

```typescript
// /app/api/first-aid/concept/[conceptId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { firstAidCache } from '@/lib/first-aid-cache'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  const { conceptId } = await params

  // Generate cache key
  const cacheKey = firstAidCache.generateKey({
    type: 'concept',
    conceptId
  })

  // Try cache first
  let references = firstAidCache.get(cacheKey)

  if (references) {
    console.log(`✓ Cache hit for concept ${conceptId}`)

    return NextResponse.json({
      references,
      cached: true,
      timestamp: new Date().toISOString()
    })
  }

  // Cache miss - fetch from database
  console.log(`× Cache miss for concept ${conceptId}`)

  const dbReferences = await prisma.lectureFirstAidMapping.findMany({
    where: { conceptId },
    include: { firstAidSection: true }
  })

  // Transform to ConceptReference format
  references = transformToConceptReferences(dbReferences)

  // Store in cache
  firstAidCache.set(cacheKey, references, {
    ttl: 3600000, // 1 hour
    edition: references[0]?.edition
  })

  return NextResponse.json({
    references,
    cached: false,
    timestamp: new Date().toISOString()
  })
}
```

---

## Cache Management Examples

### Example 5: Admin Dashboard - Cache Statistics

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { CacheStats } from '@/lib/first-aid-cache'

export function CacheMetricsDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/first-aid/cache')
      const data = await response.json()
      setStats(data.stats)
    }

    // Fetch immediately
    fetchStats()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) return <div>Loading cache stats...</div>

  const hitRatePercent = (stats.hitRate * 100).toFixed(1)
  const cacheUtilization = (stats.size / stats.maxSize * 100).toFixed(0)

  return (
    <div className="cache-metrics">
      <h3>First Aid Cache Performance</h3>

      <MetricCard
        label="Hit Rate"
        value={`${hitRatePercent}%`}
        status={stats.hitRate > 0.6 ? 'good' : 'warning'}
      />

      <MetricCard
        label="Cache Size"
        value={`${stats.size}/${stats.maxSize}`}
        subtitle={`${cacheUtilization}% utilized`}
      />

      <MetricCard
        label="Memory Usage"
        value={stats.memoryUsageEstimate}
        status="good"
      />

      <MetricCard
        label="Evictions"
        value={stats.evictions.toString()}
        status={stats.evictions > 50 ? 'warning' : 'good'}
      />

      <div className="cache-actions">
        <button onClick={() => handleClearCache()}>
          Clear Cache
        </button>
        <button onClick={() => handleResetStats()}>
          Reset Statistics
        </button>
      </div>
    </div>
  )
}

async function handleClearCache() {
  if (!confirm('Clear entire cache? This will affect all users.')) return

  await fetch('/api/first-aid/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear' })
  })

  toast.success('Cache cleared successfully')
}

async function handleResetStats() {
  await fetch('/api/first-aid/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resetStats' })
  })

  toast.success('Statistics reset')
}
```

### Example 6: Guideline Editor - Auto-Invalidation

```typescript
async function saveGuideline(guidelineId: string, changes: GuidelineChanges) {
  try {
    // 1. Save changes to database
    await fetch(`/api/guidelines/${guidelineId}`, {
      method: 'PATCH',
      body: JSON.stringify(changes)
    })

    // 2. Invalidate cache for this guideline
    await fetch('/api/first-aid/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'invalidateGuideline',
        guidelineId
      })
    })

    // 3. Show success message
    toast.success('Guideline saved and cache updated')

  } catch (error) {
    toast.error('Failed to save guideline')
  }
}
```

---

## Advanced Patterns

### Example 7: Prefetching Adjacent Positions

```typescript
import { prefetchAdjacentPositions } from '@/lib/first-aid-cache'

async function prefetchReferences(
  lectureId: string,
  currentPosition: number
) {
  // Prefetch references for positions ahead
  await prefetchAdjacentPositions(
    lectureId,
    currentPosition,
    async (position) => {
      const response = await fetch(
        `/api/first-aid/mappings/${lectureId}?position=${position}`
      )
      const data = await response.json()
      return data.mappings
    }
  )
}

// Use in scroll handler
const handleScroll = useCallback(
  debounce(async (position: number) => {
    setScrollPosition(position)

    // Prefetch ahead for smoother scrolling
    await prefetchReferences(lectureId, position)
  }, 300),
  [lectureId]
)
```

### Example 8: Stable Guideline Detection

```typescript
import { isStableGuideline } from '@/lib/first-aid-cache'

async function cacheGuidelineReferences(
  guidelineId: string,
  references: ConceptReference[]
) {
  // Fetch guideline metadata
  const guideline = await getGuideline(guidelineId)

  // Determine if guideline is stable (not edited in 30 days)
  const stable = isStableGuideline(guideline.lastEditedAt)

  // Cache with appropriate TTL
  firstAidCache.set(
    firstAidCache.generateKey({ type: 'guideline', guidelineId }),
    references,
    {
      isStableGuideline: stable, // Uses 24-hour TTL if true
      edition: references[0]?.edition
    }
  )
}
```

---

## Testing Examples

### Example 9: Unit Test for Cache Integration

```typescript
import { firstAidCache } from '@/lib/first-aid-cache'

describe('First Aid Cache Integration', () => {
  beforeEach(() => {
    firstAidCache.clear()
    firstAidCache.resetStats()
  })

  it('should cache references on first request', async () => {
    const conceptId = 'test-concept-123'
    const key = firstAidCache.generateKey({
      type: 'concept',
      conceptId
    })

    // First call - cache miss
    const result1 = firstAidCache.get(key)
    expect(result1).toBeNull()

    // Simulate API call and caching
    const mockReferences = [createMockReference()]
    firstAidCache.set(key, mockReferences)

    // Second call - cache hit
    const result2 = firstAidCache.get(key)
    expect(result2).toEqual(mockReferences)

    // Verify statistics
    const stats = firstAidCache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBe(0.5)
  })

  it('should invalidate cache on guideline update', () => {
    const guidelineId = 'guide-123'

    // Cache some references
    const key1 = firstAidCache.generateKey({
      type: 'guideline',
      guidelineId
    })
    const key2 = firstAidCache.generateKey({
      type: 'guideline',
      guidelineId,
      section: 'cardiology'
    })

    firstAidCache.set(key1, [createMockReference()])
    firstAidCache.set(key2, [createMockReference()])

    expect(firstAidCache.has(key1)).toBe(true)
    expect(firstAidCache.has(key2)).toBe(true)

    // Invalidate guideline
    firstAidCache.invalidateGuideline(guidelineId)

    expect(firstAidCache.has(key1)).toBe(false)
    expect(firstAidCache.has(key2)).toBe(false)
  })
})
```

---

## Common Patterns

### Pattern 1: API Route with Cache

```typescript
// Standard pattern for all First Aid API routes
export async function GET(request: NextRequest) {
  const key = generateAppropriateKey(request)

  // Try cache
  let data = firstAidCache.get(key)

  if (data) {
    return NextResponse.json({ data, cached: true })
  }

  // Fetch from DB
  data = await fetchFromDatabase()

  // Store in cache
  firstAidCache.set(key, data)

  return NextResponse.json({ data, cached: false })
}
```

### Pattern 2: Component with Cache Awareness

```typescript
function CachedComponent({ resourceId }: Props) {
  const [data, setData] = useState(null)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    fetch(`/api/resource/${resourceId}`)
      .then(res => res.json())
      .then(json => {
        setData(json.data)
        setFromCache(json.cached)
      })
  }, [resourceId])

  return (
    <div>
      {fromCache && <CacheBadge />}
      {/* render data */}
    </div>
  )
}
```

### Pattern 3: Invalidation on Mutation

```typescript
async function mutateResource(id: string, changes: any) {
  // 1. Perform mutation
  await updateDatabase(id, changes)

  // 2. Invalidate cache
  await fetch('/api/first-aid/cache', {
    method: 'POST',
    body: JSON.stringify({
      action: 'invalidateGuideline',
      guidelineId: id
    })
  })

  // 3. Refetch or optimistically update
  invalidateQueries(['resource', id])
}
```

---

## Best Practices

1. **Always use `generateKey()`** - Don't manually construct cache keys
2. **Invalidate after mutations** - Keep cache fresh
3. **Monitor hit rate** - Target >60% in production
4. **Use appropriate TTLs** - Match content stability
5. **Show cache metrics** - In dev mode for debugging
6. **Handle cache misses gracefully** - Don't assume cache hits
7. **Test cache integration** - Unit and integration tests

---

## Troubleshooting

### Low Cache Hit Rate

```typescript
// Check statistics
const stats = await fetch('/api/first-aid/cache').then(r => r.json())
console.log('Hit rate:', stats.hitRate)

// Possible fixes:
// 1. Increase TTL for stable content
// 2. Review key generation logic
// 3. Check if invalidation is too aggressive
```

### Cache Not Working

```typescript
// Verify cache is being used
const key = firstAidCache.generateKey({ type: 'concept', conceptId: 'test' })
firstAidCache.set(key, [])
const result = firstAidCache.get(key)
console.log('Cache working:', result !== null)
```

### Memory Issues

```typescript
// Check memory usage
const stats = firstAidCache.getStats()
console.log('Memory:', stats.memoryUsageEstimate)
console.log('Size:', stats.size, '/', stats.maxSize)

// If memory is high:
// 1. Reduce maxSize
// 2. Reduce TTLs
// 3. Clear cache more frequently
```

---

**Last Updated**: 2025-10-17
**For Questions**: See `/apps/web/src/lib/README-first-aid-cache.md`
