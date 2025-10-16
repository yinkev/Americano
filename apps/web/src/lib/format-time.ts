/**
 * Format milliseconds to HH:MM:SS format
 * @param ms Milliseconds to format
 * @returns Formatted time string (e.g., "01:23:45")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format milliseconds to a human-readable string
 * @param ms Milliseconds to format
 * @returns Formatted string (e.g., "1h 23m", "45m", "12s")
 */
export function formatDurationHuman(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${secs}s`
  }
}

/**
 * Format milliseconds to minutes (rounded)
 * @param ms Milliseconds to format
 * @returns Minutes as a number
 */
export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000)
}
