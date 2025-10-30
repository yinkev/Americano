# Integration Guide: Agent 16 Enhancements

## 🎯 Quick Start

This guide shows how to integrate the new components into your existing pages.

---

## 📍 Graph Page Integration

### **Add Graph Controls to Graph Client**

```typescript
// /src/app/graph/graph-client.tsx
import { GraphControls } from '@/components/graph/graph-controls'
import { useGraphStore } from '@/stores'

export default function GraphPageClient() {
  const graphRef = useRef<any>()

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1.2, 300)
    }
  }

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(0.8, 300)
    }
  }

  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1, 300)
      graphRef.current.centerAt(0, 0, 300)
    }
  }

  const handleFitToCanvas = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 20)
    }
  }

  const handleExport = async (format: 'png' | 'svg' | 'json') => {
    // Export logic handled by GraphExport component
    console.log(`Exporting as ${format}`)
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar with controls */}
      <aside className="w-80 p-4 border-r overflow-y-auto">
        <GraphControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToCanvas={handleFitToCanvas}
          onExport={handleExport}
        />
      </aside>

      {/* Graph visualization */}
      <main className="flex-1">
        <KnowledgeGraph ref={graphRef} {...graphProps} />
      </main>
    </div>
  )
}
```

---

## 🔍 Search Page Integration

### **Add Search History to Search Page**

```typescript
// /src/app/search/page.tsx
'use client'

import { SearchHistory } from '@/components/search/search-history'
import { useSearchStore } from '@/stores'

export default function SearchPage() {
  const { setQuery, executeSearch, addRecentSearch } = useSearchStore()

  const handleSelectSearch = (query: string) => {
    setQuery(query)
    executeSearch()
  }

  return (
    <div className="flex gap-6 p-6">
      {/* Main search area */}
      <div className="flex-1">
        <SearchBar {...searchProps} />
        <SearchResults {...resultProps} />
      </div>

      {/* Sidebar with history */}
      <aside className="w-80">
        <SearchHistory onSelectSearch={handleSelectSearch} />
      </aside>
    </div>
  )
}
```

### **Track Search History**

```typescript
// After successful search execution
const results = await fetch(`/api/search?q=${query}`)
const data = await results.json()

// Add to recent searches
addRecentSearch({
  query,
  resultCount: data.totalResults,
  filters: { type: currentType, courseId: selectedCourse }
})
```

---

## 📊 Search Analytics Integration

### **Use Search Insights Dashboard**

```typescript
// /src/app/search/analytics/page.tsx
import { SearchInsightsDashboard } from '@/components/search/search-insights-dashboard'

export default function SearchAnalyticsPage() {
  const handleQueryClick = (query: string) => {
    // Navigate to search with this query
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <SearchInsightsDashboard
      timeWindowDays={30}
      onQueryClick={handleQueryClick}
    />
  )
}
```

---

## 📚 Library Page Integration

### **Add Grid View and View Toggle**

```typescript
// /src/app/library/page.tsx
'use client'

import { LectureGrid } from '@/components/library/lecture-grid'
import { ViewModeToggle } from '@/components/library/view-mode-toggle'
import { useLibraryStore, selectViewMode } from '@/stores'

export default function LibraryPage() {
  const viewMode = useLibraryStore(selectViewMode)
  const [lectures, setLectures] = useState([])

  const handleLectureClick = (lecture: Lecture) => {
    router.push(`/library/lectures/${lecture.id}`)
  }

  const handleLectureAction = (action: string, lecture: Lecture) => {
    switch (action) {
      case 'view':
        router.push(`/library/lectures/${lecture.id}`)
        break
      case 'edit':
        // Open edit dialog
        break
      case 'delete':
        // Open delete confirmation
        break
    }
  }

  return (
    <div className="p-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Library</h1>
        <ViewModeToggle />
      </div>

      {/* Render based on view mode */}
      {viewMode === 'grid' ? (
        <LectureGrid
          lectures={lectures}
          onLectureClick={handleLectureClick}
          onLectureAction={handleLectureAction}
        />
      ) : (
        <LectureList lectures={lectures} {...listProps} />
      )}
    </div>
  )
}
```

---

## 🔗 URL State Sync Examples

### **Graph Page**

