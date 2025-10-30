/**
 * Recharts Theme Configuration
 *
 * Custom theme for all Recharts components using OKLCH color space.
 * Ensures consistent styling across charts with accessibility-first design.
 *
 * Usage:
 * ```tsx
 * import { chartTheme, applyChartTheme } from '@/lib/chart-theme'
 *
 * <LineChart {...applyChartTheme()}>
 *   <CartesianGrid {...chartTheme.grid} />
 *   <XAxis {...chartTheme.axis} />
 *   <YAxis {...chartTheme.axis} />
 *   <Tooltip {...chartTheme.tooltip} />
 *   <Legend {...chartTheme.legend} />
 * </LineChart>
 * ```
 */

import React from 'react'

/**
 * OKLCH Chart Colors
 * Perceptually uniform colors optimized for data visualization
 */
export const chartColors = {
  // Primary data series (light mode)
  primary: 'oklch(0.65 0.2 240)', // Blue
  secondary: 'oklch(0.7 0.15 145)', // Green
  tertiary: 'oklch(0.7 0.15 50)', // Orange
  quaternary: 'oklch(0.65 0.2 280)', // Purple
  quinary: 'oklch(0.75 0.18 30)', // Red

  // Chart UI elements
  grid: 'oklch(0.9 0.02 230)', // Light blue-gray grid
  axis: 'oklch(0.6 0.03 230)', // Medium gray axis
  text: 'oklch(0.5 0.05 230)', // Dark gray text
  background: 'oklch(1 0 0)', // White background
  tooltip: {
    background: 'oklch(0.95 0.01 230)',
    border: 'oklch(0.85 0.02 230)',
    text: 'oklch(0.3 0.08 230)',
  },

  // Chart color palette (extends base colors)
  chart1: 'oklch(0.646 0.222 41.116)', // Warm orange
  chart2: 'oklch(0.6 0.118 184.704)', // Teal
  chart3: 'oklch(0.398 0.07 227.392)', // Blue
  chart4: 'oklch(0.828 0.189 84.429)', // Yellow-green
  chart5: 'oklch(0.769 0.188 70.08)', // Yellow
} as const

/**
 * Dark Mode Chart Colors
 * Higher chroma for visibility on dark backgrounds
 */
export const chartColorsDark = {
  // Primary data series (dark mode)
  primary: 'oklch(0.7 0.22 240)', // Brighter blue
  secondary: 'oklch(0.75 0.18 145)', // Brighter green
  tertiary: 'oklch(0.75 0.18 50)', // Brighter orange
  quaternary: 'oklch(0.7 0.22 280)', // Brighter purple
  quinary: 'oklch(0.8 0.2 30)', // Brighter red

  // Chart UI elements
  grid: 'oklch(0.3 0.02 230)', // Dark blue-gray grid
  axis: 'oklch(0.5 0.03 230)', // Medium gray axis
  text: 'oklch(0.7 0.05 230)', // Light gray text
  background: 'oklch(0.145 0 0)', // Dark background
  tooltip: {
    background: 'oklch(0.2 0.01 230)',
    border: 'oklch(0.3 0.02 230)',
    text: 'oklch(0.9 0.02 230)',
  },

  // Chart color palette (dark mode)
  chart1: 'oklch(0.488 0.243 264.376)', // Indigo
  chart2: 'oklch(0.696 0.17 162.48)', // Green-cyan
  chart3: 'oklch(0.769 0.188 70.08)', // Yellow
  chart4: 'oklch(0.627 0.265 303.9)', // Purple
  chart5: 'oklch(0.645 0.246 16.439)', // Rose
} as const

/**
 * Recharts Component Theme
 * Pre-configured props for Recharts components
 */
