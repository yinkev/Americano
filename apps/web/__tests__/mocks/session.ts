/**
 * NextAuth Session Mock Utilities
 */

export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
}

export const mockUnauthenticatedSession = null

// Mock getServerSession
export const mockGetServerSession = jest.fn(() => Promise.resolve(mockSession))
