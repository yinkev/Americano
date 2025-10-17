# Adaptive UI Integration Guide

**Story 4.5 Task 11 - UI Integration**
**Author:** Claude Code
**Date:** 2025-10-17

## Overview

This guide explains how to integrate adaptive assessment features into the comprehension prompt dialog workflow. The integration preserves the existing Story 4.1 and Story 4.4 functionality while adding Story 4.5 adaptive features.

## Integration Summary

### New Component: `AdaptiveComprehensionPromptDialog`

A fully integrated dialog that combines:
- **Story 4.1**: Natural language comprehension prompts with AI evaluation
- **Story 4.4**: Confidence calibration with pre/post assessment
- **Story 4.5**: Adaptive difficulty, IRT metrics, complexity progression, break recommendations

## Key Features Integrated

### 1. Difficulty Indicator (Story 4.5 AC#2)

**Location:** Dialog header (next to title)
**Component:** `DifficultyIndicator`
**Props:**
```typescript
<DifficultyIndicator
  currentDifficulty={50}
  size="sm"
/>
```

**Features:**
- Shows current difficulty on 0-100 scale
- Color-coded (green/yellow/red)
- Tooltip with difficulty explanation
- Smooth transitions on difficulty changes

### 2. IRT Confidence Interval Display (Story 4.5 AC#7)

**Location:** Adaptive metrics banner (below header)
**Component:** `ConfidenceIntervalDisplay`
**Props:**
```typescript
<ConfidenceIntervalDisplay
  estimate={75}
  confidenceInterval={8}
  size="sm"
/>
```

**Features:**
- Knowledge estimate (theta from IRT)
- ±X confidence interval at 95%
- Precision indicator (High/Medium/Low)
- Visual range display with tooltip

### 3. Complexity Skill Tree (Story 4.5 AC#6)

**Location:** "Complexity Progression" tab in results view
**Component:** `ComplexitySkillTree`
**Props:**
```typescript
<ComplexitySkillTree
  userId="kevy@americano.dev"
  conceptId={objectiveId}
  onLevelSelect={(level) => console.log('Selected:', level)}
/>
```

**Features:**
- Three-tier progression (BASIC → INTERMEDIATE → ADVANCED)
- Lock/unlock status with animations
- Progress indicators for current level
- Mastery badges on completed levels

### 4. Mastery Badge (Story 4.5 AC#4)

**Location:** Dialog header (when mastery verified)
**Component:** `MasteryBadge`
**Props:**
```typescript
<MasteryBadge
  verifiedAt={new Date()}
  complexityLevel="INTERMEDIATE"
  size="sm"
  animated={true}
/>
```

**Features:**
- Gold star with celebratory animation
- Complexity level indicator
- Verification date tooltip
- Mastery criteria display

### 5. Break Recommendation Dialog (Story 4.5 AC#8)

**Location:** After completing question (conditional)
**Component:** `BreakReminderDialog`
**Trigger Logic:**
```typescript
const shouldRecommendBreak =
  questionsAnswered >= 10 ||
  durationMinutes >= 30;
```

**Features:**
- Short break (5 min) after 10+ questions
- Long break (15 min) after 30+ minutes
- Countdown timer during break
- Break suggestions (stretch, hydrate, 20-20-20 rule)

## Usage Example

### Basic Usage (All Adaptive Features)

```typescript
import { AdaptiveComprehensionPromptDialog } from '@/components/study/AdaptiveComprehensionPromptDialog';

function StudySession() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <AdaptiveComprehensionPromptDialog
      open={showDialog}
      onOpenChange={setShowDialog}
      prompt={{
        id: 'prompt-123',
        promptText: 'Explain the mechanism of action of ACE inhibitors...',
      }}
      objectiveId="obj-456"
      sessionId="session-789"
      onComplete={(result) => {
        console.log('Completed:', result);
      }}
      onSkip={() => console.log('Skipped')}

      // Adaptive features (Story 4.5)
      enableAdaptive={true}
      showComplexityTree={true}
      currentDifficulty={65}
      nextDifficulty={75}
      irtMetrics={{
        estimate: 72,
        confidenceInterval: 9,
      }}
      masteryStatus={{
        isMastered: true,
        verifiedAt: new Date('2025-10-15'),
        complexityLevel: 'BASIC',
      }}
      sessionMetrics={{
        questionsAnswered: 12,
        durationMinutes: 25,
      }}
    />
  );
}
```

### Minimal Usage (Backward Compatible)

```typescript
<AdaptiveComprehensionPromptDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  prompt={prompt}
  objectiveId={objectiveId}
  onComplete={handleComplete}
  onSkip={handleSkip}

  // Adaptive features disabled for backward compatibility
  enableAdaptive={false}
/>
```

## Component Props

### AdaptiveComprehensionPromptDialogProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | ✅ | - | Dialog open state |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | Dialog state handler |
| `prompt` | `ValidationPromptData` | ✅ | - | Prompt data from Story 4.1 |
| `objectiveId` | `string` | ✅ | - | Learning objective ID |
| `sessionId` | `string` | ❌ | - | Study session ID |
| `onComplete` | `(result) => void` | ✅ | - | Completion handler |
| `onSkip` | `() => void` | ✅ | - | Skip handler |
| `enableAdaptive` | `boolean` | ❌ | `true` | Enable Story 4.5 features |
| `showComplexityTree` | `boolean` | ❌ | `true` | Show complexity tab |
| `currentDifficulty` | `number` | ❌ | `50` | Current difficulty (0-100) |
| `nextDifficulty` | `number` | ❌ | - | Next difficulty level |
| `irtMetrics` | `{ estimate, confidenceInterval }` | ❌ | - | IRT knowledge estimate |
| `masteryStatus` | `{ isMastered, verifiedAt, complexityLevel }` | ❌ | - | Mastery verification |
| `sessionMetrics` | `{ questionsAnswered, durationMinutes }` | ❌ | - | Session tracking |

## Integration Checklist

### ✅ Completed (Task 11)

- [x] Created `AdaptiveComprehensionPromptDialog.tsx`
- [x] Integrated `DifficultyIndicator` in header
- [x] Integrated `ConfidenceIntervalDisplay` in metrics banner
- [x] Integrated `ComplexitySkillTree` in tabbed results view
- [x] Integrated `MasteryBadge` when mastery achieved
- [x] Integrated `BreakReminderDialog` with trigger logic
- [x] Added adaptive metrics display banner
- [x] Preserved existing workflow (pre-confidence → prompt → post-confidence → results → reflection)
- [x] Maintained backward compatibility with `enableAdaptive` flag
- [x] Added tabbed view for results + complexity tree
- [x] Documented usage examples

### 🔄 Future Enhancements (Post-MVP)

