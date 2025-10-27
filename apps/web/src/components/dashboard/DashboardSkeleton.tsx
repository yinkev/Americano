'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Dashboard Skeleton Loader
 *
 * Displays loading state while dashboard data is being fetched
 * Matches the structure of the actual dashboard for smooth transitions
 */
export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-auto relative">
      <main className="container mx-auto px-4 py-4 max-w-[1600px]">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-16 w-32 rounded-xl" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="bg-white/80 backdrop-blur-md border-white/30"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mission card skeleton */}
            <Card className="bg-white/80 backdrop-blur-md border-white/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-10 rounded" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-5 w-5 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress chart skeleton */}
            <Card className="bg-white/80 backdrop-blur-md border-white/30">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="bg-white/80 backdrop-blur-md border-white/30"
              >
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievement banner skeleton */}
        <Card className="bg-white/80 backdrop-blur-md border-white/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
