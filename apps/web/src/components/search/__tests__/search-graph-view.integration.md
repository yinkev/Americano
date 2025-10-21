# SearchGraphView Integration Tests
## Story 3.6 Task 4 - AC#4 Validation

**Test Environment:** Manual Testing (MVP - No automated tests per solution-architecture.md)
**Component:** SearchGraphView + SearchResults
**Last Updated:** 2025-10-16
**Status:** Ready for Testing

---

## Test Overview

This document provides comprehensive manual testing instructions for the SearchGraphView component integration into the SearchResults component. Per BMM workflow and solution architecture, automated tests are not required for MVP. Focus is on manual validation of AC#4.

---

## AC#4: Visual search interface showing results in knowledge graph format

### Acceptance Criteria Breakdown:
- ✅ SearchGraphView component exists and uses React Flow
- ✅ Integration into SearchResults with view toggle
- 🔄 **TO TEST:** Graph renders with various node counts (10, 50, 100, 200)
- 🔄 **TO TEST:** Clustering works (by course, by topic)
- 🔄 **TO TEST:** Zoom/pan/minimap controls functional
- 🔄 **TO TEST:** Filter controls work
- 🔄 **TO TEST:** "Expand Search" adds related nodes
- 🔄 **TO TEST:** Performance acceptable (30+ FPS)
- 🔄 **TO TEST:** Mobile touch gestures work
- 🔄 **TO TEST:** Accessibility (keyboard, screen reader)

---

## Pre-Test Setup

### 1. Environment Preparation
```bash
cd /Users/kyin/Projects/Americano-epic3/apps/web
pnpm dev
```

### 2. Required Test Data
You'll need search results with varying characteristics:
- **Small dataset:** 10-20 results
- **Medium dataset:** 50-75 results
- **Large dataset:** 100-150 results
- **Stress test:** 200+ results

### 3. Test Browsers
- ✅ Chrome/Edge (primary)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Mobile browsers (iOS Safari, Android Chrome)

---

## Integration Test 1: View Toggle Functionality

**Purpose:** Verify seamless switching between List and Graph views

### Test Steps:
1. Navigate to search page
2. Perform a search (any query)
3. Observe default view (List)
4. Click "Graph" button in view toggle
5. Observe transition to Graph view
6. Click "List" button
7. Observe transition back to List view
8. Repeat toggle 5 times quickly

### Expected Results:
- ✅ Default view is List
- ✅ Graph button clearly visible with Network icon
- ✅ Clicking Graph shows graph visualization
- ✅ Graph renders within 2 seconds
- ✅ Clicking List returns to list view instantly
- ✅ No console errors during transitions
- ✅ View state persists (no flicker)
- ✅ Toggle buttons have visual active state

### Bug Report Template:
```
BUG: [Title]
Severity: [Critical/High/Medium/Low]
Steps to Reproduce:
1.
2.
3.
Expected:
Actual:
Browser:
Screenshot: [attach if applicable]
```

---

## Integration Test 2: Data Flow (Search API → Graph)

**Purpose:** Verify search results correctly transform into graph nodes

### Test Steps:
1. Open browser DevTools (Network tab)
2. Perform search: "cardiac anatomy"
3. Wait for results
4. Switch to Graph view
5. Inspect rendered nodes
6. Check node count matches result count (or maxNodes limit)
7. Verify node labels match result titles
8. Check node colors match content types:
   - Blue: Lecture
   - Green: Objective
   - Orange: Concept
   - Red: High-Yield (First Aid)

### Expected Results:
- ✅ All search results appear as nodes
- ✅ Node count accurate (max 200)
- ✅ Node labels readable and correct
- ✅ Color coding correct per type
- ✅ High-Yield items show red color + "HY" badge
- ✅ Node size correlates with relevance (larger = more relevant)
- ✅ No duplicate nodes
- ✅ No missing nodes for results < 200

