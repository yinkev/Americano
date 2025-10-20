# Wave 3 Quick Reference Guide

**For Developers:** Quick copy-paste integration examples

---

## Empty States

```tsx
// Import
import {
  LearningPatternsEmpty,
  StrugglePredictionsEmpty,
  BehavioralInsightsEmpty,
  CognitiveHealthEmpty,
  PersonalizationEmpty,
  OrchestrationEmpty,
} from "@/components/empty-states";

// Use in your component
if (!data || data.length === 0) {
  return <LearningPatternsEmpty />;
}
```

---

## Error Messages

```tsx
// Import
import { showFriendlyError, getFriendlyError } from "@/lib/error-messages";
import { toast } from "@/components/ui/sonner";

// Quick toast
try {
  await apiCall();
} catch (error) {
  showFriendlyError(toast, "NETWORK_ERROR");
}

// Get error object
const error = getFriendlyError("UNAUTHORIZED", 401);
// Returns: { title, description, actions: [{label, action}] }

// Available error types:
// - NETWORK_ERROR, TIMEOUT_ERROR, API_ERROR, SERVER_ERROR
// - UNAUTHORIZED, FORBIDDEN
// - VALIDATION_ERROR, MISSING_DATA
// - SESSION_NOT_FOUND, SESSION_ALREADY_COMPLETED
// - MISSION_GENERATION_FAILED, NO_OBJECTIVES_AVAILABLE
// - INSUFFICIENT_DATA, PREDICTION_FAILED
// - FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE, UPLOAD_FAILED
// - CALENDAR_CONNECTION_FAILED, UNKNOWN_ERROR
```

---

## Celebrations

```tsx
// Import
import {
  celebrateAchievement,
  celebrateFirstSession,
  celebrateWeekStreak,
  celebrateGoalReached,
  celebratePerfectScore,
  celebrateMissionComplete,
  celebrateCourseMastery,
  celebrateBasic,
} from "@/lib/celebrations";

// Quick celebration
celebrateAchievement("first_session");

// Available types:
// - "first_session" - First study session (2s, gentle)
// - "week_streak" - 7 consecutive days (3s, dramatic)
// - "goal_reached" - Behavioral goal (instant, focused)
// - "perfect_score" - 100% accuracy (2.5s, spectacular)
// - "mission_complete" - Daily mission (instant, professional)
// - "course_mastery" - Course mastered (4s, grand)
// - "basic" - Generic achievement (instant, standard)

// Manual example
if (isFirstSession) {
  celebrateFirstSession();
} else if (accuracy === 100) {
  celebratePerfectScore();
} else {
  celebrateBasic();
}
```

---

## Motion Preferences

```tsx
// Import
import {
  prefersReducedMotion,
  useMotionPreference,
  getSafeAnimationDuration,
  safeAnimationClass,
} from "@/lib/motion-preferences";

// React hook (recommended)
function MyComponent() {
  const shouldAnimate = useMotionPreference();

  return (
    <motion.div
      animate={shouldAnimate ? { opacity: 1 } : {}}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
    />
  );
}

// Utility functions
const duration = getSafeAnimationDuration(300); // Returns 0 if reduced motion
const className = safeAnimationClass("animate-fade-in"); // Returns "" if reduced motion

// Direct check
if (!prefersReducedMotion()) {
  // Run animation
}
```

---

## Error Boundary

```tsx
// Import
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Wrap your component
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

---

## Accessibility Utilities

```tsx
// Import
import {
  getContrastRatio,
  meetsWCAG,
  auditColorPair,
  auditThemeColors,
} from "@/lib/accessibility-audit";

// Check contrast ratio
const ratio = getContrastRatio("#1A1A1A", "#FAFAFA"); // Returns ~15:1

// Verify WCAG compliance
const passesAAA = meetsWCAG(ratio, "AAA", "normal"); // true if ≥7:1

// Audit color pair
const audit = auditColorPair("#1A1A1A", "#FAFAFA");
// Returns: { foreground, background, ratio, passesAA, passesAAA }

// Audit entire theme
const themeAudit = auditThemeColors();
// Returns: { light, dark, summary }
```

---

## OKLCH Colors (Reference)

### Empty States
```tsx
// Blues
"oklch(0.6 0.15 230)"  // Primary blue
"oklch(0.65 0.18 230)" // Light blue

