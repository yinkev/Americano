import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  userEmail: string
  setUserEmail: (email: string) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userEmail: 'kevy@americano.dev', // Default user
      setUserEmail: (email) => set({ userEmail: email }),
    }),
    {
      name: 'americano-user-storage',
    },
  ),
)
