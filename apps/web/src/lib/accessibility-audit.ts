/**
 * WCAG 2.1 AAA Accessibility Audit Utilities
 *
 * Based on WCAG documentation from context7 MCP
 * Implements contrast ratio calculation per WCAG G17/G18
 */

/**
 * Calculate relative luminance from RGB values
 * Formula from WCAG G17
 */
export function calculateRelativeLuminance(
  r: number,
  g: number,
  b: number
): number {
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;

  if (R <= 0.04045) R /= 12.92;
  else R = Math.pow((R + 0.055) / 1.055, 2.4);

  if (G <= 0.04045) G /= 12.92;
  else G = Math.pow((G + 0.055) / 1.055, 2.4);

  if (B <= 0.04045) B /= 12.92;
  else B = Math.pow((B + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two luminance values
 * Formula from WCAG G145/G18
 */
export function calculateContrastRatio(L1: number, L2: number): number {
  const lighterL = Math.max(L1, L2);
  const darkerL = Math.min(L1, L2);

  return (lighterL + 0.05) / (darkerL + 0.05);
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get contrast ratio between two hex colors
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    throw new Error("Invalid hex color format");
  }

  const fgLuminance = calculateRelativeLuminance(fg.r, fg.g, fg.b);
  const bgLuminance = calculateRelativeLuminance(bg.r, bg.g, bg.b);

  return calculateContrastRatio(fgLuminance, bgLuminance);
}

/**
 * WCAG 2.1 compliance levels
 */
export type WCAGLevel = "AA" | "AAA";
export type TextSize = "normal" | "large";

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function meetsWCAG(
  ratio: number,
  level: WCAGLevel,
  textSize: TextSize
): boolean {
  if (level === "AAA") {
    return textSize === "normal" ? ratio >= 7 : ratio >= 4.5;
  } else {
    // AA
    return textSize === "normal" ? ratio >= 4.5 : ratio >= 3;
  }
}

/**
 * Audit results for a color pair
 */
export type ColorAudit = {
  foreground: string;
  background: string;
  ratio: number;
  passesAA: {
    normal: boolean;
    large: boolean;
  };
  passesAAA: {
    normal: boolean;
    large: boolean;
  };
};

/**
 * Audit a color pair for WCAG compliance
 */
export function auditColorPair(
  foreground: string,
  background: string
): ColorAudit {
  const ratio = getContrastRatio(foreground, background);

  return {
    foreground,
    background,
    ratio,
    passesAA: {
      normal: meetsWCAG(ratio, "AA", "normal"),
      large: meetsWCAG(ratio, "AA", "large"),
    },
    passesAAA: {
      normal: meetsWCAG(ratio, "AAA", "normal"),
      large: meetsWCAG(ratio, "AAA", "large"),
    },
  };
}

/**
 * Known color palette from globals.css (OKLCH approximated to hex)
 */
export const COLOR_PALETTE = {
  // Light theme
  light: {
    background: "#FAFAFA", // oklch(0.985 0 0)
    foreground: "#1A1A1A", // oklch(0.145 0 0)
    muted: "#F5F5F5", // oklch(0.97 0 0)
    mutedForeground: "#737373", // oklch(0.556 0 0)
    primary: "#292929", // oklch(0.205 0 0)
    primaryForeground: "#FAFAFA", // oklch(0.985 0 0)
    destructive: "#DC2626", // oklch(0.577 0.245 27.325) - approximation
    destructiveForeground: "#FAFAFA",
    success: "#52C98A", // oklch(0.7 0.15 145)
    successForeground: "#F5FFF9",
    border: "#E5E5E5", // oklch(0.922 0 0)
  },
  // Dark theme
  dark: {
    background: "#1A1A1A", // oklch(0.145 0 0)
    foreground: "#FAFAFA", // oklch(0.985 0 0)
    muted: "#404040", // oklch(0.269 0 0)
    mutedForeground: "#A3A3A3", // oklch(0.708 0 0)
    primary: "#FAFAFA", // oklch(0.985 0 0)
    primaryForeground: "#292929", // oklch(0.205 0 0)
    destructive: "#7F1D1D", // oklch(0.396 0.141 25.723) - approximation
    destructiveForeground: "#FAFAFA",
    success: "#6BD49E", // oklch(0.75 0.18 145)
    successForeground: "#1F2F23",
    border: "#404040", // oklch(0.269 0 0)
  },
};

/**
 * Audit all theme colors for WCAG AAA compliance
 */
export function auditThemeColors(): {
  light: ColorAudit[];
  dark: ColorAudit[];
  summary: {
    light: { total: number; passing: number; failing: number };
    dark: { total: number; passing: number; failing: number };
  };
} {
  const lightAudits: ColorAudit[] = [
    auditColorPair(COLOR_PALETTE.light.foreground, COLOR_PALETTE.light.background),
    auditColorPair(
      COLOR_PALETTE.light.mutedForeground,
      COLOR_PALETTE.light.background
    ),
    auditColorPair(COLOR_PALETTE.light.primary, COLOR_PALETTE.light.background),
    auditColorPair(
      COLOR_PALETTE.light.primaryForeground,
      COLOR_PALETTE.light.primary
    ),
    auditColorPair(
      COLOR_PALETTE.light.destructiveForeground,
      COLOR_PALETTE.light.destructive
    ),
    auditColorPair(
      COLOR_PALETTE.light.successForeground,
      COLOR_PALETTE.light.success
    ),
  ];

  const darkAudits: ColorAudit[] = [
    auditColorPair(COLOR_PALETTE.dark.foreground, COLOR_PALETTE.dark.background),
    auditColorPair(
      COLOR_PALETTE.dark.mutedForeground,
      COLOR_PALETTE.dark.background
    ),
    auditColorPair(COLOR_PALETTE.dark.primary, COLOR_PALETTE.dark.background),
    auditColorPair(COLOR_PALETTE.dark.primaryForeground, COLOR_PALETTE.dark.primary),
    auditColorPair(
      COLOR_PALETTE.dark.destructiveForeground,
      COLOR_PALETTE.dark.destructive
    ),
    auditColorPair(
      COLOR_PALETTE.dark.successForeground,
      COLOR_PALETTE.dark.success
    ),
  ];

  return {
    light: lightAudits,
    dark: darkAudits,
    summary: {
      light: {
        total: lightAudits.length,
        passing: lightAudits.filter((a) => a.passesAAA.normal).length,
        failing: lightAudits.filter((a) => !a.passesAAA.normal).length,
      },
      dark: {
        total: darkAudits.length,
        passing: darkAudits.filter((a) => a.passesAAA.normal).length,
        failing: darkAudits.filter((a) => !a.passesAAA.normal).length,
      },
    },
  };
}
