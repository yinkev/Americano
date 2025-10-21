# Developer Guide: First Aid Contextual Loading

**Last Updated:** 2025-10-17

---

## Quick Start

### 1. Basic Implementation (5 minutes)

**Add to your lecture page component:**

```tsx
// app/lectures/[id]/page.tsx
import { FirstAidCrossReference } from '@/components/first-aid/first-aid-cross-reference'

export default function LecturePage({ params }: { params: { id: string } }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2">
        <LectureContent lectureId={params.id} />
      </div>

      {/* First Aid references sidebar */}
      <div className="lg:col-span-1">
        <FirstAidCrossReference
          lectureId={params.id}
          enableContextualLoading={true}
        />
      </div>
    </div>
  )
}
```

**Add section IDs to your lecture content:**

```tsx
// components/lecture-content.tsx
function LectureContent({ lectureId }: { lectureId: string }) {
  return (
    <div className="lecture-content">
      <section data-section-id="introduction">
        <h2>Introduction</h2>
        <p>Myocardial infarction overview...</p>
      </section>

      <section data-section-id="pathophysiology">
        <h2>Pathophysiology</h2>
        <p>Coronary artery occlusion leads to...</p>
      </section>

      <section data-section-id="clinical-features">
        <h2>Clinical Features</h2>
        <p>Chest pain, dyspnea, diaphoresis...</p>
      </section>
    </div>
  )
}
```

**That's it!** Scroll through your lecture and watch First Aid references update automatically.

---

## Advanced Usage

### Custom Hook Integration

For more control, use the hook directly:

```tsx
'use client'

import { useFirstAidContext } from '@/hooks/use-first-aid-context'

export function CustomLecturePage({ lectureId }: { lectureId: string }) {
  const {
    references,
    loading,
    error,
    currentSection,
    reload,
    clearCache,
  } = useFirstAidContext(lectureId, {
    enabled: true,
    debounceMs: 300,        // Faster response (more API calls)
    prefetchLimit: 10,      // Prefetch more sections
    cacheTTL: 10 * 60 * 1000, // 10-minute cache
  })

  return (
    <div>
      {/* Custom UI */}
      <div className="reference-header">
        <h3>First Aid References</h3>
        <span>Section: {currentSection || 'None'}</span>
        <button onClick={reload}>Refresh</button>
      </div>

      {error && (
        <div className="error">
          Failed to load: {error.message}
        </div>
      )}

      {loading ? (
        <div>Loading references...</div>
      ) : (
        <div className="references">
          {references.map((ref) => (
            <div key={ref.id}>
              <h4>{ref.section}</h4>
              <p>{ref.snippet}</p>
              <span>Page {ref.pageNumber}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Configuration Options

### Hook Options

```typescript
interface UseFirstAidContextOptions {
  /** Enable/disable contextual loading (default: true) */
  enabled?: boolean

  /** Scroll debounce delay in ms (default: 500) */
  debounceMs?: number

  /** Number of references to prefetch per section (default: 5) */
  prefetchLimit?: number

  /** Distance threshold for prefetching adjacent sections in px (default: 300) */
  prefetchThreshold?: number

  /** Cache TTL in ms (default: 300000 = 5 minutes) */
  cacheTTL?: number
}
```

### Component Props

```typescript
interface FirstAidCrossReferenceProps {
  /** Lecture/content ID (required) */
  lectureId: string

  /** Enable contextual loading (default: true) */
  enableContextualLoading?: boolean

  /** Show current section indicator (default: true) */
  showSectionIndicator?: boolean

