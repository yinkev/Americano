# Story 3.6 Task 4 - Test Execution Guide
## SearchGraphView Integration & Testing

**Story:** 3.6 - Advanced Search and Discovery Features
**Task:** 4 - Visual Search with Knowledge Graph Integration
**AC:** #4 - Visual search interface showing results in knowledge graph format
**Status:** Ready for Manual Testing
**Last Updated:** 2025-10-16

---

## Quick Start

### For the User (Product Owner/PM):
1. Start the dev server: `cd apps/web && pnpm dev`
2. Navigate to `/search` page
3. Perform a search
4. Click the "Graph" button to toggle view
5. Interact with the graph (zoom, pan, click nodes)
6. Follow the manual test checklist below

### For Developers:
- **Integration Test Doc:** `/apps/web/src/components/search/__tests__/search-graph-view.integration.md`
- **Component Location:** `/apps/web/src/components/search/search-graph-view.tsx`
- **Integration Point:** `/apps/web/src/components/search/search-results.tsx`

---

## Current Integration Status

### ✅ Completed:
1. **SearchGraphView Component** - Fully implemented with React Flow
2. **SearchResults Integration** - View toggle working (List ↔ Graph)
3. **Node Rendering** - All 4 content types supported (lecture, objective, card, concept)
4. **Clustering Algorithm** - By course (default) and topic
5. **Navigation Controls** - Zoom, pan, fit view, minimap
6. **Keyboard Navigation** - Arrow keys, Enter, Escape
7. **Accessibility** - ARIA labels, role attributes, screen reader support
8. **Performance Optimizations** - Max 200 nodes, clustering triggers
9. **Mobile Responsiveness** - Touch gestures, responsive layout
10. **Expand Search** - "Show Related" button on node selection

### 🔄 Testing Required:
1. Manual testing with real search data
2. Performance validation (FPS, memory, render time)
3. Accessibility testing (keyboard, screen reader)
4. Mobile device testing (iOS, Android)
5. Edge case testing (0 results, 200+ results, etc.)
6. Cross-browser testing (Chrome, Firefox, Safari)

---

## Manual Testing Checklist

### Priority 1: Core Functionality (Must Test)

#### ☐ Test 1: View Toggle
- [ ] Default view is List
- [ ] Click "Graph" button switches to Graph view
- [ ] Click "List" button returns to List view
- [ ] Toggle works smoothly without errors
- [ ] View state is consistent

**How to Test:**
1. Open `/search` page
2. Search for "cardiac anatomy"
3. Observe List view (default)
4. Click "Graph" button (top-right)
5. Observe Graph view appears
6. Click "List" button
7. Observe List view returns
8. Repeat 3-5 times

**Pass Criteria:** All toggles work without console errors, smooth transitions

---

#### ☐ Test 2: Node Rendering
- [ ] All search results appear as nodes
- [ ] Node colors match content types (Blue=Lecture, Green=Objective, Orange=Concept, Red=High-Yield)
- [ ] Node sizes reflect relevance (larger = more relevant)
- [ ] Node labels are readable
- [ ] High-Yield items show "HY" badge

**How to Test:**
1. Search for diverse content: "anatomy cardiovascular"
2. Switch to Graph view
3. Count nodes (should match result count or max 200)
4. Identify different colored nodes
5. Click nodes to verify types
6. Find a High-Yield item (red with HY badge)

**Pass Criteria:** All results visible, colors correct, labels readable

---

#### ☐ Test 3: Clustering
- [ ] Nodes cluster by course (default)
- [ ] Cluster backgrounds visible with labels
- [ ] "Toggle Cluster" button switches to topic clustering
- [ ] Re-clustering is smooth

**How to Test:**
1. Search for content from multiple courses
2. Switch to Graph view
3. Observe cluster groupings (should see course names)
4. Click "Toggle Cluster" button
5. Observe re-clustering (by topic - first word of title)
6. Click again to return to course clustering

**Pass Criteria:** Clustering visible, toggle works, smooth animations

---

#### ☐ Test 4: Navigation Controls
- [ ] Zoom In button (+) works
- [ ] Zoom Out button (-) works
- [ ] Fit View button (Maximize2) centers all nodes
- [ ] Pan works (click & drag)
- [ ] Minimap shows overview and allows click navigation
- [ ] Mouse wheel zoom works

**How to Test:**
1. In Graph view, click Zoom In button 3 times
2. Click Zoom Out button 2 times
3. Click Fit View button
4. Click and drag graph background to pan
5. Click different areas of minimap (bottom-right)
6. Scroll mouse wheel up and down

**Pass Criteria:** All controls responsive, zoom limits enforced (0.1x - 2x)

---

#### ☐ Test 5: Node Selection & Expand Search
- [ ] Clicking node selects it
- [ ] Node info panel appears (top-right)
- [ ] "Show Related" button visible
- [ ] Clicking "Show Related" triggers expand search
- [ ] New related nodes appear (if applicable)