export const chartTheme = {
  /**
   * CartesianGrid styling
   * Light, subtle grid lines that don't distract from data
   */
  grid: {
    stroke: chartColors.grid,
    strokeDasharray: '3 3',
    strokeWidth: 1,
    opacity: 0.5,
  },

  /**
   * Axis styling (XAxis, YAxis)
   * Consistent stroke color, accessible text
   */
  axis: {
    stroke: chartColors.axis,
    tick: { fill: chartColors.text, fontSize: 12 },
    tickLine: { stroke: chartColors.axis },
    axisLine: { stroke: chartColors.axis },
  },

  /**
   * Axis label styling
   * For X/Y axis labels with standard positioning
   */
  axisLabel: {
    style: {
      fill: chartColors.text,
      fontSize: 12,
      fontWeight: 500,
    },
  },

  /**
   * Tooltip styling
   * Glassmorphism-inspired with OKLCH colors
   */
  tooltip: {
    contentStyle: {
      backgroundColor: chartColors.tooltip.background,
      border: `1px solid ${chartColors.tooltip.border}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 16px oklch(0 0 0 / 0.1)',
    },
    itemStyle: {
      color: chartColors.tooltip.text,
      fontSize: 12,
    },
    labelStyle: {
      color: chartColors.tooltip.text,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: '4px',
    },
    cursor: {
      stroke: chartColors.grid,
      strokeWidth: 1,
      strokeDasharray: '5 5',
    },
  },

  /**
   * Legend styling
   * Horizontal legend with proper spacing
   */
  legend: {
    wrapperStyle: {
      paddingTop: '16px',
      fontSize: '12px',
      color: chartColors.text,
    },
    iconSize: 12,
    iconType: 'circle' as const,
  },

  /**
   * Reference Line styling
   * For highlighting specific values or thresholds
   */
  referenceLine: {
    stroke: chartColors.axis,
    strokeDasharray: '5 5',
    strokeWidth: 1.5,
    label: {
      style: {
        fill: chartColors.text,
        fontSize: 11,
        fontWeight: 600,
      },
    },
  },

  /**
   * Brush styling (for zooming/filtering)
   * Subtle gray overlay
   */
  brush: {
    fill: 'oklch(0.9 0 0 / 0.3)',
    stroke: chartColors.grid,
    height: 30,
  },
} as const

/**
 * Dark Mode Recharts Theme
 * Same structure as light mode, different colors
 */
export const chartThemeDark = {
  grid: {
    stroke: chartColorsDark.grid,
    strokeDasharray: '3 3',
    strokeWidth: 1,
    opacity: 0.5,
  },

  axis: {
    stroke: chartColorsDark.axis,
    tick: { fill: chartColorsDark.text, fontSize: 12 },
    tickLine: { stroke: chartColorsDark.axis },
    axisLine: { stroke: chartColorsDark.axis },
  },

  axisLabel: {
    style: {
      fill: chartColorsDark.text,
      fontSize: 12,
      fontWeight: 500,
    },
  },

  tooltip: {
    contentStyle: {
      backgroundColor: chartColorsDark.tooltip.background,
      border: `1px solid ${chartColorsDark.tooltip.border}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 16px oklch(0 0 0 / 0.3)',
    },
    itemStyle: {
      color: chartColorsDark.tooltip.text,
      fontSize: 12,
    },
    labelStyle: {
      color: chartColorsDark.tooltip.text,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: '4px',
    },
    cursor: {
      stroke: chartColorsDark.grid,
      strokeWidth: 1,
      strokeDasharray: '5 5',
    },
  },

  legend: {
    wrapperStyle: {
      paddingTop: '16px',
      fontSize: '12px',
      color: chartColorsDark.text,
    },
    iconSize: 12,
    iconType: 'circle' as const,
  },

  referenceLine: {
    stroke: chartColorsDark.axis,
    strokeDasharray: '5 5',
    strokeWidth: 1.5,
    label: {
      style: {
        fill: chartColorsDark.text,
        fontSize: 11,
        fontWeight: 600,
      },
    },
  },

  brush: {
    fill: 'oklch(0.2 0 0 / 0.3)',
    stroke: chartColorsDark.grid,
    height: 30,
  },
} as const

/**
 * Chart container default props
 * Standard margin for consistent chart spacing
 */
export const chartContainerDefaults = {
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
}

/**
 * Helper function to apply chart theme based on dark mode
 *
 * @param isDark - Whether dark mode is active
 * @returns Chart theme object
 */
export function getChartTheme(isDark = false) {
  return isDark ? chartThemeDark : chartTheme
}

/**
 * Helper function to get chart colors based on dark mode
 *
 * @param isDark - Whether dark mode is active
 * @returns Chart colors object
 */
export function getChartColors(isDark = false) {
  return isDark ? chartColorsDark : chartColors
}

/**
 * Apply chart theme to chart container
 * Returns props to spread onto LineChart, BarChart, etc.
 *
 * @example
 * ```tsx
 * <LineChart data={data} {...applyChartTheme()}>
 *   <CartesianGrid {...chartTheme.grid} />
 *   <XAxis {...chartTheme.axis} />
 * </LineChart>
 * ```
 */
export function applyChartTheme(customMargin?: typeof chartContainerDefaults.margin) {
  return {
    ...chartContainerDefaults,
    margin: customMargin || chartContainerDefaults.margin,
  }
}

/**
 * Get data series colors
 * Returns array of colors for multi-series charts
 *
 * @param isDark - Whether dark mode is active
 * @param count - Number of colors needed (1-5)
 * @returns Array of OKLCH color strings
 */
export function getDataColors(isDark = false, count = 5): string[] {
  const colors = isDark ? chartColorsDark : chartColors
  return [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5].slice(0, count)
}

/**
 * Custom Tooltip Component (Optional)
 * Pre-styled tooltip with glassmorphism for Recharts
 *
 * @example
 * ```tsx
 * <Tooltip content={<CustomChartTooltip />} />
 * ```
 */
export function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div
      className="rounded-lg shadow-lg backdrop-blur-sm"
      style={{
        backgroundColor: chartColors.tooltip.background,
        border: `1px solid ${chartColors.tooltip.border}`,
        padding: '12px',
      }}
    >
      {label && (
        <p className="font-semibold mb-2" style={{ color: chartColors.tooltip.text, fontSize: 13 }}>
          {label}
        </p>
      )}
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: chartColors.tooltip.text }}>
            {entry.name}: <strong>{entry.value}</strong>
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Accessibility: ARIA label generator for charts
 *
 * @param chartType - Type of chart (line, bar, scatter, etc.)
 * @param dataPoints - Number of data points
 * @param description - Brief description of what the chart shows
 */
export function generateChartAriaLabel(
  chartType: string,
  dataPoints: number,
  description: string,
): string {
  return `${chartType} chart with ${dataPoints} data points showing ${description}`
}

/**
 * Accessibility: Chart wrapper with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <div {...getChartAccessibilityProps('line', 12, 'user performance over time')}>
 *   <LineChart>...</LineChart>
 * </div>
 * ```
 */
export function getChartAccessibilityProps(
  chartType: string,
  dataPoints: number,
  description: string,
) {
  return {
    role: 'img',
    'aria-label': generateChartAriaLabel(chartType, dataPoints, description),
    tabIndex: 0,
  }
}
