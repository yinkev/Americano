# TypeScript Error Fix Examples
## Copy-Paste Solutions for Common Patterns

**Purpose:** Quick reference for fixing the 213 production TypeScript errors
**Target Files:** Analytics pages in `/app/analytics/`

---

## 1. Tabs Component Fixes

### ❌ Current Pattern (Errors)
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="patterns">Patterns</TabsTrigger>
  </TabsList>

  <TabsContent value="overview" className="space-y-4">
    <div>Content here</div>
  </TabsContent>
</Tabs>
```

**Errors:**
```
error TS2322: Type '{ children: Element[]; value: string; onValueChange: ...'
is not assignable to type 'IntrinsicAttributes & TabsProps...'
Property 'children' does not exist
```

### ✅ Solution 1: Update UI Component (RECOMMENDED)

**File:** `/components/ui/tabs.tsx`

```typescript
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

**Then use as before** - no page changes needed!

---

## 2. Label Component Fixes

### ❌ Current Pattern (Errors)
```typescript
import { Label } from '@/components/ui/label'

<Label htmlFor="experiment-name">Experiment Name</Label>
<Input id="experiment-name" />
```

**Error:**
```
error TS2322: Type '{ children: string; htmlFor: string; }'
is not assignable to type 'LabelProps'
Property 'children' does not exist
```

### ✅ Solution 1: Use Native Label (QUICKEST)
```typescript
<label
  htmlFor="experiment-name"
  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
>
  Experiment Name
</label>
<Input id="experiment-name" />
```

### ✅ Solution 2: Update Label Component

**File:** `/components/ui/label.tsx`

```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

---

## 3. Dialog Component Fixes

### ❌ Current Pattern (Errors)
```typescript
<DialogContent className="max-w-2xl">
  <DialogTitle>Create New Experiment</DialogTitle>
  <DialogDescription>
    Configure your A/B test parameters below
  </DialogDescription>
  {/* form content */}
</DialogContent>
```

**Error:**
```
error TS2559: Type '{ children: string; }' has no properties in common with
type 'IntrinsicAttributes & Omit<DialogTitleProps...'
```

### ✅ Solution: Wrap in DialogHeader

```typescript
<DialogContent className="max-w-2xl">
  <DialogHeader>
    <DialogTitle>Create New Experiment</DialogTitle>
    <DialogDescription>
      Configure your A/B test parameters below
    </DialogDescription>
  </DialogHeader>

  {/* form content */}
</DialogContent>
```

**Update Dialog Component:**

**File:** `/components/ui/dialog.tsx`

```typescript
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

---

## 4. Select Component Fixes

### ❌ Current Pattern (Errors)
```typescript
<Select value={dateRange} onValueChange={setDateRange}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select range" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="7d">Last 7 days</SelectItem>
    <SelectItem value="30d">Last 30 days</SelectItem>
    <SelectItem value="90d">Last 90 days</SelectItem>
  </SelectContent>
</Select>
```

**Error:**
```
error TS2559: Type '{ children: Element; }' has no properties in common with
type 'IntrinsicAttributes & Omit<SelectTriggerProps...'
```

### ✅ Solution: Update Select Components

**File:** `/components/ui/select.tsx`

```typescript
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

---

## 5. Progress Component Fixes

### ❌ Current Pattern (Errors)
```typescript
<Progress value={75} className="h-2" />
```

**Error:**
```
error TS2322: Type '{ value: number; className: string; }'
is not assignable to type 'ProgressProps'
Property 'className' does not exist
```

### ✅ Solution: Update Progress Component

**File:** `/components/ui/progress.tsx`

```typescript
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

---

## 6. API Response Type Fixes

### ❌ Current Pattern (Errors)
```typescript
const {
  data: patternsData,
  isLoading: patternsLoading,
  error: patternsError,
} = usePatterns(DEFAULT_USER_ID, timeRange)

// Later in code:
const metrics = {
  patternsCount: patternsData?.strengths.length || 0,  // ❌ Error: Property 'strengths' does not exist on type '{}'
  insightsCount: patternsData?.ai_insights.length || 0, // ❌ Error
}
```

