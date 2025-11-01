"use client"

import { useQuery } from "@tanstack/react-query"

interface CurrentUser {
  id: string
  email: string
  name?: string | null
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch("/api/user/profile")

  if (!response.ok) {
    throw new Error("Failed to load current user")
  }

  const body = await response.json()

  if (!body?.success || !body?.data?.user?.id) {
    throw new Error("Invalid current user response")
  }

  return body.data.user as CurrentUser
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  })
}