  /** Custom CSS class */
  className?: string
}
```

---

## Performance Tuning

### For Fast, Responsive Loading (More API Calls)

```tsx
useFirstAidContext(lectureId, {
  debounceMs: 200,         // Quick response
  prefetchThreshold: 500,  // Prefetch earlier
  cacheTTL: 2 * 60 * 1000, // Shorter cache (fresher data)
})
```

**Use Case:** Short lectures, high-quality network

### For Efficient, Reduced API Calls

```tsx
useFirstAidContext(lectureId, {
  debounceMs: 1000,           // Wait longer before loading
  prefetchLimit: 3,           // Fewer prefetch requests
  cacheTTL: 15 * 60 * 1000,   // Longer cache
})
```

**Use Case:** Long lectures, slower networks, mobile devices

### For Maximum Prefetching (Best UX)

```tsx
useFirstAidContext(lectureId, {
  prefetchLimit: 10,          // Prefetch many sections
  prefetchThreshold: 800,     // Prefetch very early
})
```

**Use Case:** Desktop, fast network, engaged users

---

## API Usage

### Direct API Calls

If you need to fetch references without the hook:

```typescript
// Get all references for a lecture
const response = await fetch(
  `/api/first-aid/references?guidelineId=${lectureId}`
)
const data = await response.json()
console.log(data.references)

// Get references for specific section
const response = await fetch(
  `/api/first-aid/references?guidelineId=${lectureId}&section=intro`
)

// Get only high-yield references
const response = await fetch(
  `/api/first-aid/references?guidelineId=${lectureId}&highYieldOnly=true&minConfidence=0.8`
)
```

### Using FirstAidMapper Service

```typescript
import { firstAidMapper } from '@/subsystems/knowledge-graph/first-aid-mapper'

// Map a section of text to First Aid
const references = await firstAidMapper.mapSectionToFirstAid(
  'Myocardial infarction is caused by...',
  'section-123',
  5 // limit
)

// Extract medical concepts from text
const concepts = await firstAidMapper.extractConceptsFromSection(
  'Patient presents with chest pain, dyspnea, and diaphoresis'
)
// Returns: ['chest pain', 'dyspnea', 'myocardial infarction']

