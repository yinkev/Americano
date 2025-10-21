/**
 * Success celebrations using canvas-confetti with OKLCH colors
 *
 * Based on canvas-confetti documentation from context7 MCP
 * All confetti uses OKLCH color space for consistent, accessible colors
 */

import confetti from "canvas-confetti";

/**
 * OKLCH color palette for confetti
 * Converted to hex for canvas-confetti compatibility
 */
const CONFETTI_COLORS = {
  // Primary blues
  blue1: "#5B8DEF", // oklch(0.6 0.15 230)
  blue2: "#7BA5F5", // oklch(0.65 0.18 230)

  // Success greens
  green1: "#52C98A", // oklch(0.6 0.20 140)
  green2: "#6BD49E", // oklch(0.65 0.22 140)

  // Accent purples
  purple1: "#9370DB", // oklch(0.60 0.18 280)
  purple2: "#A989E3", // oklch(0.65 0.20 280)

  // Warm accents
  orange1: "#F0A868", // oklch(0.70 0.20 60)
  orange2: "#F4BC85", // oklch(0.75 0.18 60)

  // Pink highlights
  pink1: "#E679A6", // oklch(0.65 0.20 340)
  pink2: "#EE95B9", // oklch(0.70 0.18 340)
};

const DEFAULT_COLORS = [
  CONFETTI_COLORS.blue1,
  CONFETTI_COLORS.blue2,
  CONFETTI_COLORS.green1,
  CONFETTI_COLORS.green2,
  CONFETTI_COLORS.purple1,
];

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Basic confetti burst
 * Use for: Completing objectives, small wins
 */
export function celebrateBasic() {
  if (prefersReducedMotion()) return;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: DEFAULT_COLORS,
  });
}

/**
 * First study session completed
 * Special celebration with gentle, welcoming effect
 */
export function celebrateFirstSession() {
  if (prefersReducedMotion()) return;

  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: [CONFETTI_COLORS.blue1, CONFETTI_COLORS.green1],
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: [CONFETTI_COLORS.purple1, CONFETTI_COLORS.pink1],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Week streak achieved (7 consecutive days)
 * More dramatic celebration
 */
export function celebrateWeekStreak() {
  if (prefersReducedMotion()) return;

  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 7,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.5 },
      colors: DEFAULT_COLORS,
    });

    confetti({
      particleCount: 7,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.5 },
      colors: DEFAULT_COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Behavioral goal reached
 * Focused burst from center
 */
export function celebrateGoalReached() {
  if (prefersReducedMotion()) return;

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [
      CONFETTI_COLORS.green1,
      CONFETTI_COLORS.green2,
      CONFETTI_COLORS.blue1,
    ],
  });
}

/**
 * Perfect score on objective (100% accuracy)
 * Spectacular celebration
 */
export function celebratePerfectScore() {
  if (prefersReducedMotion()) return;

  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    // Random confetti from random positions
    confetti({
      particleCount: 5,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2,
      },
      colors: [
        CONFETTI_COLORS.green1,
        CONFETTI_COLORS.green2,
        CONFETTI_COLORS.orange1,
        CONFETTI_COLORS.orange2,
      ],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Mission completed
 * Professional, measured celebration
 */
export function celebrateMissionComplete() {
  if (prefersReducedMotion()) return;

  confetti({
    particleCount: 75,
    spread: 60,
    origin: { y: 0.6 },
    colors: [
      CONFETTI_COLORS.blue1,
      CONFETTI_COLORS.green1,
      CONFETTI_COLORS.purple1,
    ],
  });
}

/**
 * Course mastery achieved
 * Grand celebration
 */
export function celebrateCourseMastery() {
  if (prefersReducedMotion()) return;

  const duration = 4000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 10,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.4 },
      colors: DEFAULT_COLORS,
    });

    confetti({
      particleCount: 10,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.4 },
      colors: DEFAULT_COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Generic celebration (fallback)
 */
export function celebrate() {
  celebrateBasic();
}

/**
 * Reset all confetti (stop animations)
 */
export function resetConfetti() {
  confetti.reset();
}

/**
 * Helper to celebrate based on achievement type
 */
export function celebrateAchievement(
  achievement:
    | "first_session"
    | "week_streak"
    | "goal_reached"
    | "perfect_score"
    | "mission_complete"
    | "course_mastery"
    | "basic"
) {
  switch (achievement) {
    case "first_session":
      celebrateFirstSession();
      break;
    case "week_streak":
      celebrateWeekStreak();
      break;
    case "goal_reached":
      celebrateGoalReached();
      break;
    case "perfect_score":
      celebratePerfectScore();
      break;
    case "mission_complete":
      celebrateMissionComplete();
      break;
    case "course_mastery":
      celebrateCourseMastery();
      break;
    case "basic":
    default:
      celebrateBasic();
      break;
  }
}
