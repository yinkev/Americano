# Americano Platform UI/UX Specification

## Visual Design Language

### Color Palette
The Americano platform uses a sophisticated, professional color scheme that reflects its medical education focus while maintaining modern digital aesthetics.

**Primary Colors:**
- **Primary Blue**: `#2563eb` (vibrant, trustworthy, represents intelligence and clarity)
- **Primary Dark**: `#1e40af` (for hover states and emphasis)
- **Primary Light**: `#dbeafe` (for backgrounds and subtle highlights)

**Secondary Colors:**
- **Success Green**: `#10b981` (for positive feedback and completion states)
- **Warning Amber**: `#f59e0b` (for caution and attention-required states)
- **Error Red**: `#ef4444` (for errors and critical alerts)
- **Info Blue**: `#3b82f6` (for informational content)

**Neutral Colors:**
- **Background**: `#ffffff` (light mode), `#0f172a` (dark mode)
- **Surface**: `#f8fafc` (light mode), `#1e293b` (dark mode)
- **Text Primary**: `#0f172a` (light mode), `#f1f5f9` (dark mode)
- **Text Secondary**: `#64748b` (light mode), `#94a3b8` (dark mode)
- **Border**: `#e2e8f0` (light mode), `#334155` (dark mode)

**Accent Colors for Medical Context:**
- **Medical Teal**: `#0d9488` (represents healthcare and wellness)
- **Analytics Purple**: `#8b5cf6` (represents data and insights)

### Typography
The typography system is designed for optimal readability and information hierarchy in a medical education context.

**Font Stack:**
- **Primary Font**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Code Font**: `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace`

**Typography Scale:**
- **Display XL**: 48px, font-weight: 700, line-height: 1.1
- **Display LG**: 36px, font-weight: 700, line-height: 1.2
- **Display MD**: 30px, font-weight: 700, line-height: 1.2
- **Heading XL**: 24px, font-weight: 700, line-height: 1.3
- **Heading LG**: 20px, font-weight: 600, line-height: 1.4
- **Heading MD**: 18px, font-weight: 600, line-height: 1.5
- **Body LG**: 16px, font-weight: 400, line-height: 1.6
- **Body MD**: 14px, font-weight: 400, line-height: 1.6
- **Body SM**: 12px, font-weight: 400, line-height: 1.6
- **Caption**: 11px, font-weight: 400, line-height: 1.5

### Spacing System
A consistent 4px baseline grid ensures visual harmony and proper information hierarchy.

**Spacing Scale:**
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 24px
- **2XL**: 32px
- **3XL**: 48px
- **4XL**: 64px

**Container Padding:**
- Mobile: 16px horizontal, 24px vertical
- Tablet: 24px horizontal, 32px vertical
- Desktop: 32px horizontal, 48px vertical

## Core Constraints and Layout Principles

### Layout System
The Americano platform follows a responsive grid system with the following constraints:

**Grid Structure:**
- **Mobile**: Single column, full width with 16px gutters
- **Tablet**: 8-column grid with 16px gutters
- **Desktop**: 12-column grid with 24px gutters
- **Wide Desktop**: 12-column grid with 32px gutters

**Breakpoints:**
- **Mobile**: 0px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px - 1440px
- **Wide Desktop**: 1441px+

### Layout Principles

**1. Content Hierarchy:**
- Primary content takes precedence with ample whitespace
- Secondary information is visually de-emphasized but accessible
- Navigation elements are consistently positioned

**2. Progressive Disclosure:**
- Complex information is revealed progressively
- Advanced features are hidden behind clear affordances
- Contextual help is available without overwhelming the interface

**3. Consistency:**
- Components maintain consistent behavior across the platform
- Interaction patterns are predictable and familiar
- Visual language remains cohesive across all screens

**4. Accessibility First:**
- All interactive elements meet WCAG 2.1 AA standards
- Color contrast ratios exceed minimum requirements
- Keyboard navigation is fully supported

