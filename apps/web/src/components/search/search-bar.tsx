'use client'

import { Loader2, Search, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = 'Search lectures, concepts, and medical terms...',
  className,
  autoFocus = true,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Keyboard shortcut: Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // Enter to search
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        onSearch?.(value)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [value, onSearch])

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="size-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="size-4 text-muted-foreground" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-11 pl-9 pr-20 rounded-xl',
            'bg-white/80 backdrop-blur-md border-white/40',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
            'placeholder:text-muted-foreground/60',
          )}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClear}
              className="rounded-lg hover:bg-white/60"
            >
              <X className="size-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}

          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
    </div>
  )
}
