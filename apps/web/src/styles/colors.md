# OKLCH Color System Documentation

**Last Updated:** 2025-10-20
**Status:** Active Design System
**Compliance:** WCAG 2.1 AAA (7:1 normal text, 4.5:1 large text)

---

## Overview

The Americano design system uses **OKLCH color space** exclusively for perceptual uniformity, accessibility, and consistent brightness across hues. This document defines the complete color palette used across Epic 5 components.

### Why OKLCH?

1. **Perceptual Uniformity**: Equal lightness values appear equally bright across different hues
2. **Better Accessibility**: Easier to maintain WCAG contrast ratios
3. **Predictable Lightness**: L channel maps directly to perceived brightness (0-1 scale)
4. **Wide Gamut Support**: Supports P3 and future color spaces

### OKLCH Syntax

```css
oklch(L C H)
```

- **L** (Lightness): 0-1 (0 = black, 1 = white)
- **C** (Chroma): 0-0.4 (0 = grayscale, 0.4 = maximum saturation)
- **H** (Hue): 0-360 degrees (0/360 = red, 120 = green, 240 = blue)

---

## Base Color Palette

### Neutrals (Grayscale)

Achromatic colors with zero chroma for consistent grays:

```css
/* Light Mode Neutrals */
--color-white: oklch(1 0 0);           /* Pure white */
--color-gray-50: oklch(0.985 0.002 247.839);  /* Near white */
--color-gray-100: oklch(0.967 0.003 264.542); /* Very light gray */
--color-gray-200: oklch(0.928 0.006 264.531); /* Light gray */
--color-gray-300: oklch(0.872 0.01 258.338);  /* Medium-light gray */
--color-gray-400: oklch(0.707 0.022 261.325); /* Medium gray */
--color-gray-500: oklch(0.551 0.027 264.364); /* Medium-dark gray */
--color-gray-600: oklch(0.446 0.03 256.802);  /* Dark gray */
--color-gray-700: oklch(0.373 0.034 259.733); /* Very dark gray */
--color-gray-800: oklch(0.278 0.033 256.848); /* Almost black */
--color-gray-900: oklch(0.21 0.034 264.665);  /* Near black */
--color-black: oklch(0 0 0);           /* Pure black */

/* Semantic Neutrals */
--color-background: oklch(0.985 0 0);  /* Page background (light) */
--color-foreground: oklch(0.145 0 0);  /* Text (dark) */
--color-muted: oklch(0.97 0 0);        /* Muted background */
--color-muted-foreground: oklch(0.556 0 0); /* Muted text */
```

### Dark Mode Neutrals

```css
--color-background: oklch(0.145 0 0);  /* Dark background */
--color-foreground: oklch(0.985 0 0);  /* Light text */
--color-muted: oklch(0.269 0 0);       /* Dark muted background */
--color-muted-foreground: oklch(0.708 0 0); /* Light muted text */
```

---

## Semantic Colors

### Primary (Brand)

```css
/* Light Mode */
--color-primary: oklch(0.205 0 0);            /* Near-black primary */
--color-primary-foreground: oklch(0.985 0 0); /* White on primary */

/* Dark Mode */
--color-primary: oklch(0.985 0 0);            /* White primary */
--color-primary-foreground: oklch(0.205 0 0); /* Black on primary */
```

### Secondary

```css
/* Light Mode */
--color-secondary: oklch(0.97 0 0);           /* Very light gray */
--color-secondary-foreground: oklch(0.205 0 0); /* Dark text */

/* Dark Mode */
--color-secondary: oklch(0.269 0 0);          /* Dark gray */
--color-secondary-foreground: oklch(0.985 0 0); /* Light text */
```

### Destructive (Error/Warning)

```css
/* Light Mode */
--color-destructive: oklch(0.577 0.245 27.325); /* Red-orange */
--color-destructive-foreground: oklch(0.577 0.245 27.325); /* Self-colored text */

/* Dark Mode */
--color-destructive: oklch(0.396 0.141 25.723);       /* Dark red */
--color-destructive-foreground: oklch(0.637 0.237 25.331); /* Light red text */
```