## Visual Tokens

### CSS Variables
```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-primary-dark: #1e40af;
  --color-primary-light: #dbeafe;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  --color-medical: #0d9488;
  --color-analytics: #8b5cf6;
  
  /* Neutrals */
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;
  
  /* Dark Mode */
  --color-bg-dark: #0f172a;
  --color-surface-dark: #1e293b;
  --color-text-primary-dark: #f1f5f9;
  --color-text-secondary-dark: #94a3b8;
  --color-border-dark: #334155;
  
  /* Typography */
  --font-family-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
  
  /* Font Sizes */
  --font-size-display-xl: 3rem;
  --font-size-display-lg: 2.25rem;
  --font-size-display-md: 1.875rem;
  --font-size-heading-xl: 1.5rem;
  --font-size-heading-lg: 1.25rem;
  --font-size-heading-md: 1.125rem;
  --font-size-body-lg: 1rem;
  --font-size-body-md: 0.875rem;
  --font-size-body-sm: 0.75rem;
  --font-size-caption: 0.6875rem;
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 0.75rem;
  --space-lg: 1rem;
  --space-xl: 1.5rem;
  --space-2xl: 2rem;
  --space-3xl: 3rem;
  --space-4xl: 4rem;
  
  /* Border Radius */
  --radius-xs: 0.125rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
  --transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-Index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal: 1040;
  --z-toast: 1050;
  --z-tooltip: 1060;
}
```

### Component Tokens

**Buttons:**
- Primary: `background: var(--color-primary); color: white; border-radius: var(--radius-md);`
- Secondary: `background: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary);`
- Destructive: `background: var(--color-error); color: white;`
- Outline: `border: 1px solid var(--color-primary); color: var(--color-primary); background: transparent;`

**Cards:**
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-lg)`
- Shadow: `var(--shadow-md)`
- Padding: `var(--space-lg)`

**Inputs:**
- Background: `var(--color-bg)`
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-md)`
- Padding: `var(--space-md) var(--space-lg)`
- Focus: `border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)`

## Animation Library

### GSAP Integration Guidelines

The Americano platform leverages GSAP (GreenSock Animation Platform) for sophisticated, performant animations that enhance user experience without compromising performance.

### Core Animation Principles

**1. Purposeful Animation:**
- Every animation must serve a functional purpose
- Avoid decorative animations that don't provide user value
- Use animation to guide attention and provide feedback

**2. Performance First:**
- All animations use `transform` and `opacity` properties only
- Avoid animating layout properties (width, height, margin, padding)
- Implement `prefers-reduced-motion` support

**3. Consistent Timing:**
- Entry animations: 300ms ease-out
- Exit animations: 200ms ease-in
- Hover interactions: 150ms ease
- Page transitions: 400ms ease

### Animation Patterns

**Page Transitions:**
```javascript
// Fade + Slide transition
gsap.fromTo(container, {
  opacity: 0,
  y: 20
}, {
  opacity: 1,
  y: 0,
  duration: 0.4,
  ease: "power2.out"
});
```

**Staggered Lists:**
```javascript
// Staggered item entrance
gsap.from(items, {
  opacity: 0,
  y: 30,
  stagger: 0.05,
  duration: 0.3,
  ease: "power2.out"
});
```

**Interactive Elements:**
```javascript
// Button hover effect
gsap.to(button, {
  scale: 1.02,
  duration: 0.15,
  ease: "power1.out"
});

// Button press effect
gsap.to(button, {
  scale: 0.98,
  duration: 0.1,
  ease: "power1.in"
});
```

**Loading States:**
```javascript
// Skeleton loading animation
gsap.fromTo(skeleton, {
  background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)"
}, {
  backgroundPosition: "200% 0",
  repeat: -1,
  duration: 1.5,
  ease: "none"
});
```

### GSAP Configuration

