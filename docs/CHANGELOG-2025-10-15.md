# Changelog - October 15, 2025

## Dependency Updates and Technical Debt Cleanup

**Date:** 2025-10-15
**Type:** Major dependency updates, breaking changes resolved, technical debt cleanup
**Status:** Completed ✅

---

## Summary

All dependencies updated to latest versions (2025), with Zod upgraded from v3 to v4, requiring breaking change fixes. Next.js configuration modernized, TypeScript compilation verified clean, and dev server running without warnings.

---

## Changes Made

### 1. Dependency Updates

#### Core Dependencies
| Package | Old Version | New Version | Breaking Changes |
|---------|------------|-------------|------------------|
| **zod** | 3.25.76 | **4.1.12** | ✅ Yes - See section below |
| **@hookform/resolvers** | Custom beta | **5.2.2** (stable) | ✅ Yes - Zod 4 compatible |
| **next** | - | **15.5.5** | No |
| **react** | - | **19.2.0** | No |
| **react-dom** | - | **19.2.0** | No |
| **tailwindcss** | - | **4.1.14** | No |
| **typescript** | - | **5.9.3** | No |

All other dependencies updated to latest stable versions via `pnpm update --latest`.

---

### 2. Zod 4 Breaking Changes Fixed

#### Breaking Change 1: `error.errors` → `error.issues`

**File:** `src/lib/validation.ts`

**Before (Zod 3):**
```typescript
if (error instanceof z.ZodError) {
  throw ApiError.validation('Invalid request data', {
    errors: error.errors.map((err) => ({  // ❌ 'errors' doesn't exist in Zod 4
      path: err.path.join('.'),
      message: err.message,
    })),
  });
}
```

**After (Zod 4):**
```typescript
if (error instanceof z.ZodError) {
  throw ApiError.validation('Invalid request data', {
    errors: error.issues.map((err: any) => ({  // ✅ 'issues' is the correct property
      path: err.path.join('.'),
      message: err.message,
    })),
  });
}
```

**Impact:** All validation error handling now uses `error.issues` instead of `error.errors`.

---

#### Breaking Change 2: `.default()` Must Be Before `.transform()`

**File:** `src/lib/validation.ts`

**Before (Broken in Zod 4):**
```typescript
page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),  // ❌ Type error
limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50'), // ❌ Type error
```

**After (Fixed):**
```typescript
page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),  // ✅ Correct type inference
limit: z.string().default('50').transform(Number).pipe(z.number().int().min(1).max(100)),  // ✅ Correct type inference
```

**Rationale:** In Zod 4, `.default()` must be applied before `.transform()` for proper type inference. The default value type must match the input type, not the output type.

---

### 3. React Hook Form Integration Updated

**Package:** `@hookform/resolvers`

- Upgraded from beta (2.0.0-beta.17) to **stable 5.2.2**
- Full Zod 4 support confirmed (as of v5.1.0)
- No code changes required in components using `zodResolver`
- TypeScript compilation verified clean

**Documentation:** Always fetch latest React Hook Form docs via context7 MCP before implementing forms.

---

### 4. Next.js Configuration Modernized

**File:** `next.config.js`

#### Change: Moved `experimental.turbo` to Root-Level `turbopack`

**Before (Deprecated Pattern):**
```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    turbo: {  // ❌ Deprecated in Next.js 15.5+
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}
```

**After (Next.js 15.5 Pattern):**
```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  turbopack: {  // ✅ Root-level configuration
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}
```

**Impact:** Removed deprecation warning on dev server startup.

---

### 5. Next.js Metadata Configuration Fixed

**File:** `src/app/layout.tsx`

#### Change: Moved `viewport` and `themeColor` to Separate Export

**Before (Next.js 14 Pattern - Deprecated):**
```typescript
export const metadata: Metadata = {
  title: 'Americano - Medical Learning Platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#0066cc',
}
```

**After (Next.js 15 Pattern - Official):**
```typescript
export const metadata: Metadata = {
  title: 'Americano - Medical Learning Platform',
  description: 'AI-powered personalized medical education platform for medical students',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Americano',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0066cc',
}
```

**Migration Tool:** Used official Next.js codemod:
```bash
npx @next/codemod@latest metadata-to-viewport-export .
```

**Impact:** Eliminated unsupported metadata warnings in console.

---

### 6. API Response Format Fixes

**Files:**
- `src/app/library/page.tsx`
- `src/app/library/courses/page.tsx`
- `src/app/library/[lectureId]/page.tsx`
- `src/components/library/lecture-edit-dialog.tsx`

