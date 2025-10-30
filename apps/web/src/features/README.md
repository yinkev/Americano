# Features

## Overview

This directory contains all feature modules for the Americano web application. Each feature is organized as a self-contained module with its own components, hooks, types, and business logic.

## Feature Structure

Each feature follows this standardized structure:

```
feature-name/
├── components/           # React components specific to this feature
│   ├── sub-feature/     # Sub-feature groupings (if applicable)
│   ├── shared/          # Shared components within the feature
│   └── index.ts         # Barrel export
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── pages/               # Page-level components (optional)
├── api/                 # API query functions (optional)
└── README.md           # Feature documentation
```

## Available Features

### ✅ Analytics

Comprehensive analytics and insights for learning performance.

**Status:** Active development
**Sub-features:**
- Behavioral Insights - Learning pattern analysis
- Learning Patterns - Study behavior visualization
- Experiments - A/B testing framework

[View Documentation](./analytics/README.md)

### 🚧 Validation

Spaced repetition and active recall validation system.

**Status:** Planned
**Purpose:** Knowledge validation and retention testing

[View Documentation](./validation/README.md)

### 🚧 Adaptive

Adaptive learning algorithms and personalization.

**Status:** Planned
**Purpose:** Difficulty adjustment and personalized learning paths

[View Documentation](./adaptive/README.md)

### 🚧 Study

Core study session management and content delivery.

**Status:** Planned (refactoring existing components)
**Purpose:** Primary learning interface

[View Documentation](./study/README.md)

### 🚧 Graph

Knowledge graph visualization and navigation.

**Status:** Planned
**Purpose:** Visual representation of knowledge connections

[View Documentation](./graph/README.md)

## Development Guidelines

### Adding a New Feature

1. Create the feature directory structure
2. Add a README.md documenting the feature
3. Create barrel exports (index.ts) at each level
4. Update this main README with the new feature
5. Update tsconfig paths if needed

### Component Organization

- **Single Responsibility**: Each component should have one clear purpose
- **Feature Isolation**: Features should be self-contained and minimize cross-feature dependencies
- **Shared Components**: Use `/components/ui` for truly global components
- **Feature Sharing**: Consider extracting to `/components/shared` if used across 3+ features

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAnalytics.ts`)
- **Types**: PascalCase (e.g., `UserProfile.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

### Import Patterns

```typescript
// ✅ Good - Import from feature barrel
import { LearningPatternsGrid } from '@/features/analytics'

// ✅ Good - Import from sub-feature when needed
import { RecommendationsPanel } from '@/features/analytics/components/behavioral-insights'

// ❌ Bad - Don't reach into internal structure
import { RecommendationsPanel } from '@/features/analytics/components/behavioral-insights/recommendations-panel'
```

### Testing

- Write unit tests for hooks and utilities
- Write integration tests for complex component interactions
- Mock external dependencies (API calls, etc.)
- Test files should live alongside source files

### TypeScript

- Use strict mode
- Define types in feature `/types` directory
- Share common types via barrel exports
- Avoid `any` - use `unknown` for truly unknown types

## Related Documentation

- [Component Library](/apps/web/src/components/README.md)
- [API Documentation](/docs/api/)
- [Architecture Decisions](/docs/architecture/)

## Migration Status

This is an ongoing refactoring effort to organize the codebase into feature-based modules. The Analytics feature is the first to be completed. Other features will be migrated incrementally.

**Completed:**
- ✅ Analytics feature structure
- ✅ Behavioral insights components
- ✅ Learning patterns components
- ✅ Experiments components

**In Progress:**
- 🚧 Study session components
- 🚧 Validation components

**Planned:**
- 📋 Graph visualization components
- 📋 Adaptive learning components
