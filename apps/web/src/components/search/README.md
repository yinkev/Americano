# Search Components - Documentation

## Story 3.6: Advanced Search and Discovery Features

This directory contains all search-related components for the Americano medical education platform, implementing visual search with knowledge graph integration.

---

## Components Overview

### 1. SearchGraphView (Task 4: Visual Search)

**Location:** `search-graph-view.tsx`

**Purpose:** Interactive graph visualization of search results using React Flow, allowing students to explore relationships between medical concepts visually.

#### Features

- ✅ **Color-coded nodes by content type:**
  - Blue (OKLCH 240°): Lecture content
  - Green (OKLCH 140°): Learning objectives
  - Purple (OKLCH 290°): Flashcards
  - Orange (OKLCH 50°): Concepts
  - Red (OKLCH 20°): High-yield/First Aid content

- ✅ **Node size based on relevance:**
  - Size range: 60px (low) to 120px (high)
  - Proportional to similarity score (0-1)

- ✅ **Result clustering:**
  - Group by: Course or Topic
  - Visual cluster regions with labels
  - Expandable/collapsible clusters
  - Automatic clustering beyond 200 nodes

- ✅ **Graph navigation:**
  - Zoom controls (in, out, fit view)
  - Pan and drag
  - MiniMap for overview
  - Filter by source type/course
  - Toggle clustering mode

- ✅ **Expand search from graph:**
  - Click node → "Show Related" button
  - Expands graph with related concepts
  - Animated node expansion
  - Max 200 nodes (cluster beyond that)

#### Usage

```tsx
import SearchGraphView from '@/components/search/search-graph-view'

function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([])

  const handleNodeClick = (nodeId: string) => {
    console.log('Selected node:', nodeId)
  }

  const handleExpandSearch = async (nodeId: string, type: string) => {
    // Fetch related content
    const related = await fetchRelatedContent(nodeId, type)
    setResults([...results, ...related])
  }

  return (
    <SearchGraphView
      results={results}
      onNodeClick={handleNodeClick}
      onExpandSearch={handleExpandSearch}
      maxNodes={200}
    />
  )
}
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `results` | `SearchResult[]` | Yes | - | Array of search results to visualize |
| `onNodeClick` | `(nodeId: string) => void` | No | - | Callback when node is clicked |
| `onExpandSearch` | `(nodeId: string, type: string) => void` | No | - | Callback to expand search from node |
| `filters` | `{ sourceTypes: string[], courses: string[] }` | No | - | Active filters |
| `onFilterChange` | `(filters) => void` | No | - | Callback when filters change |
| `maxNodes` | `number` | No | `200` | Maximum nodes before clustering |
| `className` | `string` | No | - | Additional CSS classes |

#### Performance

- **50 nodes:** Smooth (60 FPS target)
- **100 nodes:** Acceptable (30-60 FPS)
- **200 nodes:** Maximum (clustering active)
- **500+ nodes:** Auto-limit to 200 with warning

See: `__tests__/search-graph-performance.md` for detailed metrics.

#### Accessibility

- ✅ **Keyboard navigation:**
  - `↑↓`: Navigate between nodes
  - `Enter`: Expand search from selected node
  - `Esc`: Deselect node

- ✅ **ARIA labels:**
  - Graph region labeled
  - Nodes have descriptive labels
  - Controls announce actions

- ✅ **Touch support:**
  - Pinch to zoom (mobile)
  - Two-finger pan (mobile)
  - Single tap to select

---

### 2. SearchResults (Enhanced)

**Location:** `search-results.tsx`

**Purpose:** Main search results display with list/graph view toggle.

#### Features

- ✅ List view with pagination
- ✅ Graph view with SearchGraphView
- ✅ View mode toggle (List/Graph)
- ✅ Result count and status
- ✅ Loading states
- ✅ Empty state handling

#### Usage

```tsx
import { SearchResults } from '@/components/search/search-results'

