# First Aid UI Components

This directory contains UI components for integrating First Aid for USMLE Step 1 content with the Americano platform.

## Components

### 1. FirstAidCrossReference

**Location:** `/apps/web/src/components/first-aid/first-aid-cross-reference.tsx`

**Purpose:** Displays First Aid sections related to current lecture content in a sidebar or panel.

**Features:**
- Glassmorphism design with `bg-white/80 backdrop-blur-md`
- High-yield indicators with gold star icons
- Confidence scoring (High/Medium/Low) with OKLCH color coding
- Expandable/collapsible content snippets
- Click to view full First Aid section
- Loading skeleton states
- Empty state handling

**Props:**
```typescript
interface FirstAidCrossReferenceProps {
  lectureId: string                    // Current lecture ID
  references?: FirstAidReference[]     // Array of First Aid references
  isLoading?: boolean                  // Loading state
  className?: string                   // Additional CSS classes
}

interface FirstAidReference {
  id: string                          // Unique reference ID
  section: string                     // First Aid section name
  subsection?: string                 // Optional subsection name
  pageNumber: number                  // Page number in First Aid book
  snippet: string                     // Content preview snippet
  confidence: number                  // Mapping confidence (0-1)
  isHighYield: boolean               // High-yield topic flag
  system?: string                     // Medical system (e.g., "Cardiology")
}
```

**Usage Example:**
```tsx
import { FirstAidCrossReference } from '@/components/first-aid'

export function LecturePage({ lectureId }) {
  return (
    <div className="flex gap-4">
      <main>{/* Lecture content */}</main>
      <aside className="w-96">
        <FirstAidCrossReference
          lectureId={lectureId}
          references={references}
          isLoading={loading}
        />
      </aside>
    </div>
  )
}
```

---

### 2. FirstAidUpload

**Location:** `/apps/web/src/components/first-aid/first-aid-upload.tsx`

**Purpose:** PDF upload interface for First Aid book with copyright compliance.

**Features:**
- Copyright notice display (McGraw Hill Education)
- Personal use confirmation requirement
- File validation (PDF only, max 100MB)
- Upload progress indicator with percentage
- Processing state handling
- Success/error states with visual feedback
- Glassmorphism design
- Drag-and-drop support (via native input)

**Props:**
```typescript
interface FirstAidUploadProps {
  open: boolean                       // Dialog open state
  onOpenChange: (open: boolean) => void  // Dialog state handler
  onUploadComplete?: () => void       // Callback after successful upload
}
```

**Upload States:**
- `idle` - Initial state, ready to select file
- `uploading` - File upload in progress
- `processing` - Server processing PDF
- `success` - Upload completed successfully
- `error` - Upload or processing failed

**Usage Example:**
```tsx
import { FirstAidUpload } from '@/components/first-aid'

export function FirstAidPage() {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setUploadOpen(true)}>
        Upload First Aid Book
      </Button>
      <FirstAidUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={() => {
          console.log('Upload complete!')
        }}
      />
    </>
  )
}
```

---

### 3. FirstAidSearchResults

**Location:** `/apps/web/src/components/first-aid/first-aid-search-results.tsx`

**Purpose:** Display First Aid sections in search results with highlighting and badges.

**Features:**
- Source badges ("First Aid" badge for easy identification)
- High-yield content highlighting with star icons
- Query text highlighting in snippets
- Relevance score display with color coding
- System/organ classification badges
- Page numbers and edition information
- Click handlers for full section view
- Open in new tab functionality
- Empty state handling

**Props:**
```typescript
interface FirstAidSearchResultsProps {
  results: FirstAidSearchResult[]     // Array of search results
  query?: string                      // Search query for highlighting
  className?: string                  // Additional CSS classes
  onResultClick?: (result: FirstAidSearchResult) => void  // Click handler
}

interface FirstAidSearchResult {
  id: string                          // Unique result ID
  section: string                     // First Aid section name
  subsection?: string                 // Optional subsection
  pageNumber: number                  // Page number
  content: string                     // Full content
  isHighYield: boolean               // High-yield flag
  system?: string                     // Medical system
  edition?: string                    // First Aid edition (e.g., "2024")
  relevanceScore: number             // Search relevance (0-1)
  highlightedSnippet?: string        // Pre-highlighted snippet
}
```

**Usage Example:**
```tsx
import { FirstAidSearchResults } from '@/components/first-aid'

export function SearchPage({ query }) {
  const { data, isLoading } = useSearch(query)

  return (
    <div className="space-y-6">
      <h2>Lecture Results</h2>
      <LectureSearchResults results={data.lectures} />

      <h2>First Aid References</h2>
      <FirstAidSearchResults
        results={data.firstAid}
        query={query}
        onResultClick={(result) => {
          // Track analytics or navigate
          router.push(`/first-aid/sections/${result.id}`)
        }}
      />
    </div>
  )
}
```