// Batch map multiple sections
const sections = [
  { id: 'intro', text: 'Introduction to MI...' },
  { id: 'pathophys', text: 'Pathophysiology of...' },
]
const batchResults = await firstAidMapper.batchMapSectionsToFirstAid(sections)
console.log(batchResults.get('intro'))
```

---

## Common Patterns

### Pattern 1: Mobile Responsive Layout

```tsx
function ResponsiveLecture({ lectureId }: { lectureId: string }) {
  const [showReferences, setShowReferences] = useState(false)

  return (
    <>
      {/* Mobile: Bottom sheet */}
      <div className="lg:hidden">
        <button onClick={() => setShowReferences(!showReferences)}>
          Toggle First Aid
        </button>
        {showReferences && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
            <FirstAidCrossReference lectureId={lectureId} />
          </div>
        )}
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block">
        <FirstAidCrossReference lectureId={lectureId} />
      </div>
    </>
  )
}
```

### Pattern 2: Tabbed Interface

```tsx
function TabbedLecture({ lectureId }: { lectureId: string }) {
  const [activeTab, setActiveTab] = useState<'content' | 'references'>('content')
  const { references, currentSection } = useFirstAidContext(lectureId)

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab('content')}>
          Lecture Content
        </button>
        <button onClick={() => setActiveTab('references')}>
          First Aid ({references.length})
        </button>
      </div>

      {activeTab === 'content' && <LectureContent lectureId={lectureId} />}
      {activeTab === 'references' && (
        <FirstAidCrossReference lectureId={lectureId} />
      )}
    </div>
  )
}
```

### Pattern 3: Inline References

```tsx
function InlineLecture({ lectureId }: { lectureId: string }) {
  const { references } = useFirstAidContext(lectureId)

  return (
    <div className="lecture-content">
      <section data-section-id="intro">
        <h2>Introduction</h2>
        <p>Content here...</p>

        {/* Show references inline after each section */}
        {references.length > 0 && (
          <div className="inline-references mt-4 p-4 bg-blue-50 rounded">
            <h4 className="text-sm font-semibold mb-2">
              Related First Aid Content:
            </h4>
            {references.slice(0, 2).map((ref) => (
              <div key={ref.id} className="text-sm">
                <a href={`/first-aid/sections/${ref.id}`}>
                  {ref.section} (p. {ref.pageNumber})
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

### Pattern 4: Tooltip/Popover References

```tsx
function TooltipReferences({ lectureId }: { lectureId: string }) {
  const { references } = useFirstAidContext(lectureId)

  return (
    <div className="lecture-content">
      <p>
        Myocardial infarction
        {references.find((r) => r.section.includes('Infarction')) && (
          <Popover>
            <PopoverTrigger>
              <sup className="text-blue-500 cursor-pointer ml-1">
                [FA]
              </sup>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-sm">
                <h4>First Aid Reference</h4>
                <p>Myocardial Infarction (p. 315)</p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </p>
    </div>
  )
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// Add to your component
useEffect(() => {
  console.log('[FirstAid] References:', references)
  console.log('[FirstAid] Current section:', currentSection)
  console.log('[FirstAid] Loading:', loading)
}, [references, currentSection, loading])
```

### Check Section Detection

```typescript
// Verify sections are being detected
useEffect(() => {
  const sections = document.querySelectorAll('[data-section-id]')
  console.log('Found sections:', sections.length)
  sections.forEach((section) => {
    console.log('Section ID:', section.getAttribute('data-section-id'))
  })
}, [])
```

### Monitor API Calls

```typescript
// Check cache effectiveness
const { references, currentSection } = useFirstAidContext(lectureId)

useEffect(() => {
  console.log(`[Cache] Section changed to: ${currentSection}`)
  console.time('reference-load')
}, [currentSection])

useEffect(() => {
  if (!loading && references.length > 0) {
    console.timeEnd('reference-load')
    console.log('[Cache] Loaded from cache:', references.length)
  }
}, [loading, references])
```

### Test Network Failures

```typescript
// Simulate offline mode
if (typeof window !== 'undefined') {
  // Force offline in DevTools: Application > Service Workers > Offline
  window.addEventListener('online', () => reload())
  window.addEventListener('offline', () => console.log('Offline mode'))
}
```

---

## Troubleshooting

### Problem: References never load

**Check:**
1. Are `data-section-id` attributes present?
   ```typescript
   const sections = document.querySelectorAll('[data-section-id]')
   console.log('Sections found:', sections.length)
   ```

2. Is IntersectionObserver supported?
   ```typescript
   if (!window.IntersectionObserver) {
     console.error('IntersectionObserver not supported')
   }
   ```

3. Is API endpoint accessible?
   ```bash
   curl http://localhost:3000/api/first-aid/references?guidelineId=test
   ```

### Problem: Too many API calls

**Solutions:**
1. Increase debounce: `debounceMs: 1000`
2. Reduce prefetch: `prefetchLimit: 3`
3. Check for duplicate components

### Problem: Stale references

**Solutions:**
1. Clear cache: `clearCache()`
2. Reduce cache TTL: `cacheTTL: 60000` (1 minute)
3. Call `reload()` after content updates

---

## Best Practices

### 1. Section ID Naming

✅ **Good:**
```html
<section data-section-id="intro">
<section data-section-id="pathophysiology">
<section data-section-id="clinical-features">
```

❌ **Bad:**
```html
<section data-section-id="1">
<section data-section-id="section-a">
<section data-section-id="untitled">
```

### 2. Section Granularity

✅ **Good:** One section per topic (~200-500 words)
❌ **Bad:** One massive section for entire lecture
❌ **Bad:** One section per paragraph (too granular)

### 3. Performance

✅ **Good:** Use default settings for most cases
✅ **Good:** Increase `debounceMs` for mobile
❌ **Bad:** Set `debounceMs: 0` (excessive API calls)

### 4. Error Handling

✅ **Good:** Show user-friendly error messages
✅ **Good:** Provide retry/reload button
❌ **Bad:** Silently fail without feedback

---

## Testing Checklist

Before deploying:

- [ ] Test scroll through entire lecture
- [ ] Verify references update for each section
- [ ] Test cache effectiveness (scroll back to previous section)
- [ ] Test offline mode (network failure)
- [ ] Test mobile responsive layout
- [ ] Test with slow 3G network (Chrome DevTools)
- [ ] Verify no console errors
- [ ] Check performance (no memory leaks)

---

## Support

**Questions?**
- Check `/docs/implementation/first-aid-contextual-loading.md`
- Review Story 3.3 requirements
- Ask in `#americano-dev` Slack channel

**Found a bug?**
- Open GitHub issue with reproduction steps
- Include browser/device information
- Attach console logs and network traces