// Greens
"oklch(0.55 0.20 140)" // Success green
"oklch(0.6 0.20 140)"  // Light success

// Purples
"oklch(0.60 0.18 280)" // Accent purple
"oklch(0.65 0.20 280)" // Light purple

// Yellows/Oranges
"oklch(0.65 0.25 60)"  // Warm accent
"oklch(0.70 0.20 340)" // Pink accent
```

### Confetti (Hex for canvas-confetti)
```tsx
const COLORS = {
  blue1: "#5B8DEF",   // oklch(0.6 0.15 230)
  green1: "#52C98A",  // oklch(0.6 0.20 140)
  purple1: "#9370DB", // oklch(0.60 0.18 280)
  orange1: "#F0A868", // oklch(0.70 0.20 60)
  pink1: "#E679A6",   // oklch(0.65 0.20 340)
};
```

---

## Keyboard Navigation Checklist

```tsx
// Ensure all interactive elements are keyboard accessible
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Add skip-to-main link (already in layout.tsx)
<a href="#main-content" className="skip-to-main">
  Skip to main content
</a>

// Mark decorative elements
<div aria-hidden="true">•</div>

// Add role to main content
<main id="main-content" role="main">
  {children}
</main>
```

---

## Screen Reader Best Practices

```tsx
// Label icon buttons
<button aria-label="Toggle sidebar">
  <Menu />
</button>

// Label SVG illustrations
<svg role="img" aria-label="No study sessions illustration">
  {/* ... */}
</svg>

// Hide decorative elements
<div className="border-l" aria-hidden="true" />

// Use semantic HTML
<header>
  <nav aria-label="Main navigation">
    {/* ... */}
  </nav>
</header>
```

---

## Testing Commands

```bash
# TypeScript check
pnpm tsc --noEmit

# Build check
pnpm build

# Run tests (when available)
pnpm test

# Lighthouse audit (in browser DevTools)
# 1. Open DevTools
# 2. Go to Lighthouse tab
# 3. Select "Accessibility"
# 4. Run audit (target: 100 score)
```

---

## Common Patterns

### Conditional Empty State
```tsx
const { data, isLoading } = useQuery("patterns");

if (isLoading) return <Skeleton />;
if (!data || data.length === 0) return <LearningPatternsEmpty />;
return <PatternsGrid data={data} />;
```

### Error Handling with Toast
```tsx
const handleSubmit = async () => {
  try {
    await submitForm();
    toast({ title: "Success!", description: "Form submitted" });
  } catch (error) {
    showFriendlyError(toast, "VALIDATION_ERROR");
  }
};
```

### Achievement Celebration
```tsx
const handleAchievement = (type: string, isFirst: boolean) => {
  if (isFirst) {
    celebrateAchievement("first_session");
  } else if (type === "perfect") {
    celebrateAchievement("perfect_score");
  } else {
    celebrateAchievement("basic");
  }
};
```

### Accessible Animation
```tsx
function MyComponent() {
  const shouldAnimate = useMotionPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : {}}
      animate={shouldAnimate ? { opacity: 1 } : {}}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
    >
      Content
    </motion.div>
  );
}
```

---

## File Locations

**Empty States:** `/apps/web/src/components/empty-states/`
**Error Messages:** `/apps/web/src/lib/error-messages.ts`
**Celebrations:** `/apps/web/src/lib/celebrations.ts`
**Motion Preferences:** `/apps/web/src/lib/motion-preferences.ts`
**Accessibility Audit:** `/apps/web/src/lib/accessibility-audit.ts`
**Error Boundary:** `/apps/web/src/components/ui/error-boundary.tsx`

---

## Need Help?

- **Full documentation:** `EPIC5-ACCESSIBILITY-WCAG-AAA-REPORT.md`
- **Implementation guide:** `EPIC5-WAVE3-IMPLEMENTATION-SUMMARY.md`
- **Deliverables checklist:** `EPIC5-WAVE3-DELIVERABLES.md`
- **This guide:** `WAVE3-QUICK-REFERENCE.md`

---

**Last Updated:** 2025-10-20
**Team:** Team 8 (Wave 3 UI/UX)
