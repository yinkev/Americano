/**
 * Design System - Colors
 * OKLCH color tokens for perceptually uniform color space
 * Based on existing globals.css values with TypeScript utilities
 */

export const colors = {
  light: {
    // Base Colors
    background: 'oklch(0.98 0.01 270)',
    foreground: 'oklch(0.25 0.02 270)',

    // Card & Popover
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.25 0.02 270)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0.25 0.02 270)',

    // Primary (Brand)
    primary: 'oklch(0.70 0.09 240)',
    primaryForeground: 'oklch(1 0 0)',

    // Secondary
    secondary: 'oklch(0.70 0.15 150)',
    secondaryForeground: 'oklch(0.25 0.02 270)',

    // Muted
    muted: 'oklch(0.97 0 0)',
    mutedForeground: 'oklch(0.556 0 0)',

    // Accent (Teal for emphasis/CTAs)
    accent: 'oklch(0.77 0.12 210)',
    accentForeground: 'oklch(0.25 0.02 270)',

    // Semantic Colors
    destructive: 'oklch(0.577 0.245 27.325)',
    destructiveForeground: 'oklch(0.985 0 0)',
    success: 'oklch(0.7 0.15 145)',
    successForeground: 'oklch(0.98 0.01 145)',
    warning: 'oklch(0.8 0.15 90)',
    warningForeground: 'oklch(0.3 0.12 90)',
    info: 'oklch(0.65 0.18 240)',
    infoForeground: 'oklch(0.97 0.02 240)',

    // Gamification Colors
    energy: 'oklch(0.7 0.18 50)',
    energyForeground: 'oklch(0.98 0.02 50)',
    clinical: 'oklch(0.6 0.15 230)',
    clinicalForeground: 'oklch(0.97 0.02 230)',
    lab: 'oklch(0.65 0.12 160)',
    labForeground: 'oklch(0.97 0.02 160)',

    // UI Elements
    border: 'oklch(0.922 0 0)',
    input: 'oklch(0.922 0 0)',
    ring: 'oklch(0.708 0 0)',

    // Chart Colors
    chart1: 'oklch(0.646 0.222 41.116)',
    chart2: 'oklch(0.6 0.118 184.704)',
    chart3: 'oklch(0.398 0.07 227.392)',
    chart4: 'oklch(0.828 0.189 84.429)',
    chart5: 'oklch(0.769 0.188 70.08)',
    chartGrid: 'oklch(0.9 0.02 230)',
    chartAxis: 'oklch(0.6 0.03 230)',
    chartText: 'oklch(0.5 0.05 230)',

    // Sidebar
    sidebar: 'oklch(0.985 0 0)',
    sidebarForeground: 'oklch(0.145 0 0)',
    sidebarPrimary: 'oklch(0.205 0 0)',
    sidebarPrimaryForeground: 'oklch(0.985 0 0)',
    sidebarAccent: 'oklch(0.97 0 0)',
    sidebarAccentForeground: 'oklch(0.205 0 0)',
    sidebarBorder: 'oklch(0.922 0 0)',
    sidebarRing: 'oklch(0.708 0 0)',
  },

  dark: {
    // Base Colors
    background: 'oklch(0.145 0 0)',
    foreground: 'oklch(0.985 0 0)',

    // Card & Popover
    card: 'oklch(0.145 0 0)',
    cardForeground: 'oklch(0.985 0 0)',
    popover: 'oklch(0.145 0 0)',
    popoverForeground: 'oklch(0.985 0 0)',

    // Primary (Brand)
    primary: 'oklch(0.6 0.15 250)',
    primaryForeground: 'oklch(0.205 0 0)',

    // Secondary
    secondary: 'oklch(0.269 0 0)',
    secondaryForeground: 'oklch(0.985 0 0)',

    // Muted
    muted: 'oklch(0.269 0 0)',
    mutedForeground: 'oklch(0.708 0 0)',

    // Accent (Teal for dark mode)
    accent: 'oklch(0.75 0.18 210)',
    accentForeground: 'oklch(0.985 0 0)',

    // Semantic Colors
    destructive: 'oklch(0.396 0.141 25.723)',
    destructiveForeground: 'oklch(0.985 0 0)',
    success: 'oklch(0.75 0.18 145)',
    successForeground: 'oklch(0.2 0.1 145)',
    warning: 'oklch(0.85 0.18 85)',
    warningForeground: 'oklch(0.3 0.12 85)',
    info: 'oklch(0.7 0.2 240)',
    infoForeground: 'oklch(0.25 0.12 240)',

    // Gamification Colors
    energy: 'oklch(0.75 0.2 50)',
    energyForeground: 'oklch(0.25 0.12 50)',
    clinical: 'oklch(0.65 0.18 230)',
    clinicalForeground: 'oklch(0.25 0.12 230)',
    lab: 'oklch(0.7 0.15 160)',
    labForeground: 'oklch(0.25 0.1 160)',

    // UI Elements
    border: 'oklch(0.269 0 0)',
    input: 'oklch(0.269 0 0)',
    ring: 'oklch(0.439 0 0)',

    // Chart Colors
    chart1: 'oklch(0.488 0.243 264.376)',
    chart2: 'oklch(0.696 0.17 162.48)',
    chart3: 'oklch(0.769 0.188 70.08)',
    chart4: 'oklch(0.627 0.265 303.9)',
    chart5: 'oklch(0.645 0.246 16.439)',
    chartGrid: 'oklch(0.3 0.02 230)',
    chartAxis: 'oklch(0.5 0.03 230)',
    chartText: 'oklch(0.7 0.05 230)',

    // Sidebar
    sidebar: 'oklch(0.205 0 0)',
    sidebarForeground: 'oklch(0.985 0 0)',
    sidebarPrimary: 'oklch(0.488 0.243 264.376)',
    sidebarPrimaryForeground: 'oklch(0.985 0 0)',
    sidebarAccent: 'oklch(0.269 0 0)',
    sidebarAccentForeground: 'oklch(0.985 0 0)',
    sidebarBorder: 'oklch(0.269 0 0)',
    sidebarRing: 'oklch(0.439 0 0)',
  },
} as const

export type ColorMode = keyof typeof colors
export type ColorToken = keyof typeof colors.light

/**
 * Get color value for current theme mode
 */
export function getColor(token: ColorToken, mode: ColorMode = 'light'): string {
  return colors[mode][token]
}

/**
 * Helper to generate CSS variable references
 */
export function getCSSVar(token: string): string {
  return `var(--${token})`
}
