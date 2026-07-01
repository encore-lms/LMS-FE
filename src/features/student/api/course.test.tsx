import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import { courseKeys } from '../course/queryKeys'
import { useSubmitAssignment } from './course'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    postNoContent: vi.fn(),
    postForm: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getBlob: vi.fn(),
  },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useSubmitAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('과제 제출 API를 no-content POST로 호출하고 관련 캐시를 무효화한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(apiClient.postNoContent).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubmitAssignment('assignment-1'), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        body: '제출 본문',
        url: 'https://github.com/example/repo',
        assets: ['demo.zip'],
      })
    })

    await waitFor(() => {
      expect(apiClient.postNoContent).toHaveBeenCalledWith(
        '/student/course/assignments/assignment-1/submission',
        {
          body: '제출 본문',
          url: 'https://github.com/example/repo',
          assets: ['demo.zip'],
        },
      )
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: courseKeys.assignment('assignment-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: courseKeys.assignments(),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: courseKeys.home(),
    })
  })
})
