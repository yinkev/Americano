/**
 * Proposed Design Tokens for Americano UI/UX
 *
 * Based on the user's preferences for a soft, playful, gamified, flat, minimal, and hint of glass UI.
 */

export const colors = {
  // Playful accents for gamification
  success: 'oklch(0.8 0.15 145)', // Softer green
  warning: 'oklch(0.85 0.15 85)', // Softer amber
  info: 'oklch(0.75 0.18 240)', // Softer blue
  energy: 'oklch(0.8 0.18 50)', // Softer orange

  // Medical professional
  clinical: 'oklch(0.7 0.15 230)', // Professional blue
  lab: 'oklch(0.75 0.12 160)', // Softer clinical teal
  alert: 'oklch(0.7 0.20 30)', // Softer medical red

  // Neutral light theme
  background: 'oklch(0.99 0 0)', // Almost white
  foreground: 'oklch(0.1 0 0)', // Near black
  muted: 'oklch(0.95 0 0)', // Lighter gray
  mutedForeground: 'oklch(0.4 0 0)', // Darker medium gray
  border: 'oklch(0.9 0 0)', // Lighter border gray
} as const;
