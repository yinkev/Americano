// Type declarations for Recharts compatibility with React 19
// Fixes TS2786 "cannot be used as a JSX component" errors
// This is a temporary fix until Recharts fully supports React 19

declare module 'recharts' {
  import type * as React from 'react'
  import type { ComponentType } from 'react'

  // Recharts component props (simplified for React 19 compatibility)
  export interface BaseChartProps {
    width?: number | string
    height?: number | string
    data?: any[]
    margin?: { top?: number; right?: number; bottom?: number; left?: number }
    children?: React.ReactNode
    [key: string]: any
  }

  export interface CartesianAxisProps {
    dataKey?: string | number | ((obj: any) => any)
    type?: 'number' | 'category'
    allowDataOverflow?: boolean
    allowDecimals?: boolean
    domain?: [number | string | ((dataMin: number) => number), number | string | ((dataMax: number) => number)]
    [key: string]: any
  }

  export interface PolarAxisProps {
    dataKey?: string
    cx?: number | string
    cy?: number | string
    [key: string]: any
  }

  // Chart Components
  export const LineChart: ComponentType<BaseChartProps>
  export const BarChart: ComponentType<BaseChartProps>
  export const AreaChart: ComponentType<BaseChartProps>
  export const PieChart: ComponentType<BaseChartProps>
  export const RadarChart: ComponentType<BaseChartProps>
  export const ScatterChart: ComponentType<BaseChartProps>
  export const ComposedChart: ComponentType<BaseChartProps>
  export const ResponsiveContainer: ComponentType<{ width?: number | string; height?: number | string; children?: React.ReactNode; [key: string]: any }>

  // Series Components
  export const Line: ComponentType<any>
  export const Bar: ComponentType<any>
  export const Area: ComponentType<any>
  export const Pie: ComponentType<any>
  export const Radar: ComponentType<any>
  export const Scatter: ComponentType<any>

  // Axis Components
  export const XAxis: ComponentType<CartesianAxisProps>
  export const YAxis: ComponentType<CartesianAxisProps>
  export const ZAxis: ComponentType<any>
  export const PolarAngleAxis: ComponentType<PolarAxisProps>
  export const PolarRadiusAxis: ComponentType<PolarAxisProps>

  // Grid Components
  export const CartesianGrid: ComponentType<any>
  export const PolarGrid: ComponentType<any>

  // Reference Components
  export const ReferenceLine: ComponentType<any>
  export const ReferenceDot: ComponentType<any>
  export const ReferenceArea: ComponentType<any>

  // Utility Components
  export const Legend: ComponentType<any>
  export const Tooltip: ComponentType<any>
  export const Brush: ComponentType<any>
  export const Cell: ComponentType<any>
  export const Label: ComponentType<any>
  export const LabelList: ComponentType<any>
}
