# Analytics Feature

## Overview

The Analytics feature provides comprehensive analytics and insights functionality for Americano's learning platform. This feature is organized into multiple sub-features, each focusing on a specific aspect of learning analytics.

## Structure

```
analytics/
├── components/           # UI components
│   ├── behavioral-insights/   # Behavioral pattern analysis
│   ├── learning-patterns/      # Learning pattern visualization
│   ├── experiments/            # A/B testing & experiments
│   └── shared/                 # Shared analytics components
├── hooks/               # Custom React hooks for analytics
├── pages/               # Page-level components (if needed)
├── types/               # TypeScript type definitions
└── api/                 # API query functions
```

## Sub-Features

### Behavioral Insights

Components for analyzing and displaying behavioral patterns in learning:

- **LearningPatternsGrid** - Grid view of detected learning patterns
- **PatternEvolutionTimeline** - Timeline showing pattern evolution over time
- **PerformanceCorrelationChart** - Performance correlation analysis
- **BehavioralGoalsSection** - Goal tracking and management
- **RecommendationsPanel** - Personalized behavioral recommendations
- **LearningArticleReader** - Educational content reader

**Used in:** `/analytics/behavioral-insights` page

### Learning Patterns

Components for visualizing learning patterns and study behaviors:

- **StudyTimeHeatmap** - Heatmap of study time distribution
- **SessionPerformanceChart** - Session-by-session performance tracking
- **LearningStyleProfile** - Learning style analysis
- **ForgettingCurveVisualization** - Forgetting curve visualization
- **BehavioralInsightsPanel** - Quick behavioral insights panel

**Used in:** `/analytics/learning-patterns` page

### Experiments

Components for A/B testing and experiment management:

- **ExperimentControlPanel** - Experiment management controls
- **ExperimentMetricsTable** - Metrics and results table
- **ExperimentVariantComparison** - Variant comparison charts

**Used in:** `/analytics/experiments` page

## Usage

Import components using the barrel exports:

```typescript
// Import from sub-feature
import {
  LearningPatternsGrid,
  PatternEvolutionTimeline,
} from '@/features/analytics/components/behavioral-insights'

// Or import from main feature barrel
import { LearningPatternsGrid } from '@/features/analytics'
```

## Development Guidelines

1. **Component Organization**
   - Keep components focused and single-purpose
   - Use shared components for common analytics UI patterns
   - Place feature-specific components in appropriate sub-feature folders

2. **Type Safety**
   - Define types in `/types` directory
   - Share common analytics types across sub-features
   - Use TypeScript strict mode

3. **State Management**
   - Use custom hooks for data fetching and state
   - Keep state close to where it's used
   - Consider Zustand for complex shared state

4. **Performance**
   - Lazy load heavy charts and visualizations
   - Memoize expensive calculations
   - Use React.memo for chart components

5. **Testing**
   - Test components in isolation
   - Mock API calls in component tests
   - Test data transformation logic separately

## Dependencies

- Recharts/Vitest for data visualization
- React Query for data fetching (if implemented)
- Shadcn/ui components for UI primitives

## Related Documentation

- [API Documentation](/docs/api/)
- [Analytics API Routes](/apps/api/src/analytics/)
- [Frontend API Client](/docs/frontend/typed-client.md)