### Test Variations:
- Search with 5 results
- Search with 50 results
- Search with 150 results
- Search with 250+ results (should show 200 max warning)

---

## Integration Test 3: Node Rendering for All Content Types

**Purpose:** Verify all 4 content types render correctly

### Required Test Searches:
1. **Lecture results:** Search for course name or lecture title
2. **Objective results:** Search for "learning objective" or specific objective text
3. **Card results:** Search for flashcard content
4. **Concept results:** Search for medical terms

### Test Steps for Each Type:
1. Perform search likely to return that content type
2. Switch to Graph view
3. Find node of that type
4. Verify color coding
5. Click node
6. Verify node info panel shows correct data
7. Check node size reflects relevance

### Expected Results:
| Content Type | Color | Icon/Badge | Metadata |
|--------------|-------|-----------|----------|
| Lecture | Blue (oklch 240) | None | Course name shown |
| Objective | Green (oklch 140) | None | Complexity shown |
| Card | Purple (oklch 290) | None | - |
| Concept | Orange (oklch 50) | None | - |
| High-Yield | Red (oklch 20) | "HY" badge | Yellow badge |

---

## Integration Test 4: Clustering Algorithm

**Purpose:** Verify results cluster by course and topic

### Test 4A: Cluster by Course (Default)
1. Perform search with results from multiple courses
2. Switch to Graph view
3. Observe node grouping
4. Verify cluster labels show course names
5. Verify cluster boundaries visible (dashed lines)
6. Verify nodes within cluster are related by course

### Test 4B: Cluster by Topic
1. While in Graph view, click "Toggle Cluster" button
2. Observe re-clustering animation
3. Verify new clusters based on topic (first word of title)
4. Click "Toggle Cluster" again
5. Verify return to course clustering

### Expected Results:
- ✅ Default clustering is by course
- ✅ Cluster backgrounds visible (light transparent color)
- ✅ Cluster labels clear and positioned correctly
- ✅ Nodes within cluster share common course/topic
- ✅ Toggle cluster button works
- ✅ Re-clustering animates smoothly (<1 second)
- ✅ Cluster count shown in info panel

### Edge Cases:
- Single cluster (all results from one course)
- Many clusters (results from 10+ courses)
- "Uncategorized" cluster for results without course

---

## Integration Test 5: Graph Navigation Controls

**Purpose:** Test all navigation controls function correctly

### Controls to Test:
1. **Zoom In** (+ button)
2. **Zoom Out** (- button)
3. **Fit View** (Maximize2 button)
4. **Pan** (click and drag)
5. **MiniMap** (click to jump)
6. **Mouse wheel zoom**

### Test Steps:
1. **Zoom In:**
   - Click + button 3 times
   - Verify graph zooms in
   - Verify nodes become larger
   - Verify smooth animation

2. **Zoom Out:**
   - Click - button 3 times
   - Verify graph zooms out
   - Verify nodes become smaller

3. **Fit View:**
   - Zoom to random level
   - Click Fit View button
   - Verify all nodes visible in viewport
   - Verify animation smooth (800ms)

4. **Pan:**
   - Click and drag graph background
   - Verify graph pans in drag direction
   - Verify no nodes selected during drag

5. **MiniMap:**
   - Locate minimap (bottom-right)
   - Click different areas
   - Verify main view jumps to clicked area
   - Verify minimap shows all nodes

6. **Mouse Wheel:**
   - Scroll mouse wheel up
   - Verify zoom in
   - Scroll mouse wheel down
   - Verify zoom out

### Expected Results:
- ✅ All controls respond within 100ms
- ✅ Zoom limits respected (0.1x - 2x)
- ✅ Fit View shows all nodes
- ✅ Pan is smooth and responsive
- ✅ MiniMap updates in real-time
- ✅ Mouse wheel zoom works
- ✅ No console errors

---

## Integration Test 6: Filter Controls