**Timeline Management:**
- Use `gsap.timeline()` for complex sequences
- Implement proper cleanup with `timeline.kill()`
- Use `scrollTrigger` for scroll-based animations

**Performance Optimization:**
- Use `will-change: transform` on animated elements
- Implement `requestAnimationFrame` for custom loops
- Limit concurrent animations to 3-4 maximum

## Interaction Patterns

### Navigation Patterns

**Primary Navigation:**
- Persistent sidebar navigation on desktop
- Collapsible hamburger menu on mobile
- Active state highlighting with primary color
- Smooth scrolling to anchor points

**Breadcrumbs:**
- Hierarchical path display
- Clickable parent levels
- Current page as non-interactive text

**Tab Navigation:**
- Underlined active tab indicator
- Smooth content transitions between tabs
- Keyboard navigation support (arrow keys)

### Form Interactions

**Validation Feedback:**
- Real-time validation with debounce
- Clear error messages below fields
- Success indicators for valid inputs
- Non-blocking validation (allow submission with warnings)

**Progressive Enhancement:**
- Multi-step forms with progress indicators
- Auto-save functionality with visual feedback
- Contextual help tooltips on complex fields

### Data Visualization Interactions

**Charts and Graphs:**
- Hover tooltips with detailed information
- Click-to-select for focused analysis
- Zoom and pan capabilities for detailed exploration
- Legend toggling for data series visibility

**Tables:**
- Sortable columns with visual indicators
- Row selection with keyboard support
- Pagination with smooth transitions
- Search and filter with debounced input

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Color and Contrast:**
- Text-to-background contrast ratio minimum 4.5:1
- Large text (18pt+) contrast ratio minimum 3:1
- Interactive elements have visible focus states
- Color is not the only means of conveying information

**Keyboard Navigation:**
- Full keyboard operability for all interactive elements
- Logical tab order following visual layout
- Skip navigation links for complex pages
- Visible focus indicators meeting contrast requirements

**Screen Reader Support:**
- Semantic HTML structure with proper heading hierarchy
- ARIA labels and roles for custom components
- Live regions for dynamic content updates
- Form labels properly associated with inputs

**Responsive Design:**
- Content reflows appropriately at all viewport sizes
- Touch targets minimum 44px × 44px
- Text scaling up to 200% without loss of content or functionality
- Orientation independence (works in portrait and landscape)

### ARIA Implementation

**Landmark Roles:**
- `banner` for header
- `navigation` for main navigation
- `main` for primary content
- `complementary` for sidebars
- `contentinfo` for footer

**Widget Roles:**
- `button` for clickable elements
- `tablist`, `tab`, `tabpanel` for tab interfaces
- `combobox`, `listbox` for dropdowns
- `alert` for important notifications

## Performance Requirements

### Loading Performance

**Core Web Vitals Targets:**
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

**Bundle Optimization:**
- Code splitting by route and feature
- Lazy loading of non-critical components
- Image optimization with WebP format
- Font subsetting and preloading

### Runtime Performance

**Animation Performance:**
- 60fps animations using `transform` and `opacity`
- Hardware acceleration for complex animations
- Debounced event handlers for scroll/resize
- Virtualized lists for large datasets

**Memory Management:**
- Proper cleanup of event listeners
- Efficient state management with memoization
- Cleanup of GSAP timelines and tweens
- Image and resource cleanup on component unmount

### Network Performance

**Caching Strategy:**
- Service worker for offline capability
- HTTP caching headers for static assets
- Stale-while-revalidate for API responses
- Cache busting for versioned assets

**API Performance:**
- Request debouncing and throttling
- Optimistic UI updates with rollback capability
- Pagination and infinite scroll for large datasets
- WebSocket connections for real-time updates

This specification provides a comprehensive foundation for implementing a modern, accessible, and performant user interface for the Americano medical education platform. All design decisions prioritize user needs, accessibility, and performance while maintaining the professional aesthetic appropriate for medical education.
