import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/client'
import { tokenStore } from './api/tokens'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Client errors (403/404/422…) won't fix themselves; only retry network/5xx.
      retry: (count, err) =>
        err instanceof ApiError && err.status >= 400 && err.status < 500 ? false : count < 2,
    },
  },
})

// Never keep another user's data (visits, photos) in memory after logout.
tokenStore.subscribe((session) => {
  if (!session) queryClient.clear()
})
