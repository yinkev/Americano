/**
=======
 * Temporary stub for useToast hook
 * TODO: Install shadcn/ui toast component: npx shadcn@latest add toast
 */

export function useToast() {
  return {
    toast: (options: {
      title?: string
      description?: string
      variant?: 'default' | 'destructive'
    }) => {
      // Stub implementation - just log for now
      console.log('[Toast]', options.title, options.description)
    },
  }
}