**Purpose:** Verify filtering doesn't break graph view

### Test Steps:
1. Perform search with diverse results
2. Switch to Graph view
3. Note initial node count
4. Apply filter (e.g., "Lectures only")
5. Observe graph update
6. Verify only lecture nodes visible
7. Remove filter
8. Verify all nodes return

### Expected Results:
- ✅ Filters apply to graph view
- ✅ Node count updates correctly
- ✅ Removed nodes disappear with animation
- ✅ Re-added nodes appear with animation
- ✅ Clustering updates for filtered nodes
- ✅ No orphaned edges

---

## Integration Test 7: "Expand Search" Functionality

**Purpose:** Test adding related nodes from graph

### Test Steps:
1. Switch to Graph view (10-20 results)
2. Click a node
3. Verify node info panel appears (top-right)
4. Click "Show Related" button
5. Observe API call in Network tab
6. Wait for new nodes to appear
7. Verify new nodes connected to source node
8. Repeat with different node

### Expected Results:
- ✅ Clicking node shows info panel
- ✅ "Show Related" button visible
- ✅ Button triggers API call for related content
- ✅ New nodes appear within 2 seconds
- ✅ New nodes have connecting edges
- ✅ Graph re-layouts to accommodate new nodes
- ✅ User can continue expanding
- ✅ Max node limit still enforced (200)

---

## Integration Test 8: Performance Testing

**Purpose:** Measure and validate rendering performance

### Performance Metrics to Collect:
1. **Initial render time** (switch to graph view)
2. **Frame rate during pan/zoom** (should be 30+ FPS)
3. **Memory usage** (should not grow unbounded)
4. **Layout calculation time** (should be <500ms)

### Test Procedure:

#### 8A: Initial Render Time
1. Open Chrome DevTools > Performance tab
2. Start recording
3. Perform search (100 results)
4. Switch to Graph view
5. Stop recording when graph fully rendered
6. Measure time from button click to graph interactive

**Target:** <2 seconds for 100 nodes

#### 8B: Frame Rate During Interaction
1. Open graph with 100 nodes
2. Open DevTools > Rendering > Frame Rendering Stats
3. Perform continuous pan for 5 seconds
4. Observe FPS counter
5. Perform continuous zoom for 5 seconds
6. Observe FPS counter

**Target:** 30+ FPS consistently

#### 8C: Memory Usage
1. Open graph with 50 nodes
2. Open DevTools > Memory > Take snapshot
3. Expand search 3 times (add 30 more nodes)
4. Take another snapshot
5. Switch to List view
6. Take another snapshot
7. Switch back to Graph view
8. Take final snapshot
9. Compare memory growth

**Target:** No memory leaks, <100MB total for 200 nodes

#### 8D: Stress Test (200+ Nodes)
1. Perform broad search returning 250+ results
2. Switch to Graph view
3. Verify "Showing 200 of 250" warning appears
4. Verify graph still interactive
5. Test pan, zoom, node selection
6. Measure FPS during interaction

**Target:** 20+ FPS with 200 nodes

### Performance Results Template:
```
Test: [Name]
Node Count: [number]
Initial Render: [ms]
Average FPS: [fps]
Memory Usage: [MB]
Browser: [name/version]
Pass/Fail: [result]
Notes: [any observations]
```

---

## Integration Test 9: Mobile Touch Gestures

**Purpose:** Verify graph works on mobile devices

### Test Devices:
- iPhone (iOS Safari)
- Android phone (Chrome)
- iPad (Safari)

### Touch Gestures to Test:
1. **Pinch to zoom**
2. **Two-finger pan**
3. **Tap node to select**
4. **Double-tap node for expand**
5. **Swipe to pan**

### Test Steps:
1. Open graph on mobile device
2. **Pinch Zoom:**
   - Place two fingers on graph
   - Pinch together (zoom out)
   - Pinch apart (zoom in)
   - Verify smooth zoom

