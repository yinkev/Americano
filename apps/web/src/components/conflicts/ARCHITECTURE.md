# Conflict Detection UI - Component Architecture

Visual guide to component relationships and data flow.

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Root                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            useConflictNotifications()                   │ │
│  │  • Global notification queue management                 │ │
│  │  • WebSocket listener integration                       │ │
│  │  • View handler configuration                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          ConflictNotificationBadge                      │ │
│  │  • Navigation bar indicator                             │ │
│  │  • Unread count display                                 │ │
│  │  • Pulsing animation                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Content Page/View                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Content Chunks (Study Materials)                │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │       ConflictIndicator / List                    │  │ │
│  │  │  • Severity badges (LOW→CRITICAL)                 │  │ │
│  │  │  • Conflict count display                         │  │ │
│  │  │  • Click to open modal                            │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ onClick
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                ConflictDetailModal (Radix Dialog)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tab 1: Comparison                                      │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │      ConflictComparisonView                       │  │ │
│  │  │  ┌──────────────────┬──────────────────┐          │  │ │
│  │  │  │   Source A       │    Source B      │          │  │ │
│  │  │  │  • Metadata      │   • Metadata     │          │  │ │
│  │  │  │  • Credibility   │   • Credibility  │          │  │ │
│  │  │  │  • EBM Level     │   • EBM Level    │          │  │ │
│  │  │  │  • Content       │   • Content      │          │  │ │
│  │  │  │  • Highlights    │   • Highlights   │          │  │ │
│  │  │  └──────────────────┴──────────────────┘          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tab 2: AI Analysis                                     │ │
│  │  • Medical context                                      │ │
│  │  • Key differences                                      │ │
│  │  • Resolution suggestions (GPT-5)                       │ │
│  │  • Clinical implications                                │ │
│  │  • Recommended action                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tab 3: History                                         │ │
│  │  • Detection timeline                                   │ │
│  │  • Flagging events                                      │ │
│  │  • Resolution events                                    │ │
│  │  • Resolution details                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Action Buttons                                         │ │
│  │  [Dismiss] [Flag for Review] [Accept Resolution]       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ onResolve / onFlag / onDismiss
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Routes                        │
│  • POST /api/conflicts/flag                                 │
│  • POST /api/conflicts/:id/resolve                          │
│  • POST /api/conflicts/:id/dismiss                          │
│  • GET  /api/conflicts/:id                                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────┐
│  Backend Agent   │
│  (Conflict       │
│   Detection)     │
└────────┬─────────┘
         │
         │ WebSocket / Polling
         ▼
┌──────────────────────────────────────────────┐
│  useConflictNotifications Hook               │
│  • Receives new conflict events              │
│  • Queues notifications                      │
│  • Triggers toast display                    │
└────────┬─────────────────────────────────────┘
         │
         │ showConflictToast()
         ▼
┌──────────────────────────────────────────────┐
│  Toast Notification (Sonner)                 │
│  • Displays conflict summary                 │
│  • [View Details] button                     │
└────────┬─────────────────────────────────────┘
         │
         │ onClick handler
         ▼
┌──────────────────────────────────────────────┐
│  ConflictDetailModal                         │
│  • Fetches: GET /api/conflicts/:id           │
│  • Displays: ConflictComparisonView          │
│  • Actions: Flag, Resolve, Dismiss           │
└────────┬─────────────────────────────────────┘
         │
         │ User Action
         ▼
┌──────────────────────────────────────────────┐
│  API Request                                 │
│  • POST /api/conflicts/flag                  │
│  • POST /api/conflicts/:id/resolve           │
│  • POST /api/conflicts/:id/dismiss           │
└────────┬─────────────────────────────────────┘
         │
         │ Response
         ▼
