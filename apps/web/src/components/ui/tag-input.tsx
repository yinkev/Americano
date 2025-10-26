/**
 * TagInput Component
 * Input component for managing array of tags/strings
 */

'use client'

import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { Input } from './input'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
  disabled?: boolean
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  className,
  maxTags,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()

      // Check if tag already exists
      if (value.includes(inputValue.trim())) {
        setInputValue('')
        return
      }

      // Check max tags limit
      if (maxTags && value.length >= maxTags) {
        return
      }

      onChange([...value, inputValue.trim()])
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div
      className={cn(
        'flex min-h-[2.5rem] w-full flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card  px-4 py-3',
        'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50',
        'transition-all duration-200 shadow-none',
        disabled && 'opacity-50 cursor-not-allowed bg-muted',
        className,
      )}
    >
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className={cn(
            'px-2 py-1 text-xs font-medium',
            'bg-card text-blue-700 border border-blue-200',
            ' rounded-full',
            'flex items-center gap-1',
            'transition-all duration-200 hover:bg-card',
          )}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            disabled={disabled}
            className="ml-1 hover:text-blue-900 focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
        className={cn(
          'flex-1 min-w-[120px] border-0 bg-transparent px-0 py-0',
          'focus-visible:ring-0 focus-visible:ring-offset-0',
          'placeholder:text-gray-400',
        )}
      />
    </div>
  )
}