3. **Pan:**
   - Single finger drag on background
   - Verify graph pans
   - Verify no accidental node selection

4. **Tap Node:**
   - Tap a node
   - Verify node info panel appears
   - Verify node highlighted
   - Verify no accidental zoom

5. **Minimap (Mobile):**
   - Locate minimap (may be small)
   - Tap minimap areas
   - Verify navigation works

### Expected Results:
- ✅ All touch gestures work
- ✅ Pinch zoom smooth
- ✅ No accidental selections during pan
- ✅ Tap targets large enough (44px+)
- ✅ Info panel positioned well on mobile
- ✅ Controls accessible (not obscured)
- ✅ Landscape and portrait work
- ✅ Performance acceptable (15+ FPS)

---

## Integration Test 10: Accessibility Testing

**Purpose:** Verify keyboard navigation and screen reader support

### 10A: Keyboard Navigation
1. **Tab Navigation:**
   - Press Tab repeatedly
   - Verify focus moves through controls:
     - View toggle buttons
     - Graph controls (Zoom In, Zoom Out, Fit View, Toggle Cluster)
     - Nodes (in order)
   - Verify focus indicator visible

2. **Arrow Key Navigation:**
   - Focus graph area
   - Press ↓ arrow
   - Verify first node selected
   - Press ↓ again
   - Verify next node selected
   - Press ↑ arrow
   - Verify previous node selected

3. **Enter Key:**
   - Select a node (arrow keys)
   - Press Enter
   - Verify "Expand Search" triggered

4. **Escape Key:**
   - With node selected
   - Press Escape
   - Verify node deselected

### Expected Results:
- ✅ All interactive elements keyboard accessible
- ✅ Focus indicator visible (not obscured)
- ✅ Arrow keys navigate between nodes
- ✅ Enter key triggers primary action
- ✅ Escape key deselects/closes
- ✅ No keyboard traps
- ✅ Tab order logical

### 10B: Screen Reader Testing
1. Enable screen reader (VoiceOver macOS, NVDA Windows)
2. Navigate to graph view
3. Verify announcements:
   - "Search results graph visualization, region"
   - Node count announced
   - Cluster info announced
4. Tab to a node
5. Verify node info announced:
   - Node title
   - Content type
   - Relevance percentage
   - Course name
6. Tab to controls
7. Verify control purpose announced:
   - "Zoom in, button"
   - "Fit view, button"
   - etc.

### Expected Results:
- ✅ Graph region has ARIA label
- ✅ Node selection announced
- ✅ Button purposes clear
- ✅ Current state announced (e.g., "3 of 20 nodes selected")
- ✅ No unlabeled interactive elements
- ✅ Dynamic content updates announced

### 10C: ARIA Compliance
Inspect HTML and verify:
- `role="region"` on graph container
- `aria-label="Search results graph visualization"`
- `aria-label` on all buttons
- `aria-current` or `aria-selected` on selected node
- No duplicate IDs
- Color contrast >= 4.5:1 for text

---

## Integration Test 11: Edge Cases & Error Handling

### Test Cases:

1. **Empty Results:**
   - Search for gibberish: "xyzabc123"
   - Switch to Graph view
   - Expected: "No results" message, not broken graph

2. **Single Result:**
   - Search for very specific term (1 result)
   - Switch to Graph view
   - Expected: Single node visible, centered

3. **Exactly 200 Results:**
   - Search for broad term (200 results)
   - Switch to Graph view
   - Expected: All 200 nodes visible, no warning

4. **201+ Results:**
   - Search for very broad term (250+ results)
   - Switch to Graph view
   - Expected: 200 nodes shown, warning badge bottom-right

5. **Network Error During Expand:**
   - Select node, click "Show Related"
   - Simulate network failure (DevTools offline)
   - Expected: Error toast, graph remains stable

6. **Rapid View Switching:**
   - Click Graph → List → Graph → List rapidly (10x)
   - Expected: No errors, view updates correctly

