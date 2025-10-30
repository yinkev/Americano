'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import * as React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchErrorProps {
  error: string | null
  onRetry?: () => void
  className?: string
}

/**
 * SearchError component displays error states with retry capability
 * Provides clear feedback when search operations fail
 */
export function SearchError({ error, onRetry, className }: SearchErrorProps) {
  if (!error) return null

  return (
    <Alert
      variant="destructive"
      className={cn('border-red-500/20 bg-red-50/80 backdrop-blur-md', className)}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="size-4" aria-hidden="true" />
      <AlertTitle>Search Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm mb-3">{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-lg bg-white/60 hover:bg-white/80"
            aria-label="Retry search"
          >
            <RefreshCw className="size-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