┌──────────────────────────────────────────────┐
│  UI Update                                   │
│  • Refresh conflict data                     │
│  • Update status badge                       │
│  • Close modal (if dismissed)                │
└──────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│  Component State                                         │
│                                                          │
│  ConflictDetailModal:                                   │
│    const [conflict, setConflict] = useState<Conflict>() │
│    const [loading, setLoading] = useState(false)        │
│    const [error, setError] = useState<string | null>()  │
│                                                          │
│  useConflictNotifications:                              │
│    const [queue, setQueue] = useState<Conflict[]>([])   │
│    const [handler, setHandler] = useState<Function>()   │
│                                                          │
│  Parent Component:                                      │
│    const [modalOpen, setModalOpen] = useState(false)    │
│    const [conflictId, setConflictId] = useState('')     │
│    const [unreadCount, setUnreadCount] = useState(0)    │
└─────────────────────────────────────────────────────────┘
```

## Props Flow Diagram

```
Parent Component
├─ ConflictIndicator
│  ├─ severity: ConflictSeverity ──────────► Color coding
│  ├─ count: number ───────────────────────► Badge display
│  └─ onClick: () => void ─────────────────► Modal trigger
│
├─ ConflictDetailModal
│  ├─ conflictId: string ──────────────────► API fetch
│  ├─ isOpen: boolean ─────────────────────► Dialog state
│  ├─ onClose: () => void ─────────────────► Close handler
│  ├─ onFlag: (id, notes) => Promise ──────► Flag action
│  ├─ onResolve: (id, srcId, ev) => Promise ► Resolve action
│  └─ onDismiss: (id, reason) => Promise ──► Dismiss action
│     │
│     └─► ConflictComparisonView
│        ├─ sourceA: ConflictContent ───────► Left column
│        ├─ sourceB: ConflictContent ───────► Right column
│        ├─ sourceAMeta: Source ────────────► Metadata A
│        ├─ sourceBMeta: Source ────────────► Metadata B
│        ├─ similarityScore: number ────────► Score display
│        ├─ contradictionPattern: string ───► Pattern tag
│        └─ conflictType: ConflictType ─────► Type badge
│
└─ ConflictNotificationBadge
   ├─ count: number ──────────────────────────► Badge number
   └─ onClick: () => void ────────────────────► Navigation
```

## Component Dependencies

```
┌─────────────────────────────────────────────────┐
│  External Dependencies                          │
├─────────────────────────────────────────────────┤
│  • @radix-ui/react-dialog    (Modal)           │
│  • lucide-react              (Icons)           │
│  • sonner                    (Toasts)          │
│  • class-variance-authority  (Variants)        │
│  • react                     (Core)            │
│  • next                      (Framework)       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Internal UI Components (shadcn/ui)             │
├─────────────────────────────────────────────────┤
│  • Badge                     (Severity tags)   │
│  • Button                    (Actions)         │
│  • Card                      (Containers)      │
│  • Dialog                    (Modal wrapper)   │
│  • Separator                 (Dividers)        │
│  • Skeleton                  (Loading)         │
│  • Tabs                      (Tab interface)   │
│  • Alert                     (Messages)        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Type Definitions                               │
├─────────────────────────────────────────────────┤
│  • @/types/conflicts         (All types)       │
│  • ConflictSeverity          (Enum)            │
│  • ConflictType              (Enum)            │
│  • ConflictStatus            (Enum)            │
│  • Conflict                  (Interface)       │
│  • Source                    (Interface)       │
│  • ConflictAnalysis          (Interface)       │
└─────────────────────────────────────────────────┘
```

## Event Flow Timeline

```
Time: 0ms
┌──────────────────────────────────────┐
│  Backend detects conflict            │
└────────────┬─────────────────────────┘
             │
Time: 10ms   ▼
┌──────────────────────────────────────┐
│  WebSocket event emitted             │
└────────────┬─────────────────────────┘
             │
Time: 20ms   ▼
┌──────────────────────────────────────┐
│  useConflictNotifications receives   │
│  Adds to queue                       │
└────────────┬─────────────────────────┘
             │
Time: 30ms   ▼
┌──────────────────────────────────────┐
│  showConflictToast() called          │
│  Toast appears                       │
└────────────┬─────────────────────────┘
             │
Time: 6000ms ▼ (User clicks "View Details")
┌──────────────────────────────────────┐
│  Toast dismissed                     │
│  setModalOpen(true)                  │
│  setConflictId('conflict_123')       │
└────────────┬─────────────────────────┘
             │
Time: 6010ms ▼
┌──────────────────────────────────────┐
│  ConflictDetailModal renders         │
│  useEffect triggers API fetch        │
└────────────┬─────────────────────────┘
             │
Time: 6015ms ▼
┌──────────────────────────────────────┐
│  GET /api/conflicts/:id              │
└────────────┬─────────────────────────┘
             │