---

## Test Results Summary

### Test Execution Template:
```markdown
## Test Run: [Date/Time]
**Tester:** [Name]
**Browser:** [Name/Version]
**OS:** [Name/Version]

### Tests Executed:
- [ ] Test 1: View Toggle - PASS/FAIL
- [ ] Test 2: Data Flow - PASS/FAIL
- [ ] Test 3: Node Rendering - PASS/FAIL
- [ ] Test 4: Clustering - PASS/FAIL
- [ ] Test 5: Navigation Controls - PASS/FAIL
- [ ] Test 6: Filter Controls - PASS/FAIL
- [ ] Test 7: Expand Search - PASS/FAIL
- [ ] Test 8: Performance - PASS/FAIL
- [ ] Test 9: Mobile Touch - PASS/FAIL
- [ ] Test 10: Accessibility - PASS/FAIL
- [ ] Test 11: Edge Cases - PASS/FAIL

### Overall Result: PASS / FAIL
**AC#4 Validated:** YES / NO

### Bugs Found:
1. [Bug description]
2. [Bug description]

### Performance Results:
- Initial Render (100 nodes): [ms]
- Average FPS (pan/zoom): [fps]
- Memory Usage (200 nodes): [MB]

### Notes:
[Any additional observations]

### Sign-off:
**Tester:** ________________  **Date:** __________
**Reviewer:** ________________  **Date:** __________
```

---

## Automated Test Placeholder (Post-MVP)

Once automated testing is prioritized, these tests should be implemented:

```typescript
// apps/web/src/components/search/__tests__/search-graph-view.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchGraphView } from '../search-graph-view'
import { mockSearchResults } from './fixtures'

describe('SearchGraphView Integration', () => {
  it('renders graph with correct node count', async () => {
    render(<SearchGraphView results={mockSearchResults(50)} />)
    // ... assertions
  })

  it('handles view toggle', async () => {
    // ... test implementation
  })

  it('clusters nodes by course', async () => {
    // ... test implementation
  })

  it('expands search from node', async () => {
    // ... test implementation
  })

  it('handles 200+ nodes with clustering', async () => {
    // ... test implementation
  })

  it('meets accessibility standards', async () => {
    // ... axe-core integration
  })
})
```

---

## AC#4 Validation Checklist

Before marking Story 3.6 Task 4 as complete, verify:

- ✅ SearchGraphView component exists
- ✅ React Flow integration complete
- ✅ Integration into SearchResults complete
- ✅ View toggle works (List ↔ Graph)
- ✅ Data flows correctly from API to graph
- ✅ All content types render correctly
- ✅ Clustering algorithm works (course + topic)
- ✅ All navigation controls functional
- ✅ Filter controls work
- ✅ "Expand Search" adds related nodes
- ✅ Performance acceptable (30+ FPS, <2s render)
- ✅ Mobile touch gestures work
- ✅ Keyboard navigation works
- ✅ Screen reader announces content
- ✅ ARIA labels complete
- ✅ Edge cases handled gracefully

**AC#4 Status:** ☐ PASS ☐ FAIL

**Sign-off Required:** DEV Agent, Frontend Developer Agent, QA (if applicable)

---

## References

- **Story:** `/Users/kyin/Projects/Americano-epic3/docs/stories/story-3.6.md`
- **Context:** `/Users/kyin/Projects/Americano-epic3/docs/stories/story-context-3.6.xml`
- **Component:** `/Users/kyin/Projects/Americano-epic3/apps/web/src/components/search/search-graph-view.tsx`
- **Integration:** `/Users/kyin/Projects/Americano-epic3/apps/web/src/components/search/search-results.tsx`
- **React Flow Docs:** Fetched from context7 MCP
- **Testing Library Docs:** Fetched from context7 MCP
- **Playwright Docs:** Fetched from context7 MCP