```typescript
// Sync layout with URL
const [searchParams, setSearchParams] = useSearchParams()
const layout = useGraphStore(selectGraphLayout)

useEffect(() => {
  const urlLayout = searchParams.get('layout')
  if (urlLayout && urlLayout !== layout) {
    setLayout(urlLayout as GraphLayout)
  }
}, [])

const handleLayoutChange = (newLayout: GraphLayout) => {
  setLayout(newLayout)
  setSearchParams({ ...Object.fromEntries(searchParams), layout: newLayout })
}
```

### **Search Page**

```typescript
// Sync search query with URL
const [searchParams, setSearchParams] = useSearchParams()
const query = useSearchStore(selectSearchStoreQuery)

useEffect(() => {
  const urlQuery = searchParams.get('q')
  if (urlQuery && urlQuery !== query) {
    setQuery(urlQuery)
  }
}, [])

const handleSearch = (newQuery: string) => {
  setQuery(newQuery)
  router.replace(`/search?q=${encodeURIComponent(newQuery)}`)
}
```

### **Library Page**

```typescript
// Sync view mode with URL
const [searchParams, setSearchParams] = useSearchParams()
const viewMode = useLibraryStore(selectViewMode)

useEffect(() => {
  const urlView = searchParams.get('view') as LibraryViewMode
  if (urlView && urlView !== viewMode) {
    setViewMode(urlView)
  }
}, [])

const handleViewModeChange = (mode: LibraryViewMode) => {
  setViewMode(mode)
  const params = new URLSearchParams(searchParams)
  params.set('view', mode)
  router.replace(`/library?${params.toString()}`)
}
```

---

## 🎨 Styling Integration

### **Ensure Tailwind Config Includes**

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)'],
      },
      // Your existing theme extensions
    },
  },
}
```

### **Import Framer Motion CSS (if not already)**

```typescript
// /src/app/layout.tsx
import 'framer-motion/dist/framer-motion.css'
```

---

## 🧪 Testing Integration

### **Test Store Updates**

```typescript
import { renderHook, act } from '@testing-library/react'
import { useGraphStore } from '@/stores'

test('graph store updates layout', () => {
  const { result } = renderHook(() => useGraphStore())

  act(() => {
    result.current.setLayout('hierarchical')
  })

  expect(result.current.preferences.layout).toBe('hierarchical')
})
```

### **Test Component Integration**

```typescript
import { render, screen } from '@testing-library/react'
import { GraphControls } from '@/components/graph/graph-controls'

test('renders graph controls', () => {
  render(<GraphControls />)
  expect(screen.getByText('Graph Controls')).toBeInTheDocument()
})
```

---

## 🚀 Migration Checklist

- [ ] Install dependencies (none required - all use existing deps)
- [ ] Import new stores in pages
- [ ] Add GraphControls to graph page sidebar
- [ ] Add SearchHistory to search page sidebar
- [ ] Replace search analytics with SearchInsightsDashboard
- [ ] Add ViewModeToggle to library header
- [ ] Add LectureGrid for grid view
- [ ] Implement URL state sync for all pages
- [ ] Test all new features
- [ ] Update navigation links
- [ ] Document component usage for team

---

## 📦 Package.json Check

Ensure these are in your dependencies:
```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "framer-motion": "^12.23.24",
    "html-to-image": "^1.11.13",
    "next": "^15.5.5",
    "react": "^19.2.0",
    "@radix-ui/*": "latest"
  }
}
```

All packages are already installed! No additional dependencies needed.

---

## 🎓 Best Practices

### **1. Store Usage**
- Always use selectors for optimal performance
- Use destructured actions for cleaner code
- Keep store logic pure and simple

### **2. Component Composition**
- Keep components small and focused
- Use composition over prop drilling
- Leverage children props for flexibility

### **3. Error Handling**
- Always wrap async operations in try-catch
- Provide fallback UI for errors
- Log errors for debugging

### **4. Performance**
- Use React.memo for expensive components
- Debounce search inputs
- Virtualize long lists

---

## 🤝 Support

For questions or issues:
1. Check component JSDoc comments
2. Review store types and selectors
3. Refer to Agent 16 enhancements doc
4. Test in isolation before integration

Happy coding! 🚀