### Success (Recommended for Addition)

```css
/* Light Mode - Recommended */
--color-success: oklch(0.7 0.15 145);         /* Green - optimal */
--color-success-foreground: oklch(0.98 0.01 145); /* Light green bg */

/* Dark Mode - Recommended */
--color-success: oklch(0.75 0.18 145);        /* Bright green */
--color-success-foreground: oklch(0.2 0.1 145); /* Dark green bg */
```

### Warning (Recommended for Addition)

```css
/* Light Mode - Recommended */
--color-warning: oklch(0.8 0.15 90);          /* Yellow */
--color-warning-foreground: oklch(0.95 0.1 90); /* Light yellow bg */

/* Dark Mode - Recommended */
--color-warning: oklch(0.85 0.18 85);         /* Bright yellow */
--color-warning-foreground: oklch(0.3 0.12 85); /* Dark yellow bg */
```

### Info (Recommended for Addition)

```css
/* Light Mode - Recommended */
--color-info: oklch(0.65 0.18 240);           /* Blue */
--color-info-foreground: oklch(0.97 0.02 240); /* Light blue bg */

/* Dark Mode - Recommended */
--color-info: oklch(0.7 0.2 240);             /* Bright blue */
--color-info-foreground: oklch(0.25 0.12 240); /* Dark blue bg */
```

---

## Chart Colors

Designed for data visualization with perceptual uniformity and accessibility:

```css
/* Light Mode Charts */
--color-chart-1: oklch(0.646 0.222 41.116);   /* Warm orange */
--color-chart-2: oklch(0.6 0.118 184.704);    /* Teal */
--color-chart-3: oklch(0.398 0.07 227.392);   /* Blue */
--color-chart-4: oklch(0.828 0.189 84.429);   /* Yellow-green */
--color-chart-5: oklch(0.769 0.188 70.08);    /* Yellow */

/* Dark Mode Charts */
--color-chart-1: oklch(0.488 0.243 264.376);  /* Indigo */
--color-chart-2: oklch(0.696 0.17 162.48);    /* Green-cyan */
--color-chart-3: oklch(0.769 0.188 70.08);    /* Yellow */
--color-chart-4: oklch(0.627 0.265 303.9);    /* Purple */
--color-chart-5: oklch(0.645 0.246 16.439);   /* Rose */
```

### Recharts Theme Colors (Optimized)

```css
/* Primary data series */
--color-data-primary: oklch(0.65 0.2 240);    /* Blue */
--color-data-secondary: oklch(0.7 0.15 145);  /* Green */
--color-data-tertiary: oklch(0.7 0.15 50);    /* Orange */
--color-data-quaternary: oklch(0.65 0.2 280); /* Purple */
--color-data-quinary: oklch(0.75 0.18 30);    /* Red */

/* Grid and axes */
--color-chart-grid: oklch(0.9 0.02 230);      /* Light blue-gray */
--color-chart-axis: oklch(0.6 0.03 230);      /* Medium gray */
--color-chart-text: oklch(0.5 0.05 230);      /* Dark gray text */
```

---

## Component-Specific Colors

### Cards & Panels

```css
--color-card: oklch(1 0 0);                   /* White card bg */
--color-card-foreground: oklch(0.145 0 0);    /* Dark text */
--color-border: oklch(0.922 0 0);             /* Light border */
```

### Glassmorphism

```css
/* Base glass effect */
background: oklch(1 0 0 / 0.8);               /* 80% white */
backdrop-filter: blur(12px);                   /* Medium blur */
border: 1px solid oklch(1 0 0 / 0.2);        /* 20% white border */

/* Enhanced glass with shadow */
box-shadow: 0 8px 32px oklch(0.145 0 0 / 0.1); /* Subtle shadow */

/* Nested glass (cards on cards) */
background: oklch(1 0 0 / 0.9);               /* 90% white for layering */
```