### ✅ Solution: Add Type to Hook

**File:** `/lib/api/hooks/analytics.ts`

```typescript
// ALREADY EXISTS in your hooks! Just verify the import:
import type {
  ComprehensionPattern,
  LongitudinalMetric,
  PeerBenchmark,
  UnderstandingPrediction,
  // ... other types
} from './types/generated'

// Hook definition already has proper typing:
export function usePatterns(userId: string | null, dateRange?: string) {
  return useQuery({
    queryKey: analyticsKeys.patterns(userId || ''),
    queryFn: async (): Promise<ComprehensionPattern> => {  // ✅ Type is here!
      return api.post<ComprehensionPattern>('/analytics/patterns', {
        user_id: userId,
        date_range: dateRange,
      } as PatternsRequest)
    },
    ...moderateQueryOptions,
    enabled: !!userId,
  })
}
```

**If types are missing, add to `/lib/api/hooks/types/generated.ts`:**

```typescript
export interface ComprehensionPattern {
  strengths: Array<{
    objective_name: string
    score: number
    percentile: number
  }>
  weaknesses: Array<{
    objective_name: string
    score: number
    percentile: number
  }>
  calibration_issues: Array<{
    type: 'overconfident' | 'underconfident' | 'dangerous_gap'
    objective_name: string
    delta: number
  }>
  ai_insights: string[]
}
```

---

## Quick Fix Script

Save this as `fix-types.sh`:

```bash
#!/bin/bash

echo "🔧 Fixing TypeScript errors..."

# 1. Fix all Label components
echo "📝 Fixing Label components..."
find apps/web/src/app/analytics -name "*.tsx" -type f -exec sed -i '' 's/<Label htmlFor="\([^"]*\)">\([^<]*\)<\/Label>/<label htmlFor="\1" className="text-sm font-medium leading-none">\2<\/label>/g' {} +

# 2. Check for Tabs usage
echo "📝 Checking Tabs components..."
grep -r "import.*Tabs.*from '@/components/ui/tabs'" apps/web/src/app/analytics/ || echo "✅ No Tabs imports found"

# 3. Check for Dialog usage
echo "📝 Checking Dialog components..."
grep -r "DialogTitle" apps/web/src/app/analytics/ | grep -v "DialogHeader" && echo "⚠️  Found DialogTitle without DialogHeader!" || echo "✅ Dialog usage OK"

# 4. Run TypeScript check
echo "🔍 Running TypeScript check..."
pnpm tsc --noEmit

echo "✅ Done! Review the output above."
```

Make executable:
```bash
chmod +x fix-types.sh
./fix-types.sh
```

---

## Testing Your Fixes

After each fix:

```bash
# 1. Check specific file:
pnpm tsc --noEmit apps/web/src/app/analytics/behavioral-insights/page.tsx

# 2. Check all analytics pages:
pnpm tsc --noEmit apps/web/src/app/analytics/**/*.tsx

# 3. Full check:
pnpm tsc --noEmit

# 4. Build test:
pnpm build
```

---

## Common Error Patterns

### Pattern 1: "Property 'children' does not exist"
**Cause:** Radix UI v2+ doesn't accept `children` directly
**Fix:** Use component composition pattern (see examples above)

### Pattern 2: "Type 'unknown' is not assignable"
**Cause:** Missing type definitions for API responses
**Fix:** Add interface to `types/generated.ts`

### Pattern 3: "Property does not exist on type '{}'"
**Cause:** Hook return type is too generic
**Fix:** Add explicit return type to query function

---

## Priority Order

Fix in this order for maximum impact:

1. **Tabs Component** (~60 errors)
2. **Label Component** (~40 errors)
3. **Dialog Component** (~30 errors)
4. **Select Component** (~20 errors)
5. **API Types** (~40 errors)
6. **Progress Component** (~20 errors)

---

**Created by:** Agent 17
**Last Updated:** 2025-10-30
