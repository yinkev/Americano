# Conflict Detection UI - Quick Start Guide

Fast reference for implementing Story 3.4 conflict detection components.

## 30-Second Setup

```tsx
import {
  ConflictIndicator,
  ConflictDetailModal,
  useConflictNotifications,
  ConflictNotificationBadge,
} from '@/components/conflicts'

function MyComponent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedConflictId, setSelectedConflictId] = useState('')
  const { showConflict, setViewHandler } = useConflictNotifications()

  // Set up notification handler
  useEffect(() => {
    setViewHandler((id) => {
      setSelectedConflictId(id)
      setModalOpen(true)
    })
  }, [])

  return (
    <>
      {/* Indicator on content chunks */}
      <ConflictIndicator
        severity={ConflictSeverity.HIGH}
        count={3}
        onClick={() => setModalOpen(true)}
      />

      {/* Detail modal */}
      <ConflictDetailModal
        conflictId={selectedConflictId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Navigation badge */}
      <ConflictNotificationBadge
        count={5}
        onClick={() => router.push('/conflicts')}
      />
    </>
  )
}
```

## Component Cheat Sheet

### ConflictIndicator

**When**: Show on content chunks with conflicts
**Size**: 44px min (accessibility)
**Colors**: LOW=yellow, MEDIUM=orange, HIGH=red, CRITICAL=pulsing red

```tsx
<ConflictIndicator
  severity={ConflictSeverity.CRITICAL}
  count={2}
  onClick={handleClick}
  compact={false} // true for icon-only
/>
```

### ConflictDetailModal

**When**: User clicks indicator or notification
**Features**: 3 tabs (Comparison, AI Analysis, History)
**APIs**: Fetches from GET /api/conflicts/:id

```tsx
<ConflictDetailModal
  conflictId="conflict_123"
  isOpen={open}
  onClose={() => setOpen(false)}
  onFlag={async (id, notes) => { /* flag logic */ }}
  onResolve={async (id, sourceId, evidence) => { /* resolve logic */ }}
  onDismiss={async (id, reason) => { /* dismiss logic */ }}
/>
```

### Notifications

**When**: Real-time conflict detection
**Display**: 6s normal, 10s critical
**Batch**: Auto-groups multiple conflicts

```tsx
// Single conflict
showConflictToast(conflict, (id) => openModal(id))

// Multiple conflicts
showBatchConflictToast(conflicts, () => router.push('/conflicts'))

// Hook version
const { showConflict } = useConflictNotifications()
showConflict(newConflict)
```

### NotificationBadge

**When**: Navigation bar, sidebar
**Auto-hide**: When count = 0
**Max**: Shows "99+" for >99

```tsx
<ConflictNotificationBadge
  count={unreadCount}
  onClick={() => router.push('/conflicts')}
/>
```

## Color Reference (OKLCH)

```typescript
// Severity Colors
LOW:      oklch(0.75 0.15 95)  // Yellow
MEDIUM:   oklch(0.70 0.18 45)  // Orange
HIGH:     oklch(0.60 0.22 25)  // Red
CRITICAL: oklch(0.50 0.25 15)  // Dark Red + Pulse

// Credibility Colors (0-100 scale)
90-100: oklch(0.60 0.15 145)   // Green (High)
75-89:  oklch(0.65 0.12 85)    // Yellow-Green (Good)
60-74:  oklch(0.70 0.15 60)    // Yellow (Medium)
40-59:  oklch(0.65 0.18 40)    // Orange (Low)
0-39:   oklch(0.60 0.22 25)    // Red (Very Low)
```

## Props at a Glance

```typescript
// ConflictIndicator
severity: ConflictSeverity         // Required
count?: number                     // Default: 1
onClick: () => void                // Required
compact?: boolean                  // Default: false

// ConflictDetailModal
conflictId: string                 // Required
isOpen: boolean                    // Required
onClose: () => void                // Required
onFlag?: (id, notes?) => Promise   // Optional
onResolve?: (id, srcId, ev?) => Promise  // Optional
onDismiss?: (id, reason?) => Promise    // Optional

// ConflictNotificationBadge
count: number                      // Required
onClick?: () => void               // Optional
```

## Common Patterns

### Pattern 1: Content Chunk with Conflicts

```tsx
function ContentChunk({ chunk, conflicts }) {
  const chunkConflicts = conflicts.filter(c => c.sourceA.id === chunk.id)

  return (
    <div>
      <p>{chunk.text}</p>
      {chunkConflicts.length > 0 && (
        <ConflictIndicatorList
          conflicts={chunkConflicts}
          onConflictClick={(id) => openModal(id)}
        />
      )}
    </div>
  )
}
```

### Pattern 2: Global Notification Listener

```tsx
function App() {
  const { showConflicts, setViewHandler } = useConflictNotifications()

  useEffect(() => {
    // Set up handler
    setViewHandler((id) => router.push(`/conflicts/${id}`))

    // Listen for WebSocket events
    const ws = new WebSocket('ws://localhost:3000/api/conflicts/stream')
    ws.onmessage = (event) => {
      const conflicts = JSON.parse(event.data)
      showConflicts(conflicts, () => router.push('/conflicts'))
    }

    return () => ws.close()
  }, [])

  return <YourApp />
}
```

### Pattern 3: Conflict Dashboard

```tsx
function ConflictDashboard() {
  const [conflicts, setConflicts] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  return (
    <div>
      {/* Filter bar */}
      <ConflictFilters onChange={fetchConflicts} />

      {/* Conflict list */}
      {conflicts.map(conflict => (
        <div key={conflict.id}>
          <h3>{conflict.conceptName}</h3>
          <ConflictIndicator
            severity={conflict.severity}
            onClick={() => setSelectedId(conflict.id)}
          />
        </div>
      ))}

      {/* Detail modal */}
      <ConflictDetailModal
        conflictId={selectedId}
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
```

## Accessibility Checklist

- ✅ All buttons have min 44px touch target
- ✅ All icons have aria-hidden="true"
- ✅ All interactive elements have aria-label
- ✅ Keyboard navigation works (Tab, Enter, ESC)
- ✅ Focus indicators visible (ring-2)
- ✅ Color contrast meets WCAG AA (4.5:1)
- ✅ Screen reader announces all critical info

## API Integration

Components expect these backend endpoints:

```typescript
// GET /api/conflicts/:id
// Returns: { conflict, sourceAMeta, sourceBMeta, analysis }

// POST /api/conflicts/flag
// Body: { conflictId, notes }
// Returns: { conflict, flaggedBy }

// POST /api/conflicts/:id/resolve
// Body: { preferredSourceId, evidence }
// Returns: { conflict, resolution }

// POST /api/conflicts/:id/dismiss
// Body: { reason }
// Returns: { conflict }
```

## Troubleshooting

**Modal won't open?**
- Check conflictId is valid
- Ensure isOpen prop is true
- Check API endpoint returns data

**Colors not showing?**
- Verify OKLCH colors in globals.css
- Check Tailwind v4 configuration
- Ensure no gradient overrides

**Notifications not appearing?**
- Import toast from 'sonner'
- Add <Toaster /> to root layout
- Check notification queue

**Touch targets too small?**
- All buttons should be min 44px
- Use className to override if needed
- Check parent container constraints

## Need Help?

1. Check [README.md](./README.md) for full documentation
2. Review [TASK-3-COMPLETION-REPORT.md](../../TASK-3-COMPLETION-REPORT.md)
3. Examine component source code comments
4. Check TypeScript interfaces in `@/types/conflicts`

**Version**: 1.0.0
**Last Updated**: 2025-10-16
