# Pydantic V2 → TypeScript Type Generation

Automated type generation system for Epic 4 API models, ensuring type safety across the Python/TypeScript boundary.

## Overview

This system automatically generates TypeScript interfaces from all Pydantic V2 models in the Python FastAPI service. This eliminates manual type synchronization and prevents API contract drift between the backend (Python) and frontend (TypeScript).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Python FastAPI (Backend)                                       │
│  ├─ src/validation/models.py   (Pydantic V2 Models)            │
│  ├─ src/challenge/models.py    (Pydantic V2 Models)            │
│  ├─ src/adaptive/models.py     (Pydantic V2 Models)            │
│  └─ src/analytics/models.py    (Pydantic V2 Models)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                ┌──────────────────────────────┐
                │  scripts/generate_types.py   │
                │  (Python Script)             │
                │                              │
                │  1. Discover Pydantic models │
                │  2. Generate JSON Schema     │
                │  3. Convert to TypeScript    │
                └──────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Next.js Web App (Frontend)                                     │
│  └─ src/types/api-generated.ts (TypeScript Interfaces)         │
│     ├─ EvaluationResult                                         │
│     ├─ NextQuestionResponse                                     │
│     ├─ ComparisonResult                                         │
│     └─ ... (76 models total)                                    │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Model Discovery
The script automatically finds all Pydantic V2 BaseModel subclasses in the specified modules:
- `src.validation.models` - Story 4.1: Validation models
- `src.challenge.models` - Story 4.3: Challenge models
- `src.adaptive.models` - Story 4.5: Adaptive models
- `src.analytics.models` - Story 4.6: Analytics models

### 2. JSON Schema Generation
For each model, the script:
- Calls `model.model_json_schema()` (Pydantic V2 API)
- Extracts nested `$defs` definitions
- Fixes `$ref` pointers from `#/$defs/X` to `#/definitions/X` (for compatibility)
- Combines all schemas into a unified structure

### 3. TypeScript Generation
Uses `json-schema-to-typescript` (via npx) to:
- Generate TypeScript interfaces for each model
- Preserve type descriptions and constraints
- Create proper union types for literals
- Add JSDoc comments with validation rules

## Usage

### Manual Generation

From the **Python API directory**:
```bash
cd apps/api
python scripts/generate_types.py
```

From the **Next.js web directory**:
```bash
cd apps/web
npm run generate-types
```

### Automatic Generation

Types are automatically regenerated on build:
```bash
cd apps/web
npm run build  # Runs prebuild hook → generate-types
```

## Output

Generated file: `apps/web/src/types/api-generated.ts`

```typescript
/**
 * AUTO-GENERATED FROM PYDANTIC V2 MODELS - DO NOT EDIT MANUALLY
 *
 * Generated: 2025-10-20 17:30:38 UTC
 * Generator: Custom Pydantic V2 → TypeScript converter
 */

export interface EvaluationResult {
  overall_score: number;
  terminology_score: number;
  relationships_score: number;
  application_score: number;
  clarity_score: number;
  strengths: [string, string] | [string, string, string];
  gaps: [string, string] | [string, string, string];
  calibration_delta?: number;
  calibration_note?: string;
  [k: string]: unknown;
}

// ... 76 models total
```

## Using Generated Types

### In API Routes (Next.js)

```typescript
import type { EvaluationResult } from '@/types/api-generated';

export async function POST(request: NextRequest) {
  const response = await fetch('http://localhost:8000/validation/evaluate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Type-safe response
  const result: EvaluationResult = await response.json();

  return NextResponse.json(result);
}
```

### In React Components

```typescript
import type { NextQuestionResponse, IRTMetrics } from '@/types/api-generated';

interface Props {
  question: NextQuestionResponse;
}

export function AdaptiveQuestion({ question }: Props) {
  const irtMetrics: IRTMetrics = question.irt_metrics;

  return (
    <div>
      <p>{question.question.question_text}</p>
      <span>Theta: {irtMetrics.theta.toFixed(2)}</span>
    </div>
  );
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import type { DashboardSummary } from '@/types/api-generated';

export function useDashboard(userId: string) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async (): Promise<DashboardSummary> => {
      const res = await fetch(`/api/analytics/dashboard?userId=${userId}`);
      return res.json();
    },
  });
}
```

## Maintenance

### Adding New Models

1. Create Pydantic model in appropriate module:
   ```python
   # apps/api/src/validation/models.py
   class NewFeatureRequest(BaseModel):
       user_id: str
       feature_params: dict
   ```

2. Regenerate types:
   ```bash
   npm run generate-types
   ```

3. Use in TypeScript:
   ```typescript
   import type { NewFeatureRequest } from '@/types/api-generated';
   ```

### Modifying Existing Models

When you change a Pydantic model:
1. Update the Python model
2. Regenerate types (automatic on build, or run manually)
3. TypeScript compiler will catch any breaking changes
4. Update TypeScript code to match new types

### Troubleshooting

**Types not updating?**
- Run `npm run generate-types` manually
- Check that Python models have no syntax errors
- Verify `json-schema-to-typescript` is installed: `npx json-schema-to-typescript --version`

**TypeScript errors after generation?**
- Check the generated `api-generated.ts` file
- Ensure Pydantic models use proper type hints
- Verify Field validators use Pydantic V2 syntax

**Script fails?**
- Check Python syntax in model files
- Ensure all imports are valid
- Run `python scripts/generate_types.py` with full error output

## Benefits

✅ **Type Safety**: Compile-time checks prevent runtime errors
✅ **No Manual Sync**: Types update automatically from Python models
✅ **Developer Experience**: Autocomplete and IntelliSense in VS Code
✅ **Documentation**: JSDoc comments from Pydantic Field descriptions
✅ **Validation**: Catch API contract breaking changes at compile time
✅ **Refactoring**: Safe renames and type changes across Python/TypeScript

## Technical Details

### Dependencies

**Python** (none required):
- Uses built-in Pydantic V2 `model_json_schema()` method

**Node.js** (devDependency):
- `json-schema-to-typescript` (installed via npm in `apps/web`)

### Compatibility

- **Pydantic**: V2.10+ (uses `model_json_schema()` API)
- **TypeScript**: 5.9+
- **Next.js**: 15+
- **Node.js**: 20+

### Performance

- Generation time: ~5-10 seconds for 76 models
- Scales linearly with number of models
- No runtime overhead (types erased at compile time)

## Related Files

- `apps/api/scripts/generate_types.py` - Main generation script
- `apps/web/src/types/api-generated.ts` - Generated TypeScript types
- `apps/web/package.json` - npm scripts configuration
- `apps/api/requirements.txt` - Python dependencies (none for type generation)

## Future Enhancements

- [ ] Incremental generation (only changed models)
- [ ] Zod schema generation for runtime validation
- [ ] OpenAPI spec generation alongside TypeScript
- [ ] CI/CD integration with automated PR checks
