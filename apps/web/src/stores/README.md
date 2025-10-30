# State Management Architecture

Complete state management layer for Americano using Zustand with URL state synchronization, persistence, and DevTools integration.

## Table of Contents

- [Overview](#overview)
- [Store Structure](#store-structure)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

This state management layer uses:

- **Zustand 5.x**: Lightweight state management with minimal boilerplate
- **nuqs**: Type-safe URL state synchronization
- **Zod**: Runtime validation for persisted state
- **localStorage**: Automatic state persistence with versioning
- **Redux DevTools**: Time-travel debugging in development

## Store Structure

### Available Stores

1. **Analytics Store** (`analytics.ts`)
   - Time range filtering (7d, 30d, 90d, 1y, all)
   - Multi-select objectives
   - Chart preferences (type, granularity)
   - Export format preferences
   - Comparison mode (self vs peers)

2. **Study Store** (`study.ts`)
   - Active session tracking
   - Question navigation and progress
   - Timer state management
   - Interruption recovery
   - Session preferences

3. **Mission Store** (`mission.ts`)
   - Active mission tracking
   - Calendar view preferences
   - Multi-filter support (status, priority, objectives)
   - Search and date range filtering

4. **Preferences Store** (`preferences.ts`)
   - Theme settings (light, dark, system)
   - Notification preferences
   - Email digest settings
   - Dashboard layout preferences
   - Chart style preferences
   - Accessibility settings

## Features

### 1. URL State Synchronization

Analytics filters are automatically synced with URL parameters for shareable links:

```tsx
import { useAnalyticsFilters } from '@/hooks/use-analytics-filters'

function AnalyticsDashboard() {
  const {
    timeRange,
    selectedObjectives,
    setTimeRange,
    setSelectedObjectives,
  } = useAnalyticsFilters()

  // State is automatically synced with URL
  // URL: /analytics?timeRange=7d&objectives=obj1&objectives=obj2
}
```

### 2. localStorage Persistence

Stores automatically persist to localStorage with versioning and migrations:

```tsx
// Persisted data is validated and migrated on load
// Version 0 → Version 1 migration example:
migrate: (persistedState, version) => {
  if (version === 0) {
    return {
      ...persistedState,
      newField: 'default-value'
    }
  }
  return persistedState
}
```

### 3. Hydration Handling

Prevent SSR hydration mismatches with hydration utilities:

```tsx
import { useHasHydrated, HydrationBoundary } from '@/stores/hydration'
import { useAnalyticsStore } from '@/stores/analytics'

function Component() {
  const hasHydrated = useHasHydrated(useAnalyticsStore)

  if (!hasHydrated) {
    return <Skeleton />
  }

  return <Dashboard />
}

// Or use the boundary component
<HydrationBoundary store={useAnalyticsStore} fallback={<Skeleton />}>
  <Dashboard />
</HydrationBoundary>
```

### 4. DevTools Integration

All stores are connected to Redux DevTools in development:

- Time-travel debugging
- Action inspection
- State snapshots
- Named actions for easy tracking

### 5. Type Safety

Full TypeScript support with Zod validation:

```tsx
import { validateAnalyticsState } from '@/stores/schemas'

const result = validateAnalyticsState(unknownData)
if (result.success) {
  const validData = result.data
} else {
  console.error(result.error)
}
```

## Usage Examples

### Basic Store Usage

```tsx
import { useAnalyticsStore, selectTimeRange } from '@/stores/analytics'

function TimeRangeSelector() {
  // Using selector for performance
  const timeRange = useAnalyticsStore(selectTimeRange)
  const setTimeRange = useAnalyticsStore((state) => state.setTimeRange)

  return (
    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
      <option value="90d">Last 90 days</option>
    </select>
  )
}
```

### Study Session Management

```tsx
import { useStudySession } from '@/hooks/use-study-session'

function StudyPage() {
  const {
    start,
    pause,
    resume,
    complete,
    next,
    previous,
    answer,
    currentQuestion,
    progress,
    isActive,
  } = useStudySession()

  const handleStart = () => {
    start(['q1', 'q2', 'q3'], {
      difficulty: 'medium',
      questionsPerSession: 20,
    })
  }

  return (
    <div>
      {isActive ? (
        <>
          <p>Question {progress?.current} of {progress?.total}</p>
          <button onClick={pause}>Pause</button>
          <button onClick={next}>Next</button>
        </>
      ) : (
        <button onClick={handleStart}>Start Session</button>
      )}
    </div>
  )
}
```

### Mission Filters with URL Sync

```tsx
import { useMissionFilters } from '@/hooks/use-mission-filters'

function MissionFilters() {
  const {
    statuses,
    priorities,
    setStatuses,
    setPriorities,
    resetFilters,
    hasActiveFilters,
  } = useMissionFilters()

  return (
    <div>
      <MultiSelect
        value={statuses}
        onChange={setStatuses}
        options={['not-started', 'in-progress', 'completed']}
      />

      {hasActiveFilters && (
        <button onClick={resetFilters}>Clear Filters</button>
      )}
    </div>
  )
}
```

### Preferences Management

```tsx
import { usePreferencesStore } from '@/stores/preferences'

function Settings() {
  const notifications = usePreferencesStore((state) => state.notifications)
  const updateNotifications = usePreferencesStore(
    (state) => state.updateNotifications
  )

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={notifications.studyReminders}
          onChange={(e) =>
            updateNotifications({ studyReminders: e.target.checked })
          }
        />
        Study Reminders
      </label>
    </div>
  )
}
```

### Shareable URLs

```tsx
import { useShareableUrl } from '@/hooks/use-url-state'

function ShareButton() {
  const getShareableUrl = useShareableUrl()

  const handleShare = () => {
    const url = getShareableUrl()
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  return <button onClick={handleShare}>Share Dashboard</button>
}
```

## Best Practices

### 1. Use Selectors for Performance

```tsx
// ✅ Good - Only re-renders when timeRange changes
const timeRange = useAnalyticsStore(selectTimeRange)

// ❌ Bad - Re-renders on any state change
const { timeRange } = useAnalyticsStore()
```

### 2. Batch Updates

```tsx
// ✅ Good - Single re-render
useAnalyticsStore.setState({
  timeRange: '7d',
  selectedObjectives: ['obj1', 'obj2'],
  comparisonMode: 'self',
})

// ❌ Bad - Multiple re-renders
setTimeRange('7d')
setSelectedObjectives(['obj1', 'obj2'])
setComparisonMode('self')
```

### 3. Handle Hydration

```tsx
// ✅ Good - Prevents hydration mismatch
function Component() {
  const hasHydrated = useHasHydrated(useAnalyticsStore)
  if (!hasHydrated) return <Skeleton />
  return <Content />
}

// ❌ Bad - May cause hydration errors
function Component() {
  const state = useAnalyticsStore((state) => state)
  return <Content />
}
```

### 4. Use Custom Hooks

```tsx
// ✅ Good - Encapsulates logic
const filters = useAnalyticsFilters()

// ❌ Bad - Repeated logic everywhere
const timeRange = useAnalyticsStore((state) => state.timeRange)
const [urlState, setUrlState] = useAnalyticsUrlState()
useEffect(() => { /* sync logic */ }, [timeRange])
```

### 5. Validate Persisted Data

```tsx
// ✅ Good - Validates before using
const result = validateAnalyticsState(data)
if (result.success) {
  useAnalyticsStore.setState(result.data)
}

// ❌ Bad - Assumes data is valid
useAnalyticsStore.setState(data)
```

## Migration Guide

### Adding a New Field

```typescript
// 1. Update the store interface
interface AnalyticsState {
  timeRange: TimeRange
  newField: string // Add new field
  // ...
}

// 2. Add default value
const initialState = {
  timeRange: '30d',
  newField: 'default-value',
  // ...
}

// 3. Update persist config
{
  name: 'analytics-storage',
  version: 2, // Increment version
  migrate: (persistedState: any, version) => {
    if (version < 2) {
      // Add new field with default
      return {
        ...persistedState,
        newField: 'default-value',
      }
    }
    return persistedState
  },
}

// 4. Update Zod schema
export const AnalyticsStateSchema = z.object({
  timeRange: TimeRangeSchema,
  newField: z.string().default('default-value'),
  // ...
})
```

### Renaming a Field

```typescript
{
  version: 2,
  migrate: (persistedState: any, version) => {
    if (version === 1) {
      const { oldFieldName, ...rest } = persistedState
      return {
        ...rest,
        newFieldName: oldFieldName,
      }
    }
    return persistedState
  },
}
```

### Changing Field Type

```typescript
{
  version: 2,
  migrate: (persistedState: any, version) => {
    if (version === 1) {
      return {
        ...persistedState,
        // Convert string to number
        priority: parseInt(persistedState.priority, 10),
      }
    }
    return persistedState
  },
}
```

## Testing

### Testing Stores

```tsx
import { act, renderHook } from '@testing-library/react'
import { useAnalyticsStore } from '@/stores/analytics'

describe('Analytics Store', () => {
  beforeEach(() => {
    useAnalyticsStore.persist.clearStorage()
  })

  it('should update time range', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.setTimeRange('7d')
    })

    expect(result.current.timeRange).toBe('7d')
  })
})
```

### Testing Hooks

```tsx
import { renderHook } from '@testing-library/react'
import { useAnalyticsFilters } from '@/hooks/use-analytics-filters'

describe('useAnalyticsFilters', () => {
  it('should sync with URL', async () => {
    const { result } = renderHook(() => useAnalyticsFilters())

    act(() => {
      result.current.setTimeRange('7d')
    })

    // Check URL was updated
    expect(window.location.search).toContain('timeRange=7d')
  })
})
```

## Debugging

### View Store State

```tsx
// In any component
const state = useAnalyticsStore.getState()
console.log('Current state:', state)
```

### Monitor State Changes

```tsx
// Subscribe to all changes
const unsubscribe = useAnalyticsStore.subscribe((state) => {
  console.log('State changed:', state)
})

// Cleanup
unsubscribe()
```

### Clear Persisted State

```tsx
// Clear analytics store
useAnalyticsStore.persist.clearStorage()

// Rehydrate from storage
useAnalyticsStore.persist.rehydrate()
```

## Architecture Decisions

### Why Zustand?

- Minimal boilerplate compared to Redux
- No context provider needed
- Excellent TypeScript support
- Built-in devtools integration
- Easy to test

### Why nuqs?

- Type-safe URL state management
- Automatic serialization/deserialization
- Works with Next.js App Router
- Enables shareable links
- Browser history support

### Why Zod?

- Runtime validation for safety
- Type inference for TypeScript
- Clear error messages
- Schema composition
- Default values

## Contributing

When adding new stores or features:

1. Create store file in `/stores/`
2. Add Zod schema in `/stores/schemas.ts`
3. Create custom hook in `/hooks/`
4. Export from `/stores/index.ts`
5. Add usage examples to this README
6. Add tests for new functionality

## Support

For questions or issues:

1. Check the Zustand docs: https://zustand.docs.pmnd.rs
2. Check the nuqs docs: https://nuqs.47ng.com
3. Review existing store implementations
4. Open an issue with reproduction steps