- [ ] Connect to actual adaptive API endpoints (`/api/adaptive/session/start`, `/api/adaptive/question/next`)
- [ ] Implement real-time difficulty adjustment notifications
- [ ] Add follow-up question context display (Story 4.5 AC#3)
- [ ] Connect mastery verification API (`/api/mastery/:objectiveId`)
- [ ] Add efficiency metrics panel (questions saved vs baseline)
- [ ] Implement early stop recommendation when IRT converges
- [ ] Add authentication integration (replace hardcoded userId)

## Design System Compliance

### Colors (OKLCH Color Space)

- **Difficulty Low:** `oklch(0.7 0.15 145)` - Green
- **Difficulty Medium:** `oklch(0.75 0.12 85)` - Yellow
- **Difficulty High:** `oklch(0.65 0.20 25)` - Red
- **Mastery Gold:** `oklch(0.8 0.15 60)` - Gold
- **Primary Blue:** `oklch(0.6 0.18 230)` - Blue

### Accessibility

- ✅ Minimum 44px touch targets
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly (aria-live regions)
- ✅ High contrast colors
- ✅ Tooltips with detailed explanations

### Styling

- ✅ Glassmorphism: `bg-white/95 backdrop-blur-xl`
- ✅ NO gradients (per design system)
- ✅ OKLCH color space only
- ✅ Inter font (body), DM Sans (headings)
- ✅ Smooth transitions and animations

## API Integration Notes

### Expected API Response Format

For adaptive features to work with real API:

```typescript
// POST /api/adaptive/session/start
{
  adaptiveSessionId: string;
  initialDifficulty: number;
  firstPrompt: ValidationPromptData;
  irtMetrics: {
    estimate: number;
    confidenceInterval: number;
  };
}

// POST /api/adaptive/question/next
{
  nextQuestion: ValidationPromptData;
  difficultyAdjustment: {
    previousDifficulty: number;
    newDifficulty: number;
    reason: string;
  };
  irtMetrics: {
    theta: number;
    confidenceInterval: number;
    canStopEarly: boolean;
  };
  masteryProgress: number;
  shouldEnd: boolean;
}

// GET /api/mastery/:objectiveId
{
  masteryStatus: 'VERIFIED' | 'IN_PROGRESS' | 'NOT_STARTED';
  progress: number;
  verifiedAt?: Date;
  complexityLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
}
```

## Testing Recommendations

### Unit Tests (Vitest)

```typescript
// Test adaptive feature toggling
it('hides adaptive features when enableAdaptive=false', () => {
  render(<AdaptiveComprehensionPromptDialog enableAdaptive={false} {...props} />);
  expect(screen.queryByText(/Adaptive Assessment Active/)).not.toBeInTheDocument();
});

// Test difficulty display
it('displays current difficulty in header', () => {
  render(<AdaptiveComprehensionPromptDialog currentDifficulty={75} {...props} />);
  expect(screen.getByText('75')).toBeInTheDocument();
});

// Test mastery badge
it('shows mastery badge when mastery verified', () => {
  render(
    <AdaptiveComprehensionPromptDialog
      masteryStatus={{ isMastered: true, verifiedAt: new Date(), complexityLevel: 'BASIC' }}
      {...props}
    />
  );
  expect(screen.getByText(/Mastered/)).toBeInTheDocument();
});

// Test break recommendation
it('shows break dialog after 10+ questions', () => {
  render(
    <AdaptiveComprehensionPromptDialog
      sessionMetrics={{ questionsAnswered: 12, durationMinutes: 20 }}
      {...props}
    />
  );
  // Complete question and check break dialog
  fireEvent.click(screen.getByText('Continue'));
  // ... (break dialog should appear)
});
```

### Integration Tests

```typescript
// Test complete adaptive workflow
it('completes adaptive assessment workflow', async () => {
  // 1. Pre-assessment confidence
  // 2. Show prompt with difficulty indicator
  // 3. Post-assessment confidence
  // 4. Show results with IRT metrics
  // 5. Display complexity tree
  // 6. Recommend break
  // 7. Reflection prompt
});
```

## Migration Guide

### From `ComprehensionPromptDialog` to `AdaptiveComprehensionPromptDialog`

1. **Import new component:**
   ```typescript
   // Before
   import { ComprehensionPromptDialog } from '@/components/study/ComprehensionPromptDialog';

   // After
   import { AdaptiveComprehensionPromptDialog } from '@/components/study/AdaptiveComprehensionPromptDialog';
   ```

2. **Update props (optional adaptive features):**
   ```typescript
   <AdaptiveComprehensionPromptDialog
     // Existing props (unchanged)
     open={open}
     onOpenChange={setOpen}
     prompt={prompt}
     objectiveId={objectiveId}
     onComplete={handleComplete}
     onSkip={handleSkip}

     // New adaptive props (optional)
     enableAdaptive={true}
     currentDifficulty={sessionState.currentDifficulty}
     irtMetrics={sessionState.irtMetrics}
     masteryStatus={masteryData}
     sessionMetrics={{
       questionsAnswered: sessionState.questionsAnswered,
       durationMinutes: sessionState.durationMinutes,
     }}
   />
   ```

3. **Backward compatibility:** Set `enableAdaptive={false}` to preserve old behavior.

## Troubleshooting

### Issue: Difficulty indicator not showing
- **Check:** `enableAdaptive` is `true`
- **Check:** `currentDifficulty` prop is provided

### Issue: Complexity tree tab missing
- **Check:** `showComplexityTree` is `true`
- **Check:** `enableAdaptive` is `true`

### Issue: Break dialog not appearing
- **Check:** `sessionMetrics` prop is provided
- **Check:** `questionsAnswered >= 10` or `durationMinutes >= 30`
- **Check:** `enableAdaptive` is `true`

### Issue: Mastery badge not showing
- **Check:** `masteryStatus.isMastered` is `true`
- **Check:** `masteryStatus.verifiedAt` and `complexityLevel` are provided

## Related Files

- `/apps/web/src/components/study/AdaptiveComprehensionPromptDialog.tsx` - Main integrated component
- `/apps/web/src/components/study/ComprehensionPromptDialog.tsx` - Original component (Story 4.1 + 4.4)
- `/apps/web/src/components/study/DifficultyIndicator.tsx` - Difficulty gauge
- `/apps/web/src/components/study/ConfidenceIntervalDisplay.tsx` - IRT metrics
- `/apps/web/src/components/study/ComplexitySkillTree.tsx` - Progression visualization
- `/apps/web/src/components/study/MasteryBadge.tsx` - Mastery verification badge
- `/apps/web/src/components/study/break-reminder-dialog.tsx` - Break recommendations
- `/apps/web/src/components/study/ADAPTIVE-UI-COMPONENTS.md` - Atomic component guide

## References

- **Story 4.5:** Adaptive Questioning and Progressive Assessment
- **Story 4.4:** Confidence Calibration and Metacognitive Assessment
- **Story 4.1:** Natural Language Comprehension Prompts
- **AC#2:** Real-Time Difficulty Adjustment
- **AC#4:** Mastery Verification Protocol
- **AC#6:** Progressive Complexity Revelation
- **AC#7:** Assessment Efficiency Optimization (IRT)
- **AC#8:** Adaptive Session Orchestration

---

**Status:** ✅ Task 11 Complete
**Next Steps:** Connect to adaptive API endpoints (Tasks 6-10) and test end-to-end workflow
