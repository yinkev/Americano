'use client'

import { User } from 'lucide-react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AvatarPickerProps {
  currentAvatar?: string
  onSelect?: (avatar: string) => void
}

export function AvatarPicker({ currentAvatar, onSelect }: AvatarPickerProps) {
  return (
    <Avatar>
      <AvatarImage src={currentAvatar} alt="User avatar" />
      <AvatarFallback>
        <User className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  )
}
