import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import CaseDetailPage from './CaseDetailPage'

vi.mock('../api/troubleshooting', () => ({
  useTsCase: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useLinkTsProject: () => ({ mutate: vi.fn(), isPending: false }),
  useRequestTsCertification: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTsCase: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTsCase: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadTsAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTsAttachment: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../api/projects', () => ({
  useProjectList: () => ({
    data: {
      projects: [
        {
          id: 'p1',
          title: '구독 서비스 고객 이탈 예측',
          kindLabel: '팀',
          teamLabel: '팀 4명',
        },
        {
          id: 'p2',
          title: '다른 프로젝트',
          kindLabel: '개인',
          teamLabel: '개인 프로젝트',
        },
      ],
    },
  }),
}))
vi.mock('./api/changeRequests', () => ({
  useTsChangeState: () => ({ data: undefined }),
}))

/**
 * 프로젝트 이슈 탭에서 시작한 작성 — 연결 대상이 이미 정해져 있다.
 *
 * <p>예전에는 트러블슈팅 화면에서 새로 쓰고 프로젝트를 나중에 골랐다. 고르지 않은 사례가
 * 그대로 쌓여, 어느 프로젝트에서 겪은 문제인지 알 수 없는 기록이 남았다.</p>
 */
function renderNew(search: string) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter
        initialEntries={[`/student/troubleshooting/ts_abc12${search}`]}
      >
        <ToastProvider>
          <Routes>
            <Route
              path="/student/troubleshooting/:id"
              element={<CaseDetailPage />}
            />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CaseDetailPage 새 사례 작성', () => {
  it('projectId로 들어오면 그 프로젝트로 고정하고 연결 변경을 막는다', () => {
    renderNew('?projectId=p1')

    expect(screen.getByText('구독 서비스 고객 이탈 예측')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '연결 변경' })).toBeNull()
    expect(screen.queryByRole('button', { name: '프로젝트 연결' })).toBeNull()
  })

  it('프로젝트 없이 들어오면 예전처럼 직접 연결한다', () => {
    renderNew('')

    expect(screen.getByText('연결된 프로젝트가 없어요')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '프로젝트 연결' }),
    ).toBeInTheDocument()
  })
})