#### Issue: Frontend Not Updated for Story 1.5 API Response Format

**Old API Response (Incorrect Frontend Assumption):**
```typescript
{
  success: true,
  courses: [...]  // ❌ Direct access
}
```

**New API Response (Story 1.5 Standard):**
```typescript
{
  success: true,
  data: {
    courses: [...]  // ✅ Nested under 'data'
  }
}
```

**Fix Applied:**
```typescript
// Before:
const result = await response.json();
if (result.success) {
  setCourses(result.courses);  // ❌ undefined
}

// After:
const result = await response.json();
if (result.success) {
  setCourses(result.data.courses);  // ✅ correct access
}
```

**Impact:** Fixed "undefined is not an object (evaluating 'courses.map')" application crash on Library page.

---

### 7. Dependencies Cleanup

#### Reinstall Performed
```bash
cd /Users/Kyin/Projects/Americano/apps/web
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Reason:** Resolved TypeScript type resolution issues after major version updates.

**Deprecated Subdependencies Noted:**
- glob@7.2.3
- inflight@1.0.6 (memory leak warning acknowledged)
- node-domexception@1.0.0
- rimraf@2.7.1
- rollup-plugin-terser@7.0.2
- source-map@0.8.0-beta.0
- sourcemap-codec@1.4.8
- workbox-cacheable-response@6.6.0
- workbox-google-analytics@6.6.0

**Action:** These are transitive dependencies from `@next/codemod` and `next-pwa`. No action required for MVP.

---

## Verification

### TypeScript Compilation
```bash
pnpm tsc --noEmit
```
**Result:** ✅ Zero errors

### Dev Server Status
```bash
pnpm dev
```
**Result:** ✅ Clean startup with no warnings
```
▲ Next.js 15.5.5 (Turbopack)
- Local:        http://localhost:3000
- Experiments: serverActions

✓ Starting...
✓ Ready in 985ms
```

---

## Updated Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Core Framework** | | |
| Frontend Framework | Next.js | 15.5.5 |
| UI Library | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| **Frontend** | | |
| Styling | Tailwind CSS | 4.1.14 |
| Component Library | shadcn/ui | Latest (on-demand) |
| State Management | Zustand | Latest |
| Form Validation | Zod | 4.1.12 |
| Form Library | React Hook Form | 7.65.0 |
| Form Resolver | @hookform/resolvers | 5.2.2 |
| **Backend** | | |
| Database | PostgreSQL | Latest |
| Vector Extension | pgvector | Latest |
| ORM | Prisma | 6.17.1 |
| **Development** | | |
| Package Manager | pnpm | Latest |
| Code Quality | Biome | 2.2.6 |

---

## Migration Notes

### For Future Developers

1. **Zod 4 Pattern:**
   - Always use `error.issues` (not `error.errors`)
   - Apply `.default()` before `.transform()` for proper type inference

2. **Next.js 15 Patterns:**
   - Use `export const viewport: Viewport` for viewport config
   - Use root-level `turbopack` config (not `experimental.turbo`)

3. **API Response Standard:**
   - All API responses follow Story 1.5 format: `{ success: true, data: {...} }`
   - Always access nested `result.data.<property>`

4. **React Hook Form + Zod 4:**
   - Use `@hookform/resolvers@5.2.2` or later
   - Always fetch latest docs via context7 MCP before implementing

---

## Documentation References

- **Next.js 15 Metadata Migration:** https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- **Zod 4 Changelog:** https://zod.dev/v4/changelog
- **React Hook Form Resolvers:** https://github.com/react-hook-form/resolvers/releases

---

## Next Steps

All technical debt from dependency updates resolved. Ready to continue with Epic implementation:

1. ✅ Dependencies at latest stable versions
2. ✅ TypeScript compilation clean
3. ✅ Dev server running without warnings
4. ✅ API response format standardized
5. ✅ Application error fixed (courses.map)

**Status:** Ready for development ✅

---

## Lessons Learned

1. **Use Official Migration Tools:** Next.js codemods save time and prevent errors
2. **Context7 for Documentation:** Always fetch latest library docs via MCP before implementing
3. **Fix, Don't Suppress:** Address root causes rather than hiding warnings
4. **Clean Reinstalls:** When in doubt after major upgrades, delete `node_modules` and reinstall

---

**Updated By:** Claude Code
**Date:** 2025-10-15
**Version:** 1.0