**How to Test:**
1. Click any node in graph
2. Verify node highlighted
3. Verify info panel shows on right with node details
4. Click "Show Related" button
5. Observe if new nodes added (depends on backend implementation)

**Pass Criteria:** Selection works, info panel accurate, no errors

---

### Priority 2: Performance & Quality (Should Test)

#### ☐ Test 6: Performance with Various Node Counts
- [ ] 10 nodes: Smooth, instant render
- [ ] 50 nodes: Smooth, <1 second render
- [ ] 100 nodes: Acceptable, <2 seconds render
- [ ] 200 nodes: Acceptable, <3 seconds render
- [ ] 200+ nodes: Warning shown, 200 nodes displayed

**How to Test:**
1. Perform searches yielding different result counts
2. Switch to Graph view for each
3. Measure subjective smoothness
4. Use browser DevTools Performance tab for exact measurements
5. For 200+: verify warning badge appears (bottom-right)

**Pass Criteria:** 30+ FPS during interaction, no lag, warnings shown

---

#### ☐ Test 7: Accessibility (Keyboard)
- [ ] Tab key moves focus through controls
- [ ] Arrow keys navigate between nodes
- [ ] Enter key on selected node triggers expand
- [ ] Escape key deselects node
- [ ] Focus indicators visible

**How to Test:**
1. Switch to Graph view
2. Press Tab repeatedly, observe focus movement
3. Press ↓ arrow, verify first node selected
4. Press ↓ again, verify next node selected
5. Press Enter, verify action triggered
6. Press Escape, verify deselection

**Pass Criteria:** All keyboard navigation works, no traps, logical tab order

---

#### ☐ Test 8: Mobile Touch Gestures
- [ ] Pinch to zoom works
- [ ] Pan works with single finger drag
- [ ] Tap node selects it
- [ ] Double-tap zooms
- [ ] Controls accessible (not obscured)

**How to Test (on mobile device):**
1. Open graph on iPhone or Android
2. Pinch fingers together/apart (zoom)
3. Drag with one finger (pan)
4. Tap a node (select)
5. Double-tap background (zoom)
6. Verify all controls visible and tappable

**Pass Criteria:** All gestures work, no accidental selections, 15+ FPS

---

### Priority 3: Edge Cases (Nice to Test)

#### ☐ Test 9: Edge Cases
- [ ] Empty results (0 nodes): No errors, shows message
- [ ] Single result (1 node): Node centered, visible
- [ ] Exactly 200 results: All visible, no warning
- [ ] 201+ results: 200 shown, warning badge visible
- [ ] Rapid view toggling: No errors or flicker

**How to Test:**
1. Search for gibberish: "xyzabc123" → Switch to Graph
2. Search for very specific term (1 result) → Switch to Graph
3. Perform broad search (200+ results) → Switch to Graph
4. Toggle List ↔ Graph rapidly 10 times

**Pass Criteria:** No errors, graceful handling, appropriate warnings

---

#### ☐ Test 10: Cross-Browser
- [ ] Chrome/Edge: Full functionality
- [ ] Firefox: Full functionality
- [ ] Safari (macOS): Full functionality
- [ ] Safari (iOS): Full functionality
- [ ] Chrome (Android): Full functionality

**How to Test:**
Repeat Tests 1-5 on each browser

**Pass Criteria:** Consistent behavior across browsers, no browser-specific bugs

---

## Bug Tracking

### Bug Report Template:
```markdown
**Bug #:** [Auto-increment]
**Severity:** Critical / High / Medium / Low
**Component:** SearchGraphView / SearchResults / Integration
**Test:** [Test number and name]
**Browser:** [Browser name/version]
**OS:** [OS name/version]

**Description:**
[Clear description of the bug]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshot/Video:**
[Attach if applicable]

**Console Errors:**
```
[Paste any console errors]
```

**Workaround:**
[If any workaround exists]

**Priority:**
[P0: Blocking / P1: Critical / P2: Important / P3: Nice to fix]

**Assigned To:** [Developer name]
**Status:** Open / In Progress / Fixed / Verified
```

### Example Bug Report:
```markdown
**Bug #:** 1
**Severity:** High
**Component:** SearchGraphView
**Test:** Test 4 - Navigation Controls
**Browser:** Chrome 131
**OS:** macOS 14.5

**Description:**
Zoom Out button does not work after zooming in more than 5 times

**Steps to Reproduce:**
1. Open Graph view with 50 nodes
2. Click Zoom In button 6 times
3. Click Zoom Out button
4. Observe: No zoom out occurs

**Expected Result:**
Graph should zoom out smoothly

**Actual Result:**
Nothing happens, zoom level stays at maximum

**Console Errors:**
```
TypeError: Cannot read property 'zoomOut' of undefined at SearchGraphView.tsx:362
```

**Workaround:**
Refresh page and avoid zooming in more than 5 times

**Priority:** P1: Critical
**Assigned To:** Frontend Dev
**Status:** Open
```

---

