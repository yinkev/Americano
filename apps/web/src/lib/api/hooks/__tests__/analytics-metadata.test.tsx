import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDailyInsight } from '../analytics'
import { getMockDailyInsight } from '@/lib/mocks/analytics'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useDailyInsight metadata integration', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalFetch) {
      global.fetch = originalFetch
    } else {
      // @ts-expect-error - allow cleanup when fetch is undefined
      delete global.fetch
    }
  })

  it('tags responses as mock when metadata header is present', async () => {
    const { metadata, payload } = getMockDailyInsight('demo-user')

    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Analytics-Metadata': JSON.stringify(metadata),
          },
        }),
      ) as unknown as typeof fetch

    const { result } = renderHook(() => useDailyInsight('demo-user'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.source).toBe('mock')
  })

  it('defaults to api source when metadata header is missing', async () => {
    const { payload } = getMockDailyInsight('demo-user')

    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ) as unknown as typeof fetch

    const { result } = renderHook(() => useDailyInsight('demo-user'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.source).toBe('api')
  })
})