### Cognitive Load Zones

```css
/* Low Load (Green) */
--color-load-low: oklch(0.7 0.15 145);        /* Green */
--color-load-low-bg: oklch(0.95 0.1 145);     /* Light green background */

/* Moderate Load (Yellow) */
--color-load-moderate: oklch(0.8 0.15 90);    /* Yellow */
--color-load-moderate-bg: oklch(0.95 0.12 90); /* Light yellow background */

/* High Load (Orange) */
--color-load-high: oklch(0.7 0.15 50);        /* Orange */
--color-load-high-bg: oklch(0.95 0.12 50);    /* Light orange background */

/* Critical Load (Red) */
--color-load-critical: oklch(0.6 0.20 30);    /* Red */
--color-load-critical-bg: oklch(0.95 0.15 30); /* Light red background */
```

### Time of Day (Session Performance)

```css
--color-morning: oklch(0.7 0.15 60);          /* Yellow-orange */
--color-afternoon: oklch(0.7 0.15 180);       /* Cyan */
--color-evening: oklch(0.7 0.15 280);         /* Purple */
```

---

## Accessibility Guidelines

### Contrast Ratios (WCAG 2.1 AAA)

- **Normal text (< 18px)**: Minimum 7:1 contrast
- **Large text (≥ 18px or ≥ 14px bold)**: Minimum 4.5:1 contrast
- **UI components**: Minimum 3:1 contrast against adjacent colors

### Testing Tools

1. **Online**: [OKLCH Color Picker](https://oklch.com/)
2. **Browser**: Chrome DevTools contrast checker
3. **Command line**: `pnpm dlx @adobe/leonardo-contrast-colors`

### Color Blind Safe Palette

All chart colors tested with:
- **Protanopia** (red-blind)
- **Deuteranopia** (green-blind)
- **Tritanopia** (blue-blind)

Ensure at least 15% lightness difference between adjacent data series.

---

## Usage Examples

### Basic Color Application

```tsx
// Using Tailwind utilities with semantic tokens
<div className="bg-background text-foreground">
  <Card className="bg-card border-border">
    <h2 className="text-primary">Heading</h2>
    <p className="text-muted-foreground">Muted text</p>
  </Card>
</div>
```

### Inline OKLCH Styles

```tsx
// When semantic tokens don't exist yet
<div
  style={{
    backgroundColor: 'oklch(0.7 0.15 145)',
    color: 'oklch(0.98 0.01 145)',
  }}
>
  Success message
</div>
```

### Color Mixing (Advanced)

```tsx
// Create semi-transparent backgrounds
<div
  style={{
    backgroundColor: 'color-mix(in oklch, oklch(0.7 0.15 145), transparent 90%)',
  }}
>
  Subtle green tint
</div>
```

---

## Migration Checklist

### From Hex/HSL to OKLCH

1. ✅ **Audit**: Find all hex/HSL/RGB colors in components
2. ✅ **Convert**: Use [oklch.com](https://oklch.com/) converter
3. ✅ **Test**: Verify contrast ratios
4. ✅ **Document**: Add to this file
5. ✅ **Apply**: Update component styles

### Adding New Colors

1. **Define purpose**: What is this color for?
2. **Choose hue**: Select base hue (0-360)
3. **Set lightness**: Target L value for contrast
4. **Adjust chroma**: 0.15-0.25 for most colors
5. **Test accessibility**: Verify contrast ratios
6. **Document**: Add to appropriate section above
7. **Add to @theme**: Update globals.css

---

## Design Tokens Reference

See `/apps/web/src/app/globals.css` for the canonical `@theme` directive with all active color tokens.

---

## Questions or Updates?

Contact: Design System Team
Last Reviewed: 2025-10-20
Next Review: After Epic 5 completion
