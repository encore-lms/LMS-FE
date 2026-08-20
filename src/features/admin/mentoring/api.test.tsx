import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  useAdminMentoringLogs,
  useCreateLogTemplate,
  useLogTemplates,
  useMentorAssignments,
  useMentoringStatistics,
} from './api'

vi.mock('@/shared/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

describe('운영 멘토링 API 기수 범위', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} } as never)
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { templateId: 'template-new', name: '새 템플릿' },
    } as never)
  })

  it('모든 목록 조회가 선택한 기수를 쿼리 파라미터로 보낸다', async () => {
    const queryClient = newClient()
    renderHook(
      () => {
        useMentorAssignments('cohort-ai-5')
        useAdminMentoringLogs('cohort-ai-5')
        useLogTemplates('cohort-ai-5')
        useMentoringStatistics('cohort-ai-5')
      },
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(4))
    expect(apiClient.get).toHaveBeenCalledWith('/admin/mentors/assignments', {
      cohort: 'cohort-ai-5',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/admin/mentoring/logs', {
      cohortId: 'cohort-ai-5',
    })
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/mentoring/log-templates',
      { cohortId: 'cohort-ai-5' },
    )
    expect(apiClient.get).toHaveBeenCalledWith('/admin/mentoring/statistics', {
      cohortId: 'cohort-ai-5',
    })
  })

  it('기수 후보가 정해지기 전에는 암묵적 목록 조회를 보내지 않는다', async () => {
    const queryClient = newClient()
    renderHook(
      () => {
        useMentorAssignments(null)
        useAdminMentoringLogs(null)
        useLogTemplates(null)
        useMentoringStatistics(null)
      },
      { wrapper: createWrapper(queryClient) },
    )

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('템플릿 생성도 현재 기수를 명시해 응답 집계 범위를 맞춘다', async () => {
    const queryClient = newClient()
    const { result } = renderHook(() => useCreateLogTemplate('cohort-ai-5'), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ name: '새 템플릿', description: '' })
    })

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled())
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/mentoring/log-templates?cohortId=cohort-ai-5',
      { name: '새 템플릿', description: '' },
    )
  })
})
