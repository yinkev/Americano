# RelationshipsTab Architecture & Component Hierarchy

## Component Tree

```
RelationshipsTab (Main Export)
├─ Loading State: RelationshipsSkeleton
│  ├─ Skeleton Card (Heatmap)
│  ├─ Skeleton Cards (2x - Foundational/Bottleneck)
│  └─ Skeleton Card (Network Graph)
│
├─ Error State: Error Message with AlertCircle
│
└─ Main Content (space-y-6 vertical stack)
   │
   ├─ 1. Correlation Heatmap Card
   │  ├─ CardHeader
   │  │  ├─ Title: "Correlation Heatmap"
   │  │  └─ Description: Interactive instructions
   │  └─ CardContent
   │     ├─ CorrelationHeatmap Component
   │     │  ├─ ResponsiveContainer (Recharts)
   │     │  ├─ ScatterChart
   │     │  │  ├─ XAxis (objectives, rotated -45°)
   │     │  │  ├─ YAxis (objectives)
   │     │  │  ├─ ZAxis (correlation magnitude)
   │     │  │  ├─ Tooltip (custom content)
   │     │  │  └─ Scatter (square cells with color)
   │     │  └─ Legend (4 colors: negative/weak/moderate/strong)
   │     └─ Selected Cell Details (conditionally rendered)
   │
   ├─ 2. Grid: Foundational & Bottleneck (lg:grid-cols-2)
   │  │
   │  ├─ 2a. Foundational Objectives Card (Green theme)
   │  │  ├─ CardHeader
   │  │  │  ├─ Icon: TrendingUp
   │  │  │  ├─ Title: "Foundational Objectives"
   │  │  │  └─ Description
   │  │  └─ CardContent
   │  │     ├─ Empty State (if length === 0)
   │  │     └─ List (space-y-3)
   │  │        └─ Items (map)
   │  │           ├─ Objective Name
   │  │           ├─ Connection Count
   │  │           └─ Green Badge (+N)
   │  │
   │  └─ 2b. Bottleneck Objectives Card (Red theme)
   │     ├─ CardHeader
   │     │  ├─ Icon: AlertCircle
   │     │  ├─ Title: "Bottleneck Objectives"
   │     │  └─ Description
   │     └─ CardContent
   │        ├─ Empty State (if length === 0)
   │        └─ List (space-y-3)
   │           └─ Items (map)
   │              ├─ Objective Name
   │              ├─ Blocking Count
   │              └─ Red Badge (!N)
   │
   ├─ 3. Understanding Network Card
   │  ├─ CardHeader
   │  │  ├─ Icon: Link2
   │  │  ├─ Title: "Understanding Network"
   │  │  └─ Description: Node/edge explanation
   │  └─ CardContent
   │     └─ NetworkGraph Component (D3.js)
   │        ├─ SVG (ref + useEffect)
   │        │  ├─ Force Simulation
   │        │  │  ├─ forceLink (connections)
   │        │  │  ├─ forceManyBody (repulsion)
   │        │  │  ├─ forceCenter (centering)
   │        │  │  └─ forceCollide (overlap prevention)
   │        │  ├─ Links Group (edges)
   │        │  │  └─ Lines (thickness = correlation)
   │        │  ├─ Nodes Group (circles)
   │        │  │  └─ Circles (color by type, draggable)
   │        │  └─ Labels Group (text)
   │        │     └─ Text (truncated names)
   │        └─ Legend (3 colors: foundational/bottleneck/neutral)
   │
   └─ 4. Strategic Study Sequence Card
      ├─ CardHeader
      │  ├─ Icon: ArrowRight
      │  ├─ Title: "Strategic Study Sequence"
      │  └─ Description: AI recommendations
      └─ CardContent
         ├─ Empty State (if length === 0)
         └─ List (space-y-2)
            └─ Items (map)
               ├─ Position Badge (numbered, purple)
               ├─ Objective Name
               ├─ AI Reasoning
               └─ Arrow Icon (between items)
```

## Data Flow

```
API Endpoint
/api/analytics/understanding/correlations
         │
         ├─ GET Request (React Query)
         │  └─ useCorrelations() hook
         │     ├─ queryKey: ['understanding', 'correlations']
         │     ├─ staleTime: 10 minutes
         │     └─ gcTime: 30 minutes
         │
         ├─ Response: CorrelationsResponse (Zod validated)
         │  {
         │    correlationMatrix: number[][];
         │    objectiveNames: string[];
         │    foundational: Array<{objectiveId, objectiveName, outgoingCorrelations}>;
         │    bottlenecks: Array<{objectiveId, objectiveName, blockingCount}>;
         │    sequence: Array<{objectiveId, objectiveName, position, reasoning}>;
         │  }
         │
         └─ Component Props
            ├─ CorrelationHeatmap: matrix, labels, onCellClick
            ├─ NetworkGraph: matrix, labels, foundational[], bottlenecks[]
            ├─ Foundational List: data.foundational[]
            ├─ Bottleneck List: data.bottlenecks[]
            └─ Sequence List: data.sequence[]
```

## State Management