## Test Execution Log

### Test Run #1
**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**Browser:** [Name/Version]
**OS:** [Name/Version]

#### Results:
- [ ] Test 1: View Toggle - PASS / FAIL
- [ ] Test 2: Node Rendering - PASS / FAIL
- [ ] Test 3: Clustering - PASS / FAIL
- [ ] Test 4: Navigation Controls - PASS / FAIL
- [ ] Test 5: Node Selection - PASS / FAIL
- [ ] Test 6: Performance - PASS / FAIL
- [ ] Test 7: Accessibility - PASS / FAIL
- [ ] Test 8: Mobile Touch - PASS / FAIL
- [ ] Test 9: Edge Cases - PASS / FAIL
- [ ] Test 10: Cross-Browser - PASS / FAIL

**Overall Result:** PASS / FAIL
**Bugs Found:** [Count]
**AC#4 Validated:** YES / NO

**Notes:**
[Any additional observations or concerns]

---

## Performance Benchmarks

### Target Metrics:
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Initial Render (100 nodes) | <2s | [TBD] | ☐ |
| Average FPS (pan/zoom) | 30+ | [TBD] | ☐ |
| Memory Usage (200 nodes) | <100MB | [TBD] | ☐ |
| Cluster Toggle Time | <1s | [TBD] | ☐ |
| Node Selection Response | <100ms | [TBD] | ☐ |

### How to Measure:

**Initial Render Time:**
1. Open Chrome DevTools > Performance
2. Click "Record"
3. Perform search
4. Click "Graph" button
5. Wait for graph to render
6. Stop recording
7. Find duration from button click to "render complete"

**FPS:**
1. Open DevTools > Rendering > Frame Rendering Stats
2. Enable FPS meter
3. Interact with graph (pan/zoom)
4. Observe FPS counter (top-left)
5. Record min, max, average

**Memory:**
1. Open DevTools > Memory
2. Take heap snapshot before graph render
3. Switch to Graph view with 200 nodes
4. Take another snapshot
5. Compare memory growth

---

## AC#4 Validation Report

### Acceptance Criteria #4:
> "Visual search interface showing results in knowledge graph format"

### Validation Checklist:
- [ ] ✅ Graph visualization implemented using React Flow
- [ ] ✅ Search results display as nodes
- [ ] ✅ Nodes color-coded by content type
- [ ] ✅ Node size reflects relevance
- [ ] ✅ Clustering by course/topic implemented
- [ ] ✅ Navigation controls (zoom, pan, minimap) working
- [ ] ✅ Node selection shows details
- [ ] ✅ "Expand Search" functionality implemented
- [ ] ✅ Performance acceptable (30+ FPS, <2s render)
- [ ] ✅ Mobile-responsive with touch gestures
- [ ] ✅ Keyboard accessible
- [ ] ✅ Screen reader support
- [ ] ✅ Handles edge cases gracefully

### Final Validation:
**AC#4 Status:** ☐ PASS ☐ FAIL

**Evidence:**
- Component implementation: ✅ Complete
- Integration: ✅ Complete
- Manual testing: 🔄 In Progress
- Performance benchmarks: 🔄 Pending
- Accessibility: 🔄 Pending
- Cross-browser: 🔄 Pending

**Sign-off:**
- **DEV Agent:** ________________ Date: __________
- **Frontend Developer:** ________________ Date: __________
- **Product Owner:** ________________ Date: __________

**Notes:**
[Any caveats, known limitations, or future improvements]

---

## Next Steps

### After Testing Complete:
1. ✅ Document all bugs found
2. ✅ Prioritize bugs (P0/P1/P2/P3)
3. ✅ Fix critical bugs (P0/P1)
4. ✅ Re-test fixed bugs
5. ✅ Verify AC#4 fully satisfied
6. ✅ Update Story 3.6 status to "Complete"
7. ✅ Commit final changes
8. ✅ Create summary report for user

### Future Enhancements (Post-MVP):
- Implement automated tests (Jest + Playwright)
- Add visual regression tests (Storybook + Chromatic)
- Performance profiling and optimization
- Advanced layout algorithms (dagre, elk)
- Animated node transitions
- Graph export (PNG/SVG)
- Search path history visualization

---

## Quick Reference

### File Locations:
- **Integration Test Doc:** `/apps/web/src/components/search/__tests__/search-graph-view.integration.md`
- **Component:** `/apps/web/src/components/search/search-graph-view.tsx`
- **Integration Point:** `/apps/web/src/components/search/search-results.tsx`
- **Test Guide:** `/docs/testing/story-3.6-test-execution-guide.md` (this file)

### Key Commands:
```bash
# Start dev server
cd apps/web && pnpm dev

# Open in browser
open http://localhost:3000/search

# View logs
# (open browser DevTools console)
```

### Contacts:
- **DEV Agent:** Available via CLI
- **Frontend Expert:** Available via Claude Code
- **Product Owner:** [User/Kevy]

---

**End of Test Execution Guide**