---

## Design System

All components follow the Americano design system:

### Colors (OKLCH)
- **Primary:** `oklch(0.7 0.15 230)` - Blue
- **Success/High-Yield:** `oklch(0.7 0.15 150)` - Green
- **Warning/Medium:** `oklch(0.7 0.15 60)` - Yellow
- **Destructive:** `oklch(0.6 0.2 20)` - Red
- **Muted:** `oklch(0.7 0.05 230)` - Gray

### Glassmorphism Pattern
```css
bg-white/80 backdrop-blur-md border-border/50
```

### NO Gradients
Per design system rules, **never use gradients** (`bg-gradient-*`, `linear-gradient`, `radial-gradient`).

---

## Integration Points

### API Endpoints (to be implemented)
- `POST /api/first-aid/upload` - Upload First Aid PDF
- `GET /api/first-aid/sections/:id` - Get full section
- `GET /api/first-aid/mappings/:lectureId` - Get lecture mappings
- `GET /api/search` - Search across lectures and First Aid

### Data Flow
1. **Upload:** User uploads First Aid PDF → Processing extracts content → Embeddings generated → Mappings created
2. **Cross-Reference:** Lecture view loads → Fetch mappings for current lecture → Display in `FirstAidCrossReference`
3. **Search:** User searches → Query both lecture and First Aid indexes → Display mixed results with `FirstAidSearchResults`

---

## Copyright Compliance

**IMPORTANT:** First Aid for USMLE Step 1 is copyrighted by McGraw Hill Education.

### Implementation Requirements
1. **Upload Notice:** Display copyright notice in `FirstAidUpload` component
2. **User Confirmation:** Require explicit confirmation of legal ownership
3. **Personal Use Only:** No sharing, redistribution, or commercial use
4. **Content Protection:**
   - Encrypt at rest in database
   - User-specific decryption keys
   - Rate limiting to prevent bulk export
   - Audit logging for all access
5. **Attribution:** Clear attribution with page citations

### Terms of Service Integration
```typescript
// Add to terms of service
const firstAidTerms = `
By uploading First Aid content, you confirm that:
1. You legally own a physical or digital copy of the book
2. You will use this content for personal study only
3. You will not share, redistribute, or use commercially
4. You understand this is protected under copyright law
`
```

---

## Future Enhancements

### Planned Features
- [ ] Bookmark favorite First Aid sections
- [ ] Manual mapping review interface
- [ ] Multi-edition comparison view
- [ ] First Aid mnemonic search
- [ ] Offline caching for mobile
- [ ] Integration with spaced repetition

### Partner Integration (Future)
- Official partnership with McGraw Hill
- Licensing agreement for commercial use
- Revenue sharing model if platform scales
- Direct API integration with First Aid content

---

## Testing

### Component Testing
```bash
# Run component tests
pnpm test src/components/first-aid

# Visual regression testing with Storybook
pnpm storybook
```

### Manual Testing Checklist
- [ ] FirstAidCrossReference displays correctly
- [ ] Expand/collapse functionality works
- [ ] High-yield indicators visible
- [ ] Confidence scores color-coded correctly
- [ ] FirstAidUpload validates file types
- [ ] Upload progress indicator updates
- [ ] Copyright notice displays prominently
- [ ] FirstAidSearchResults highlights query text
- [ ] Source badges visible
- [ ] Relevance scores accurate
- [ ] Mobile responsive on all screen sizes

---

## Troubleshooting

### Common Issues

**Issue:** Components not rendering
- **Solution:** Ensure all shadcn/ui dependencies installed: `pnpm add @radix-ui/react-dialog @radix-ui/react-alert`

**Issue:** Glassmorphism not visible
- **Solution:** Check parent container has non-transparent background

**Issue:** OKLCH colors not working
- **Solution:** Ensure Tailwind v4+ is installed and configured correctly

**Issue:** Upload fails silently
- **Solution:** Check API endpoint exists at `/api/first-aid/upload` and returns proper JSON response

---

## Support

For questions or issues:
1. Check Story 3.3 documentation: `/docs/stories/story-3.3.md`
2. Review solution architecture: `/docs/solution-architecture.md`
3. Contact: Medical Education AI Team

---

**Generated:** 2025-10-16
**Story:** Epic 3 - Story 3.3 (First Aid Integration)
**Status:** Implementation Complete