```typescript
// Component State (useState)
const [selectedCell, setSelectedCell] = useState<{
  x: number;
  y: number;
  correlation: number;
} | null>(null);

// React Query State (useCorrelations)
const { data, isLoading, error } = useCorrelations();
// ├─ data: CorrelationsResponse | undefined
// ├─ isLoading: boolean
// └─ error: Error | null

// D3 Internal State (useEffect + useRef)
const svgRef = useRef<SVGSVGElement>(null);
// ├─ Simulation: d3.forceSimulation()
// ├─ Nodes: positions updated by simulation.on('tick')
// └─ Cleanup: simulation.stop() on unmount
```

## Color System (OKLCH)

```typescript
// Color Palette
const colors = {
  // Foundational (Green)
  foundational: 'oklch(0.7 0.15 145)',
  foundationalBg: 'oklch(0.97 0.05 145)',
  foundationalBorder: 'oklch(0.85 0.10 145)',

  // Bottleneck (Red)
  bottleneck: 'oklch(0.65 0.20 25)',
  bottleneckBg: 'oklch(0.97 0.10 25)',
  bottleneckBorder: 'oklch(0.85 0.15 25)',

  // Neutral/Negative (Blue)
  neutral: 'oklch(0.6 0.18 230)',

  // Heatmap Scale
  negative: 'oklch(0.6 0.18 230)',    // Blue
  weak: 'oklch(0.85 0.05 240)',       // Light Gray
  moderate: 'oklch(0.75 0.12 85)',    // Yellow
  strong: 'oklch(0.7 0.15 50)',       // Orange
  veryStrong: 'oklch(0.65 0.20 25)',  // Red

  // Sequence (Purple)
  sequence: 'oklch(0.6 0.18 280)',

  // UI Elements
  text: 'oklch(0.4 0.05 240)',
  textSecondary: 'oklch(0.5 0.05 240)',
  textTertiary: 'oklch(0.6 0.05 240)',
  border: 'oklch(0.85 0.05 240)',
  background: 'oklch(0.95 0.05 240)',
};
```

## Performance Optimizations

1. **React Query Caching**
   - staleTime: 10 minutes (data doesn't change frequently)
   - gcTime: 30 minutes (keep in memory longer)
   - Automatic background refetching disabled

2. **D3 Simulation**
   - Only processes correlations > 0.3 (reduces edge count)
   - Cleanup function stops simulation on unmount
   - Collision detection prevents node overlap

3. **Conditional Rendering**
   - Empty states avoid rendering empty lists
   - Network graph only renders when data exists
   - Selected cell details only shown when cell clicked

4. **Responsive Design**
   - Grid switches from 1-column (mobile) to 2-column (lg)
   - SVG scales to container width
   - Heatmap height adapts to objective count

## Integration Points

### Story 4.6 Dependencies
- **Task 2**: Uses global filters from UnderstandingDashboard
- **Task 10**: API endpoint `/api/analytics/understanding/correlations`
- **Task 11**: Integrated as tab in main dashboard layout
- **Task 12**: Benefits from Redis caching (API level)

### Story 3.2 Integration (Future)
- Data structure supports Knowledge Graph overlay
- `objectiveId` can be mapped to concept nodes
- Correlation matrix can be combined with prerequisite relationships

### Cross-Story Data Sources
- **Story 4.1**: Comprehension scores feed correlation calculations
- **Story 4.2**: Clinical reasoning scores contribute to correlations
- **Story 4.4**: Calibration data can influence bottleneck detection
- **Story 4.5**: Mastery status affects foundational classification

## Accessibility Features

✅ **ARIA Labels**
- Badge: `aria-label="Foundational: N connections"`
- SVG: `aria-label="Network graph of objective relationships"`

✅ **Semantic HTML**
- Proper heading hierarchy (CardTitle)
- List structure for foundational/bottleneck items
- Meaningful alt text and titles

✅ **Keyboard Navigation**
- All interactive elements focusable
- Drag interaction (D3) keyboard-accessible via title tooltips

✅ **Visual Design**
- Color + pattern (not color alone)
- Sufficient contrast ratios (WCAG AA)
- 44px touch targets for mobile

✅ **Screen Reader Support**
- Descriptive text for empty states
- Correlation values announced in tooltip
- Clear component purpose in descriptions

## File Locations

```
/apps/web/
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   │   └── tabs/
│   │   │       └── RelationshipsTab.tsx  ← MAIN IMPLEMENTATION
│   │   └── ui/
│   │       ├── badge.tsx                 ← Used for badges
│   │       └── card.tsx                  ← Used for cards
│   ├── hooks/
│   │   └── use-understanding-analytics.ts ← useCorrelations() hook
│   ├── lib/
│   │   └── validation.ts                 ← CorrelationsResponse schema
│   └── app/
│       └── api/
│           └── analytics/
│               └── understanding/
│                   └── correlations/
│                       └── route.ts      ← API endpoint
└── package.json                          ← d3 + @types/d3 added
```

---

**Last Updated**: 2025-10-17
**Status**: Production-Ready
**Test Coverage**: Manual testing recommended, unit tests pending
