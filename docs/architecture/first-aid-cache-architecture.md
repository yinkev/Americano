# First Aid Cache Architecture

**Story 3.3 AC#3**: Caching Layer Implementation
**Date**: 2025-10-17

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Scroll Event                           │
│                     Position: 1500px                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend Component (React)                         │
│  - Debounce scroll events (300ms)                              │
│  - Generate API request with position parameter                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│     API: GET /api/first-aid/mappings/[lectureId]?position=1500 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FirstAidCache.generateKey()                    │
│  Input: { type: 'scroll', guidelineId: 'lec-123', position: 1500 }│
│  Output: "scroll:lec-123:1500" (rounded to 1500)               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Cache Lookup (2.3ms avg)                       │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │   Cache Hit (79%)    │         │  Cache Miss (21%)    │    │
│  │  - Get from Map      │         │  - Query Database    │    │
│  │  - Update LRU order  │         │  - Transform data    │    │
│  │  - Return instantly  │         │  - Store in cache    │    │
│  │  - Track metrics     │         │  - Return result     │    │
│  └──────────┬───────────┘         └──────────┬───────────┘    │
│             │                                │                 │
│             └────────────────┬───────────────┘                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Return Response to Client                    │
│  {                                                              │
│    mappings: [...],                                             │
│    cached: true,                                                │
│    cacheHitTime: "2.45ms"   // OR dbFetchTime: "67ms"          │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cache Data Structure

```
FirstAidCache
├── cache: Map<string, CachedReference>
│   ├── "scroll:lec-123:1500" → {
│   │     references: [...],
│   │     cachedAt: 1697558400000,
│   │     ttl: 1800000,  // 30 min
│   │     hitCount: 5,
│   │     lastAccessedAt: 1697559000000
│   │   }
│   ├── "concept:abc-123" → { ... }
│   └── "guideline:guide-456:section:cardiology" → { ... }
│
├── accessOrder: string[]
│   └── ["scroll:lec-123:1500", "concept:abc-123", ...]  // LRU order
│
└── stats: {
      hits: 142,
      misses: 38,
      evictions: 5
    }
```

---

## Cache Key Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    Cache Key Types                           │
└──────────────────────────────────────────────────────────────┘

1. CONCEPT-BASED
   Pattern: concept:{conceptId}
   Example: "concept:abc-123"
   TTL: 1 hour
   Use case: All references for a specific medical concept

2. GUIDELINE SECTION
   Pattern: guideline:{id}:section:{name}
   Example: "guideline:guide-456:section:cardiology"
   TTL: 1 hour
   Use case: References for specific guideline section

3. SCROLL POSITION
   Pattern: scroll:{id}:{roundedPosition}
   Example: "scroll:guide-456:1200" (1250 → 1200)
   TTL: 30 minutes
   Use case: References visible at scroll position

4. EDITION-SPECIFIC
   Pattern: {any}:edition:{year}
   Example: "concept:abc-123:edition:2026"
   TTL: Varies
   Use case: Version-specific content
```

---

## LRU Eviction Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Cache State: 100/100 entries (FULL)                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  New entry arrives: key-101                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Access Order (oldest → newest):                             │
│  [key-1, key-2, key-3, ..., key-99, key-100]                │
│   ↑                                                          │
│   └── Least Recently Used (LRU)                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Evict key-1 (oldest)                                        │
│  - Delete from cache Map                                     │
│  - Remove from accessOrder array                            │
│  - Increment evictions counter                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Insert key-101                                              │
│  - Add to cache Map                                          │
│  - Append to accessOrder array (newest)                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  New Access Order:                                           │
│  [key-2, key-3, ..., key-100, key-101]                      │
│                                  ↑                           │
│                                  └── Most Recently Used      │
└─────────────────────────────────────────────────────────────┘
```

---

## Cache Invalidation Flow

```
┌─────────────────────────────────────────────────────────────┐
│          Invalidation Trigger Events                         │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ New Edition  │   │ Guideline    │   │ Concept      │
│ Upload       │   │ Edit         │   │ Update       │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│     POST /api/first-aid/cache                       │
│     { action: "invalidate...", ... }                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  FirstAidCache.invalidate{Edition|Guideline|Concept}│
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Pattern Matching: Find all keys matching pattern   │
│  - Edition: entry.edition === "2026"                │
│  - Guideline: key.startsWith("guideline:guide-123") │
│  - Concept: key.startsWith("concept:abc-123")       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Delete matched entries                             │
│  - Remove from cache Map                            │
│  - Remove from accessOrder                          │
│  - Log invalidation count                           │
└─────────────────────────────────────────────────────┘
```

---

## TTL and Cleanup

```
┌─────────────────────────────────────────────────────┐
│  Automatic Cleanup Timer (every 5 minutes)          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Check all cache entries                            │
│  For each entry:                                    │
│    if (now - cachedAt > ttl) {                      │
│      mark for deletion                              │
│    }                                                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Example Entry:                                     │
│    cachedAt: 1697558400000 (timestamp)              │
│    ttl: 3600000 (1 hour)                           │
│    now: 1697562000000                              │
│                                                     │
│    expired = (1697562000000 - 1697558400000)       │
│             > 3600000                              │
│             = 3600000 > 3600000                    │
│             = true → DELETE                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Remove expired entries                             │
│  Log cleanup results                                │
└─────────────────────────────────────────────────────┘
```

---

## Performance Monitoring

```
┌─────────────────────────────────────────────────────┐
│  GET /api/first-aid/cache                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  FirstAidCache.getStats()                           │
│                                                     │
│  Calculate:                                         │
│  - Hit rate = hits / (hits + misses)               │
│  - Avg TTL = Σ(entry.ttl) / cache.size            │
│  - Avg hit count = Σ(entry.hitCount) / cache.size │
│  - Memory estimate = cache.size × 2.5KB            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Return Statistics:                                 │
│  {                                                  │
│    hits: 142,                                       │
│    misses: 38,                                      │
│    hitRate: 0.789,        // 78.9%                 │
│    size: 67,                                        │
│    maxSize: 100,                                    │
│    evictions: 5,                                    │
│    avgTTL: 3600000,       // 1 hour                │
│    avgHitCount: 2.12,                               │
│    memoryUsageEstimate: "167.50 KB"                │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────┐
│              Existing System Components              │
└─────────────────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ First Aid│   │ Knowledge│   │ Semantic │
│  Mapper  │   │  Graph   │   │  Search  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  FirstAidCache       │
         │  - Stores mappings   │
         │  - Reduces DB load   │
         │  - Improves UX       │
         └──────────────────────┘
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Author**: Claude (DEV Agent)
