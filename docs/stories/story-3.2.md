# Story 3.2: Knowledge Graph Construction and Visualization

Status: Complete
Completed: 2025-10-16

## Story

As a medical student,
I want to see how different concepts connect to each other,
So that I can understand relationships and build integrated knowledge.

## Acceptance Criteria

1. Knowledge graph automatically constructed from content relationships
2. Concepts linked based on semantic similarity and co-occurrence
3. Interactive visualization showing concept nodes and relationship edges
4. Graph navigation allows drilling down into specific concept areas
5. Relationship strength indicated through visual cues (line thickness, proximity)
6. User can add custom connections and annotations to graph
7. Graph updates dynamically as new content added to platform
8. Integration with learning objectives showing prerequisite pathways

## Tasks / Subtasks

### Task 1: Extend Database Schema for Knowledge Graph (AC: #1, #2, #7)
- [ ] 1.1: Verify Concept and ConceptRelationship models in Prisma schema
  - Already exists: `Concept` model with embedding field (vector(1536))
  - Already exists: `ConceptRelationship` model with relationship types
  - Verify enum: `RelationshipType` (PREREQUISITE, RELATED, INTEGRATED, CLINICAL)
  - Source: [solution-architecture.md#Database Schema, lines 973-1013]
- [ ] 1.2: Add vector index for Concept embeddings if not present
  - Create index: `CREATE INDEX concepts_embedding_idx ON concepts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)`
  - Verify pgvector extension enabled
  - Source: [solution-architecture.md#Database Indexes, lines 1148-1154]
- [ ] 1.3: Add fields for user annotations and custom connections
  - Add to ConceptRelationship: `isUserDefined: Boolean @default(false)`
  - Add to ConceptRelationship: `userNote: String? @db.Text`
  - Add to ConceptRelationship: `createdBy: String?` (userId for custom connections)
  - Create migration for schema updates
- [ ] 1.4: Create indexes for graph traversal queries
  - Index on ConceptRelationship.fromConceptId for outbound edge lookup
  - Index on ConceptRelationship.toConceptId for inbound edge lookup
  - Already specified in schema (lines 1002-1003)

### Task 2: Build Knowledge Graph Construction Engine (AC: #1, #2, #7)
- [ ] 2.1: Create KnowledgeGraphBuilder class
  - Location: `apps/web/src/subsystems/knowledge-graph/graph-builder.ts`
  - Method: `buildGraphFromContent(lectureId?: string): Promise<void>`
  - Method: `extractConcepts(contentChunks: ContentChunk[]): Promise<Concept[]>`
  - Method: `identifyRelationships(concepts: Concept[]): Promise<ConceptRelationship[]>`
  - Source: [solution-architecture.md#Subsystem 3, lines 560-565]
- [ ] 2.2: Implement concept extraction from content
  - Use ChatMock API to identify key medical concepts from content chunks
  - Extract concept name, description, category (anatomy, physiology, pathology, etc.)
  - Generate embeddings for each concept using GeminiClient (1536 dimensions)
  - Store concepts in Concept table with deduplication (merge if already exists)
- [ ] 2.3: Implement relationship detection algorithm
  - **Semantic similarity**: Use cosine distance between concept embeddings
  - Threshold: Similarity > 0.75 = RELATED relationship
  - **Co-occurrence**: Detect concepts appearing in same content chunks
  - Co-occurrence frequency > 3 chunks = stronger relationship (strength: 0.8-1.0)
  - **Prerequisite detection**: Use ChatMock to identify prerequisite relationships from LearningObjective data
  - Map to existing ObjectivePrerequisite relationships from Story 2.1
  - Source: [solution-architecture.md#Subsystem 3, lines 563-565]
- [ ] 2.4: Calculate relationship strength scores
  - Formula: `strength = (semantic_similarity * 0.4) + (co_occurrence_score * 0.3) + (prerequisite_confidence * 0.3)`
  - Normalize to 0.0-1.0 range
  - Store in ConceptRelationship.strength field
  - Higher strength = thicker edges in visualization
- [ ] 2.5: Implement incremental graph updates
  - Trigger graph rebuild on lecture upload completion (after Story 2.1 objective extraction)
  - Only process new content chunks (avoid full rebuild)
  - Update relationship strengths when new connections detected
  - Delete orphaned concepts (concepts with no relationships and no content chunks)

### Task 3: Create Graph Visualization API Endpoints (AC: #3, #4, #5)
- [ ] 3.1: Create GET /api/graph/concepts endpoint
  - Query params: `category?: string`, `depth?: number` (default 2 for traversal depth)
  - Response: `{ nodes: Concept[], edges: ConceptRelationship[] }`
  - Format nodes: `{ id, name, description, category, embedding }`
  - Format edges: `{ id, fromConceptId, toConceptId, relationship, strength }`
  - Source: [solution-architecture.md#API Endpoints, lines 1347-1353]
- [ ] 3.2: Create GET /api/graph/concepts/:id endpoint
  - Response: `{ concept: Concept, relatedConcepts: Concept[], relationships: ConceptRelationship[] }`
  - Include all direct relationships (depth 1)
  - Sort related concepts by relationship strength (descending)
  - Source: [solution-architecture.md#API Endpoints, lines 1355-1359]
- [ ] 3.3: Create GET /api/graph/concepts/:id/content endpoint
  - Response: `{ lectures: Lecture[], cards: Card[], objectives: LearningObjective[] }`
  - Find all content linked to this concept (via embeddings or tags)
  - Include content metadata: title, course, date, page numbers
  - Source: [solution-architecture.md#API Endpoints, lines 1361-1365]
- [ ] 3.4: Add graph filtering and traversal options
  - Filter by relationship type: `?relationships=PREREQUISITE,RELATED`
  - Filter by concept category: `?categories=anatomy,physiology`
  - Limit traversal depth: `?depth=1` (only direct connections), `?depth=2` (connections of connections)
  - Limit node count: `?limit=50` (for performance on large graphs)

### Task 4: Build Interactive Graph Visualization UI (AC: #3, #4, #5)
- [ ] 4.1: Create /graph page
  - Location: `apps/web/src/app/graph/page.tsx`
  - Layout: Full-screen graph canvas, sidebar for filters and concept details
  - Loading state: Show skeleton graph during data fetch
  - Empty state: "Upload lectures to build your knowledge graph"
  - Source: [solution-architecture.md#Screen organization, lines 1838-1841]
- [ ] 4.2: Integrate React Flow for graph visualization
  - Install: `pnpm add @xyflow/react` (latest React Flow v12+)
  - Component: `apps/web/src/components/graph/knowledge-graph.tsx`
  - Node types: Custom medical concept nodes with category color coding
  - Edge types: Custom edges with relationship type labels and thickness based on strength
  - Source: [solution-architecture.md#Technology Stack, line 1740]
- [ ] 4.3: Implement force-directed layout algorithm
  - Use React Flow's built-in layout or `dagre` for hierarchical layout
  - Configure force simulation parameters:
    - Node repulsion: Prevent overlap
    - Edge attraction: Pull related concepts closer (strength-weighted)
    - Center gravity: Keep graph centered in viewport
  - Optimize layout for medical concept hierarchies (anatomy → physiology → pathology)
  - Source: [epics file, lines 422-424]
- [ ] 4.4: Design node and edge visual styles
  - **Nodes**:
    - Circle shape with concept name label
    - Size based on number of relationships (5-20px radius)
    - Color by category: anatomy (blue), physiology (green), pathology (red), pharmacology (purple)
    - Hover: Show description tooltip
    - Click: Open concept detail panel
  - **Edges**:
    - Line thickness: 1-5px based on relationship strength (0.0-1.0)
    - Color by relationship type: PREREQUISITE (orange), RELATED (gray), INTEGRATED (cyan), CLINICAL (magenta)
    - Dashed line for user-defined relationships
    - Arrows for directional relationships (PREREQUISITE)
  - **Visual cues** (AC #5):
    - Proximity: Stronger relationships = nodes positioned closer
    - Opacity: Weaker relationships (strength < 0.3) are semi-transparent
- [ ] 4.5: Implement graph navigation and interaction
  - **Zoom**: Mouse wheel zoom in/out
  - **Pan**: Drag canvas to explore large graphs
  - **Node selection**: Click to select, show concept details in sidebar
  - **Drill-down**: Double-click node to focus on its subgraph (depth 2)
  - **Expand/collapse**: Right-click node to expand/collapse connections
  - **Reset view**: Button to reset zoom and center graph
  - AC #4 requirement

### Task 5: Implement User Annotations and Custom Connections (AC: #6)
- [ ] 5.1: Create POST /api/graph/relationships endpoint
  - Request body: `{ fromConceptId: string, toConceptId: string, relationship: RelationshipType, userNote?: string }`
  - Validation: Both concepts must exist, no duplicate relationships
  - Set `isUserDefined: true`, `createdBy: userId`, `strength: 1.0` for custom connections
  - Response: `{ relationship: ConceptRelationship }`
- [ ] 5.2: Create DELETE /api/graph/relationships/:id endpoint
  - Only allow deletion of user-defined relationships (`isUserDefined: true`)
  - System-generated relationships (from graph builder) cannot be deleted
  - Response: `{ success: true }`
- [ ] 5.3: Add "Create Connection" UI in graph visualization
  - Mode toggle: "View Mode" vs. "Edit Mode"
  - Edit mode: Click two nodes to create relationship
  - Relationship type selector: Dropdown for PREREQUISITE, RELATED, INTEGRATED, CLINICAL
  - Annotation input: Text field for userNote (optional)
  - Visual feedback: Highlight selected nodes, show preview edge
- [ ] 5.4: Add annotation panel in concept detail sidebar
  - Display user notes for relationships
  - Edit/delete buttons for user-defined relationships
  - "Add note" button to annotate existing relationships
  - Character limit: 500 chars for userNote

### Task 6: Integrate with Learning Objectives (AC: #8)
- [ ] 6.1: Link Concepts to LearningObjectives
  - Create join table or use existing ObjectivePrerequisite relationships
  - Map prerequisite pathways: LearningObjective → Concept → Prerequisite Concept
  - Store mapping in database (denormalized for performance)
- [ ] 6.2: Create GET /api/graph/objectives/:objectiveId/prerequisites endpoint
  - Response: `{ objective: LearningObjective, prerequisitePath: Concept[] }`
  - Traverse prerequisite relationships to build learning path
  - Order concepts by prerequisite depth (foundational → advanced)
  - Include relationship strength scores
- [ ] 6.3: Visualize prerequisite pathways in graph UI
  - "Show Prerequisites" button on concept detail panel
  - Highlight prerequisite path with different edge color (gold)
  - Dim non-prerequisite relationships for clarity
  - Display learning objective names on prerequisite nodes
- [ ] 6.4: Add "Learning Path" view mode
  - Alternative to force-directed layout: hierarchical tree view
  - Root node: Selected learning objective or concept
  - Levels: Prerequisite depth (Level 0 = foundational, Level N = advanced)
  - Use `dagre` or `elk` for automatic tree layout
  - Toggle between force-directed and hierarchical views

### Task 7: Implement Graph Filters and Search (AC: #4)
- [ ] 7.1: Create GraphFilters component
  - Location: `apps/web/src/components/graph/graph-filters.tsx`
  - Filter by category: Multi-select checkboxes (anatomy, physiology, pathology, etc.)
  - Filter by relationship type: Multi-select checkboxes (PREREQUISITE, RELATED, etc.)
  - Filter by content source: Dropdown (all lectures, specific course, First Aid)
  - "Clear filters" button
  - Active filter count badge
- [ ] 7.2: Integrate semantic search into graph view
  - Search bar at top of graph page
  - Real-time search: Debounce 300ms
  - Search concepts by name (fuzzy matching) or semantic similarity (embedding search)
  - Highlight matching concepts in graph (pulsing border)
  - Center view on first search result
- [ ] 7.3: Add "Focus on Concept" feature
  - Search result click → center and zoom to concept
  - Highlight direct relationships (depth 1)
  - Dim unrelated concepts (opacity 0.2)
  - "Show Full Graph" button to reset focus
- [ ] 7.4: Implement graph statistics panel
  - Total concepts count
  - Total relationships count
  - Average relationships per concept
  - Most connected concept (hub node)
  - Coverage by category (pie chart or bar chart)

### Task 8: Performance Optimization and Real-Time Updates (AC: #7)
- [ ] 8.1: Implement graph data caching
  - Cache full graph data in Zustand store
  - TTL: 5 minutes (refresh on navigation back to /graph page)
  - Invalidate cache on new lecture upload or relationship creation
  - Use React Query or SWR for server-state management (optional for MVP)
- [ ] 8.2: Optimize large graph rendering
  - Limit initial render to 100 nodes (pagination or virtualization)
  - "Load more" button or infinite scroll for additional nodes
  - WebGL rendering for graphs >500 nodes (React Flow supports via `react-flow-renderer`)
  - Consider graph clustering for very large graphs (>1000 nodes)
- [ ] 8.3: Implement real-time graph updates
  - Trigger graph rebuild on lecture processing completion
  - Use polling (every 30s) or Server-Sent Events for live updates (optional)
  - Show "Graph updated" notification with "Refresh" button
  - Smooth transition animation when new nodes/edges added
- [ ] 8.4: Add graph export functionality
  - Export as JSON: Full graph data for external analysis
  - Export as PNG: Static image of current graph view (use `html-to-image` library)
  - Export as CSV: Node and edge lists for import to other tools
  - "Download Graph" button in graph toolbar

### Task 9: Testing and Validation (All ACs)
- [ ] 9.1: Test graph construction with sample lectures
  - Upload 5-10 lectures covering different topics (anatomy, physiology)
  - Verify concepts extracted correctly (names, categories)
  - Verify relationships detected (semantic similarity, co-occurrence)
  - Check prerequisite pathways from Story 2.1 data
- [ ] 9.2: Test interactive visualization
  - Zoom, pan, node selection, drill-down
  - Verify force-directed layout is readable (no overlapping nodes)
  - Test relationship strength visual cues (line thickness, proximity)
  - Test filters and search functionality
- [ ] 9.3: Test user annotations
  - Create custom connection between two concepts
  - Add annotation to relationship
  - Edit and delete user-defined relationships
  - Verify system relationships cannot be deleted
- [ ] 9.4: Performance testing
  - Test with 100, 500, 1000 concepts
  - Measure graph load time (target: <2s for 100 nodes, <5s for 500 nodes)
  - Test rendering performance (60fps interaction)
  - Optimize if needed (clustering, pagination, WebGL)
- [ ] 9.5: Integration testing
  - Test graph updates after new lecture upload
  - Test prerequisite pathway integration with learning objectives
  - Test semantic search integration
  - Verify graph data consistency with database

## Dev Notes

### Architecture Context

**Subsystem:** Knowledge Graph & Semantic Search (Subsystem 3)
- Primary implementation in: `apps/web/src/subsystems/knowledge-graph/`
- API routes: `apps/web/src/app/api/graph/`
- UI components: `apps/web/src/components/graph/`

**Technology Stack:**
- **Graph Visualization:** React Flow v12+ (@xyflow/react) - Interactive node-based UI
- **Layout Algorithm:** Force-directed (D3.js) or hierarchical (dagre/elk) for prerequisite trees
- **Vector DB:** PostgreSQL 16 + pgvector extension for semantic similarity
- **Frontend:** React 19, shadcn/ui components, Tailwind CSS
- **State Management:** Zustand for graph state, React Query/SWR for server state (optional)

**Source:** [solution-architecture.md#Section 3, lines 551-575; #Section 7, lines 1740]

### Integration Points

**Existing Infrastructure to Leverage:**
1. **GeminiClient** (from Story 2.1, Story 3.1)
   - Location: `apps/web/src/lib/ai/gemini-client.ts`
   - Reuse for concept embedding generation (1536 dimensions)

2. **SemanticSearchEngine** (from Story 3.1)
   - Location: `apps/web/src/subsystems/knowledge-graph/semantic-search.ts`
   - Reuse for concept similarity search and relationship detection

3. **ChatMockClient** (from Story 2.1)
   - Location: `apps/web/src/lib/ai/chatmock-client.ts`
   - Use for concept extraction and prerequisite detection prompts

4. **ObjectivePrerequisite** (from Story 2.1)
   - Existing prerequisite relationships between learning objectives
   - Map to Concept prerequisite relationships for learning paths

5. **Prisma Schema** (Story 1.5, updated in 2.1)
   - `Concept` and `ConceptRelationship` models exist
   - pgvector extension enabled
   - Vector indexes may need creation

**Source:** [solution-architecture.md#Database Schema lines 973-1013; #Subsystem Integration Patterns lines 673-685]

### Graph Construction Algorithm Details

**Concept Extraction Process:**
1. Analyze ContentChunk data from uploaded lectures
2. Use ChatMock with prompt: "Extract key medical concepts from this text with name, description, category"
3. Generate embeddings for each concept (Gemini 1536d)
4. Deduplicate concepts (merge if name similarity >90% or embedding similarity >0.95)
5. Store in Concept table

**Relationship Detection Methods:**
1. **Semantic Similarity** (RELATED relationships)
   - Calculate cosine distance between concept embeddings
   - Threshold: similarity > 0.75 → create RELATED relationship
   - Strength: normalized similarity score (0.75-1.0 → 0.0-1.0)

2. **Co-occurrence** (INTEGRATED relationships)
   - Count concepts appearing in same ContentChunks
   - Threshold: co-occurrence ≥ 3 chunks → create INTEGRATED relationship
   - Strength: min(co_occurrence_count / 10, 1.0)

3. **Prerequisite Detection** (PREREQUISITE relationships)
   - Use existing ObjectivePrerequisite data from Story 2.1
   - Map learning objectives to concepts (fuzzy name matching)
   - Create PREREQUISITE relationships with direction: prerequisite → dependent
   - Strength: from ObjectivePrerequisite.strength field

4. **Clinical Application** (CLINICAL relationships)
   - Use ChatMock to identify clinical applications in content
   - Prompt: "Identify clinical applications linking these concepts"
   - Manual user annotation also creates CLINICAL relationships
   - Strength: 0.8 (default for ChatMock-detected), 1.0 (user-defined)

**Performance Considerations:**
- Batch concept extraction: Process 10 content chunks at a time
- Incremental updates: Only process new content (avoid full rebuild)
- Relationship caching: Store relationship strengths to avoid recalculation
- Graph pagination: Load nodes in batches for large graphs (>500 nodes)

**Source:** [solution-architecture.md#Subsystem 3, lines 563-565; epics file lines 404-425]

### React Flow Implementation Notes

**Installation:**
```bash
pnpm add @xyflow/react
```

**Component Structure:**
```typescript
// apps/web/src/components/graph/knowledge-graph.tsx
import { ReactFlow, Node, Edge, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  concept: ConceptNode, // Custom node component
};

const edgeTypes = {
  relationship: RelationshipEdge, // Custom edge component
};

export function KnowledgeGraph({ concepts, relationships }: Props) {
  const nodes: Node[] = concepts.map(c => ({
    id: c.id,
    type: 'concept',
    position: calculatePosition(c), // Force-directed layout
    data: { concept: c },
  }));

  const edges: Edge[] = relationships.map(r => ({
    id: r.id,
    source: r.fromConceptId,
    target: r.toConceptId,
    type: 'relationship',
    data: { relationship: r },
    style: {
      strokeWidth: r.strength * 5, // 0.0-1.0 → 0-5px
      stroke: getRelationshipColor(r.relationship),
    },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
}
```

**Custom Node Component:**
```typescript
// apps/web/src/components/graph/concept-node.tsx
import { Handle, Position } from '@xyflow/react';

export function ConceptNode({ data }: { data: { concept: Concept } }) {
  const { concept } = data;
  const color = getCategoryColor(concept.category);
  const size = calculateNodeSize(concept.relationshipCount); // 20-60px

  return (
    <div
      className="rounded-full flex items-center justify-center border-2 shadow-lg"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderColor: `oklch(from ${color} calc(l - 0.2) c h)`,
      }}
    >
      <span className="text-xs font-semibold text-white truncate px-2">
        {concept.name}
      </span>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Force-Directed Layout:**
```typescript
// Use D3.js force simulation or React Flow's built-in layout
import * as d3 from 'd3-force';

function calculatePosition(concept: Concept): { x: number; y: number } {
  // Implement force simulation or use dagre for hierarchical layout
  const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-100))
    .force('link', d3.forceLink(edges).distance(100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .stop();

  // Run simulation iterations
  for (let i = 0; i < 300; i++) simulation.tick();

  return { x: concept.x, y: concept.y };
}
```

**Source:** React Flow docs (https://reactflow.dev/), D3.js docs (https://d3js.org/)

### Medical Concept Categories

**Category Color Scheme:**
- **Anatomy**: Blue (oklch(0.6 0.15 240))
- **Physiology**: Green (oklch(0.6 0.15 140))
- **Pathology**: Red (oklch(0.6 0.15 20))
- **Pharmacology**: Purple (oklch(0.6 0.15 290))
- **Biochemistry**: Yellow (oklch(0.6 0.15 80))
- **Microbiology**: Cyan (oklch(0.6 0.15 200))
- **Immunology**: Magenta (oklch(0.6 0.15 330))
- **Clinical**: Orange (oklch(0.6 0.15 50))

**Relationship Type Color Scheme:**
- **PREREQUISITE**: Orange (directional arrow)
- **RELATED**: Gray (bidirectional)
- **INTEGRATED**: Cyan (bidirectional)
- **CLINICAL**: Magenta (bidirectional)

**Visual Hierarchy:**
- Hub nodes (>10 relationships): Larger size (60px)
- Regular nodes (3-10 relationships): Medium size (40px)
- Peripheral nodes (<3 relationships): Smaller size (20px)

### User Experience Notes

**Graph Navigation:**
- **Zoom**: Mouse wheel or pinch gesture (mobile)
- **Pan**: Click and drag or two-finger drag (mobile)
- **Node selection**: Click node → show details in sidebar
- **Drill-down**: Double-click node → focus on subgraph (depth 2)
- **Reset**: "Reset View" button → center and fit all nodes

**Interaction Feedback:**
- **Hover**: Show concept description tooltip
- **Selected**: Highlight node with pulsing border
- **Related**: Highlight direct relationships when node selected
- **Loading**: Skeleton graph during data fetch
- **Empty state**: "Upload lectures to build your knowledge graph"

**Mobile Optimization:**
- Touch-friendly nodes (minimum 44px tap target)
- Simplified controls (hide advanced filters on mobile)
- Swipeable filters sidebar (drawer component)
- Gesture support (pinch zoom, two-finger pan)

**Error Handling:**
- Graph construction failure: "Unable to build graph, please try again"
- Missing concepts: Show message "No concepts found, upload more content"
- Relationship creation error: "Unable to create connection, check if concepts exist"
- Performance warning: "Large graph detected (>500 nodes), rendering may be slow"

**Source:** [ux-specification.md#Knowledge Graph flow, UX Design Principles]

### Security and Privacy

**Data Privacy:**
- User annotations stored per-user with visibility controls
- Custom relationships private (not shared with other users)
- Graph data derived from user's own content (no cross-user data)

**API Security:**
- Authenticated endpoints: Require user session (deferred for MVP since single user)
- Input validation: Zod schemas for all API requests
- Authorization: User can only modify their own custom relationships
- Rate limiting: 60 graph queries per minute per user (future implementation)

**Source:** [NFR3 Security & Privacy, PRD]

### Testing Strategy

**Unit Tests:**
- `KnowledgeGraphBuilder`: Mock database, verify concept extraction and relationship detection
- API routes: Test request validation, response formatting, error cases
- Graph algorithms: Test force-directed layout, relationship strength calculation

**Integration Tests:**
- End-to-end: Upload lecture → Extract concepts → Build graph → Verify relationships
- Performance: Measure graph construction time and rendering performance
- Edge cases: Empty graph, single concept, circular relationships

**Manual Testing:**
- Graph visualization: Review force-directed layout readability
- User interactions: Test zoom, pan, selection, drill-down
- Custom connections: Create, edit, delete user-defined relationships
- Performance: Test with 100, 500, 1000 concepts

**No automated tests required for MVP** (per solution-architecture.md #Section 2, line 386)

### Project Structure Notes

**New Files to Create:**
```
apps/web/src/
├── subsystems/
│   └── knowledge-graph/
│       └── graph-builder.ts                    # Graph construction engine
├── app/
│   ├── graph/
│   │   └── page.tsx                           # Knowledge graph page
│   └── api/
│       └── graph/
│           ├── concepts/
│           │   ├── route.ts                   # GET /api/graph/concepts
│           │   └── [id]/
│           │       ├── route.ts               # GET /api/graph/concepts/:id
│           │       └── content/
│           │           └── route.ts           # GET /api/graph/concepts/:id/content
│           ├── relationships/
│           │   ├── route.ts                   # POST /api/graph/relationships
│           │   └── [id]/
│           │       └── route.ts               # DELETE /api/graph/relationships/:id
│           └── objectives/
│               └── [id]/
│                   └── prerequisites/
│                       └── route.ts           # GET /api/graph/objectives/:id/prerequisites
└── components/
    └── graph/
        ├── knowledge-graph.tsx                # Main graph visualization
        ├── concept-node.tsx                   # Custom node component
        ├── relationship-edge.tsx              # Custom edge component
        ├── graph-filters.tsx                  # Filter sidebar
        ├── concept-detail-panel.tsx           # Concept details sidebar
        └── create-connection-dialog.tsx       # User annotation UI
```

**Source:** [solution-architecture.md#Section 8, lines 1808-1989]

### References

**Technical Documentation:**
- [solution-architecture.md#Database Schema, lines 973-1013] - Concept and ConceptRelationship models
- [solution-architecture.md#Subsystem 3, lines 551-575] - Knowledge Graph subsystem
- [solution-architecture.md#API Endpoints, lines 1347-1365] - Graph API specification
- [solution-architecture.md#Technology Stack, line 1740] - React Flow for visualization

**Requirements Documentation:**
- [epics-Americano-2025-10-14.md#Story 3.2, lines 404-425] - Original story specification
- [PRD-Americano-2025-10-14.md#FR3, lines 83-87] - Knowledge Graph Foundation requirement
- [PRD-Americano-2025-10-14.md#NFR1, lines 167-171] - Performance requirements (<2s graph load)

**Framework Documentation:**
- React Flow: https://reactflow.dev/ (Interactive node-based UI)
- D3.js Force Simulation: https://d3js.org/d3-force (Force-directed layout)
- Dagre Layout: https://github.com/dagrejs/dagre (Hierarchical layout)

**Previous Stories:**
- Story 2.1: Learning Objective Extraction (ObjectivePrerequisite relationships, prerequisite pathways)
- Story 3.1: Semantic Search Implementation (GeminiClient, embedding generation, vector similarity)

### Known Issues / Risks

**Risk 1: Graph Complexity and Readability**
- Large graphs (>500 concepts) may be cluttered and hard to navigate
- Mitigation: Implement clustering, pagination, or hierarchical views for large graphs
- Consider graph simplification algorithms (remove weak relationships <0.3 strength)

**Risk 2: Relationship Detection Accuracy**
- Semantic similarity may create false positive relationships
- Co-occurrence may miss important relationships
- Mitigation: Allow user to delete incorrect system relationships (add "Report Incorrect" button)
- Collect user feedback to improve relationship detection algorithm

**Risk 3: Performance with Large Graphs**
- React Flow rendering may slow down with >1000 nodes
- Force-directed layout calculation may take >5 seconds
- Mitigation: Implement WebGL rendering, graph virtualization, or server-side layout pre-calculation

**Risk 4: Prerequisite Pathway Complexity**
- Deep prerequisite chains (>5 levels) may be hard to visualize
- Circular dependencies may cause infinite loops
- Mitigation: Limit traversal depth to 3 levels, detect and break circular dependencies

**Decision Required:**
- Force-directed vs. hierarchical layout for default view?
- Recommendation: Force-directed for exploration, hierarchical for prerequisite pathways (toggle between views)

**Future Enhancements:**
- Graph animation: Smooth transitions when nodes/edges added
- Graph clustering: Group related concepts into clusters for large graphs
- Graph export: Export to Cytoscape, Gephi, or other graph analysis tools
- Collaborative annotations: Share custom connections with other users (future multi-user feature)

## Dev Agent Record

### Context Reference

- docs/stories/story-context-3.2.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