function SearchPage() {
  return (
    <SearchResults
      results={searchResults}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      searchQuery={query}
      onPageChange={setCurrentPage}
      onResultClick={handleResultClick}
      onExpandSearch={handleExpandSearch}
    />
  )
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `results` | `SearchResult[]` | Yes | Search results array |
| `isLoading` | `boolean` | No | Loading state |
| `currentPage` | `number` | No | Current page number |
| `totalPages` | `number` | No | Total page count |
| `searchQuery` | `string` | No | Query for highlighting |
| `onPageChange` | `(page: number) => void` | No | Page change handler |
| `onResultClick` | `(result: SearchResult) => void` | No | Result click handler |
| `onExpandSearch` | `(nodeId: string, type: string) => void` | No | Expand search handler |

---

### 3. SearchResultItem

**Location:** `search-result-item.tsx`

**Purpose:** Individual search result card with highlighting.

#### Features

- Syntax highlighting for matched terms
- Source attribution (lecture, course, page)
- Relevance score visualization
- High-yield badges
- Metadata display (chunk count, complexity)

---

### 4. SearchBar

**Location:** `search-bar.tsx`

**Purpose:** Search input with keyboard shortcuts.

#### Features

- Auto-focus on mount
- Cmd/Ctrl+K shortcut
- Enter to search
- Clear button
- Loading indicator

---

### 5. SearchAutocomplete

**Location:** `search-autocomplete.tsx`

**Purpose:** Autocomplete dropdown for search suggestions (Task 2).

#### Features (from Story 3.6 Task 2)

- Medical terminology suggestions
- Previous search history
- Keyboard navigation (↑↓ arrows)
- Debounced API calls (150ms)
- Highlighted matches

---

### 6. SearchFilters

**Location:** `search-filters.tsx`

**Purpose:** Filter sidebar for search refinement.

#### Features

- Filter by source type (lecture, concept, etc.)
- Filter by course
- Filter by date range
- Active filter count badge
- Clear all filters

---

## Search Result Types

```typescript
interface SearchResult {
  id: string
  type: "lecture" | "objective" | "card" | "concept"
  title: string
  snippet: string
  source: {
    lectureTitle?: string
    courseName?: string
    courseCode?: string
    pageNumber?: number
  }
  similarity: number // 0-1 relevance score
  metadata?: {
    chunkCount?: number
    objectiveCount?: number
    cardCount?: number
    complexity?: string
    isHighYield?: boolean
  }
}
```

---

## Graph Data Structures

### Node Data

```typescript
type SearchNodeData = {
  label: string
  type: 'lecture' | 'objective' | 'card' | 'concept'
  relevance: number // 0-1
  course?: string
  cluster?: string
  metadata?: {
    pageNumber?: number
    complexity?: string
    isHighYield?: boolean
  }
}
```

### Cluster Config

```typescript
type ClusterConfig = {
  id: string
  label: string
  color: string // OKLCH color
  position: { x: number; y: number }
  size: { width: number; height: number }
}
```

---

## Clustering Algorithms

### Course-based Clustering (Default)

Groups results by course name:

```typescript
const clusters = clusterResults(results, 'course')
// Output: Map<courseName, SearchResult[]>
```

### Topic-based Clustering

Groups results by first word of title (simple topic extraction):

```typescript
const clusters = clusterResults(results, 'topic')
// Output: Map<topic, SearchResult[]>
```

### Future: Similarity-based Clustering

Uses embedding similarity for intelligent grouping (Phase 2).

---

## Layout Algorithms

### Current: Force-Directed Circular

- **Algorithm:** Circular layout within clusters
- **Performance:** O(n) for n nodes
- **Best for:** 50-200 nodes

### Future Considerations

1. **Hierarchical Layout (Dagre):** Better for prerequisite relationships
2. **Force-Directed (D3):** Natural clustering based on connections
3. **Grid Layout:** Predictable, accessible, good for many nodes
4. **Radial Layout:** Central concept with related nodes radiating out

---

## Design System Integration

### Colors (Glassmorphism)

All colors use OKLCH for perceptual uniformity:

```typescript
const TYPE_COLORS = {
  lecture: 'oklch(0.6 0.15 240)',    // Blue
  objective: 'oklch(0.6 0.15 140)',  // Green
  card: 'oklch(0.6 0.15 290)',       // Purple
  concept: 'oklch(0.6 0.15 50)',     // Orange
}

const FIRST_AID_COLOR = 'oklch(0.6 0.15 20)' // Red (high-yield)
```

### Backdrop Blur

All panels use consistent glassmorphism:

```css
.panel {
  background-color: oklch(0.98 0.02 240 / 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid oklch(0.85 0.05 240 / 0.3);
}
```

### No Gradients Policy

Per design system: NO gradients allowed. Use solid OKLCH colors only.

---

## Mobile Responsiveness

### Touch Interactions

- **Pan:** Two-finger drag
- **Zoom:** Pinch gesture
- **Select:** Single tap on node
- **Expand:** Tap "Show Related" button

### Viewport Optimization

- **Min touch target:** 44px (iOS standard)
- **Responsive controls:** Stack vertically on mobile
- **Minimap:** Hidden on screens < 768px
- **Legend:** Collapsible on mobile

### Performance on Mobile

- **Target:** 30 FPS on iPhone 12+
- **Strategy:** Reduce node count to 100 max on mobile
- **Fallback:** Auto-switch to list view if graph lags

---

## Integration with Search API

### Expand Search Flow

1. User clicks node in graph
2. `onExpandSearch(nodeId, type)` callback fires
3. Parent component calls API:
   ```typescript
   POST /api/graph/search/expand
   Body: { nodeId, type, depth: 1 }
   ```
4. API returns related concepts
5. New nodes added to graph with animation
6. Graph re-clusters if needed

### API Endpoints Used

- `POST /api/graph/search` - Main semantic search
- `GET /api/graph/autocomplete` - Search suggestions
- `POST /api/graph/search/expand` - Expand from node
- `GET /api/graph/searches/saved` - Saved searches

---

## Testing

### Manual Testing Checklist

See: `__tests__/search-graph-performance.md`

- [ ] 50 node performance
- [ ] 100 node performance
- [ ] 200 node limit
- [ ] Clustering accuracy
- [ ] Expand search functionality
- [ ] Keyboard navigation
- [ ] Touch gestures (mobile)
- [ ] Screen reader compatibility

### Test Data Generation

```typescript
// Mock search results for testing
const mockSearchResult = (id: number): SearchResult => ({
  id: `result-${id}`,
  type: ['lecture', 'concept', 'objective', 'card'][id % 4],
  title: `Medical Concept ${id}`,
  snippet: `This is a snippet for result ${id}...`,
  source: {
    courseName: `Course ${Math.floor(id / 10)}`,
    lectureTitle: `Lecture ${id}`,
    pageNumber: id % 100,
  },
  similarity: Math.random(),
  metadata: {
    isHighYield: id % 10 === 0,
    complexity: ['BASIC', 'INTERMEDIATE', 'ADVANCED'][id % 3],
  },
})

const testResults50 = Array(50).fill(0).map((_, i) => mockSearchResult(i))
const testResults100 = Array(100).fill(0).map((_, i) => mockSearchResult(i))
const testResults200 = Array(200).fill(0).map((_, i) => mockSearchResult(i))
```

---

## Troubleshooting

### Graph Not Rendering

**Issue:** Black screen or "ReactFlow not defined"

**Solution:** Ensure dynamic import with `ssr: false`:
```tsx
const SearchGraphView = dynamic(
  () => import('./search-graph-view'),
  { ssr: false }
)
```

### Poor Performance

**Issue:** Laggy interactions, low FPS

**Solutions:**
1. Reduce max nodes to 100
2. Disable animations: Remove CSS transitions
3. Simplify edges: Reduce connections per node
4. Check browser: Use Chrome for best performance

### Clustering Not Working

**Issue:** All nodes in one cluster

**Solutions:**
1. Verify results have `source.courseName` populated
2. Try topic clustering instead of course
3. Check cluster calculation logic in `clusterResults()`

### Mobile Issues

**Issue:** Graph not responding to touch

**Solutions:**
1. Ensure React Flow touch handlers enabled
2. Check viewport meta tag in layout
3. Test on actual device (not just simulator)
4. Consider fallback to list view on mobile

---

## Future Enhancements

### Phase 2 (Post-MVP)

1. **WebGL Rendering:** For 500+ nodes using Three.js
2. **AI-Powered Clustering:** Use embedding similarity for smart grouping
3. **Path Finding:** Show learning path between concepts
4. **Time-based Layout:** Animate concept evolution over lectures
5. **Collaborative Annotations:** Share graph insights with classmates

### Advanced Features

1. **3D Graph Visualization:** Explore prerequisite depth
2. **VR Support:** Immersive medical knowledge exploration
3. **Export to PDF:** Save graph as study material
4. **Integration with Missions:** Show concepts in mission context
5. **Spaced Repetition:** Highlight concepts due for review

---

## Related Documentation

- [Story 3.6 Context](/docs/stories/story-context-3.6.xml)
- [Solution Architecture](/docs/solution-architecture.md)
- [React Flow Docs](https://reactflow.dev/)
- [Design System - OKLCH Colors](/docs/design-system.md)
- [Performance Testing](/apps/web/src/components/search/__tests__/search-graph-performance.md)

---

## Contributors

- **Frontend Developer Agent** - SearchGraphView implementation (Story 3.6 Task 4)
- **Design System** - OKLCH color palette, glassmorphism
- **React Flow** - Graph visualization library (@xyflow/react v12.8.6)

---

**Last Updated:** 2025-10-16
**Status:** ✅ Production Ready (manual testing required)
