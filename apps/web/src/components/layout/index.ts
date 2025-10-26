/**
 * Layout Components - Barrel Export
 * Core layout architecture for Americano
 *
 * Usage:
 * import { AppShell, TopHeader, PageTransition, CardSkeleton } from '@/components/layout'
 */

// Main layout components
export { AppShell } from './app-shell'
export type { AppShellProps } from './app-shell'

export { TopHeader } from './top-header'

// Page transitions
export {
  PageTransition,
  PageFadeTransition,
  PageScaleTransition,
} from './page-transition'
export type { PageTransitionProps } from './page-transition'

// Loading states
export {
  CardSkeleton,
  ListSkeleton,
  ChartSkeleton,
  HeaderSkeleton,
  TableSkeleton,
  GridSkeleton,
} from './loading-states'
export type {
  CardSkeletonProps,
  ListSkeletonProps,
  ChartSkeletonProps,
  HeaderSkeletonProps,
  TableSkeletonProps,
  GridSkeletonProps,
} from './loading-states'