Time: 6215ms ▼ (200ms API response)
┌──────────────────────────────────────┐
│  Data received                       │
│  setConflict(data)                   │
│  setLoading(false)                   │
└────────────┬─────────────────────────┘
             │
Time: 6220ms ▼
┌──────────────────────────────────────┐
│  ConflictComparisonView renders      │
│  User sees full details              │
└────────────┬─────────────────────────┘
             │
Time: 8000ms ▼ (User clicks "Accept Resolution")
┌──────────────────────────────────────┐
│  handleResolve() called              │
│  setActionLoading('resolve')         │
└────────────┬─────────────────────────┘
             │
Time: 8005ms ▼
┌──────────────────────────────────────┐
│  POST /api/conflicts/:id/resolve     │
└────────────┬─────────────────────────┘
             │
Time: 8255ms ▼ (250ms API response)
┌──────────────────────────────────────┐
│  Conflict resolved                   │
│  fetchConflictData() to refresh      │
│  setActionLoading(null)              │
└────────────┬─────────────────────────┘
             │
Time: 8260ms ▼
┌──────────────────────────────────────┐
│  Updated data displayed              │
│  Status badge shows "RESOLVED"       │
└──────────────────────────────────────┘
```

## Responsive Breakpoints

```
┌─────────────────────────────────────────────────┐
│  Mobile (< 640px)                               │
├─────────────────────────────────────────────────┤
│  • ConflictComparisonView: Single column       │
│  • Modal: Full screen, scrollable              │
│  • Indicators: Compact mode preferred          │
│  • Touch targets: 44px minimum                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Tablet (640px - 1024px)                        │
├─────────────────────────────────────────────────┤
│  • ConflictComparisonView: Two columns         │
│  • Modal: 90% width, max 800px                 │
│  • All features available                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Desktop (> 1024px)                             │
├─────────────────────────────────────────────────┤
│  • ConflictComparisonView: Two columns         │
│  • Modal: Max width 1200px (6xl)               │
│  • Optimal spacing and layout                  │
└─────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────┐
│  API Request Initiated              │
└────────┬────────────────────────────┘
         │
         ├─► Success Path
         │   └─► setData(response)
         │       └─► Render content
         │
         └─► Error Path
             ├─► Network Error
             │   └─► setError("Network error")
             │       └─► Display Alert
             │
             ├─► 404 Not Found
             │   └─► setError("Conflict not found")
             │       └─► Display Alert
             │
             ├─► 500 Server Error
             │   └─► setError("Server error")
             │       └─► Display Alert
             │
             └─► Timeout
                 └─► setError("Request timeout")
                     └─► Display Alert + Retry button
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────┐
│  Initial Load                                   │
├─────────────────────────────────────────────────┤
│  1. Lazy load modal (only when opened)         │
│  2. Code split notification system             │
│  3. Defer non-critical data fetches            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Runtime Optimization                           │
├─────────────────────────────────────────────────┤
│  1. React.useCallback for event handlers       │
│  2. React.useMemo for complex calculations     │
│  3. Debounce notification queue (100ms)        │
│  4. Cache API responses (5min TTL)             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Future Enhancements                            │
├─────────────────────────────────────────────────┤
│  1. Virtual scrolling for large lists          │
│  2. Service Worker caching                     │
│  3. Optimistic UI updates                      │
│  4. WebSocket connection pooling               │
└─────────────────────────────────────────────────┘
```

## Integration Points

```
┌────────────────────────────────────────────┐
│  Conflict Detection Components             │
└───────────┬────────────────────────────────┘
            │
            ├─► Backend APIs (Task 4)
            │   ├─ GET /api/conflicts/:id
            │   ├─ POST /api/conflicts/flag
            │   ├─ POST /api/conflicts/:id/resolve
            │   └─ POST /api/conflicts/:id/dismiss
            │
            ├─► Knowledge Graph (Story 3.2)
            │   └─ Concept relationships
            │
            ├─► Semantic Search (Story 3.1)
            │   └─ Similar content detection
            │
            ├─► First Aid Integration (Story 3.3)
            │   └─ Source credibility data
            │
            └─► Dashboard (Story 3.6)
                └─ Conflict statistics widget
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-16
**Maintainer**: Frontend Developer Agent (Story 3.4)
