import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import { useReputation } from './api'

vi.mock('@/shared/api', () => ({
  apiClient: { get: vi.fn() },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe('useReputation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { summary: {}, students: [] },
    } as never)
  })

  // 회귀 — { params: {...} } 로 감싸 보내 ?params[cohortIds]= 로 나갔고, 서버가 범위를 못 받아
  // 전 기수(78명)를 집계했다. apiClient.get 의 2번째 인자는 params 객체 그대로다.
  it('기수 범위를 cohortIds 쿼리 파라미터로 보낸다', async () => {
    const queryClient = newClient()
    renderHook(() => useReputation(['c32', 'c34']), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled())
    expect(apiClient.get).toHaveBeenCalledWith('/admin/reputation', {
      cohortIds: 'c32,c34',
    })
  })

  it('조회 범위가 없으면 서버를 부르지 않는다', async () => {
    const queryClient = newClient()
    renderHook(() => useReputation(undefined), {
      wrapper: createWrapper(queryClient),
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})
