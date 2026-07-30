import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import ChangeRequestPage from './ChangeRequestPage'
// 변경 제안 실 BE 훅 mock — GET 은 서버 상태 없음(none), POST 는 즉시 성공.
vi.mock('./api/changeRequests', () => ({
  useProjectChangeStatus: () => ({ data: undefined }),
  useRequestProjectChange: () => ({
    mutate: (_reason: string, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  }),
  useSubmitProjectRevision: () => ({
    mutate: (_summary: string, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  }),
  useCancelProjectChange: () => ({
    mutate: (_v: undefined, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  }),
}))
// 어느 프로젝트인지 화면에 보여 주려고 워크스페이스를 읽는다 — 테스트에선 제목만 준다.
vi.mock('../api/projects', () => ({
  useProjectWorkspace: () => ({
    data: {
      id: 'p1',
      title: 'Encore Mart — 마이크로서비스 백엔드',
      meta: '팀 프로젝트 · 5명 · 2026-06-01 ~ 2026-07-21',
      status: 'certified',
    },
  }),
}))
import { useProjectFlow } from './workspace/useProjectFlow'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter
          initialEntries={['/student/projects/p1/change-requests/new']}
        >
          <Routes>
            <Route
              path="/student/projects/:projectId/change-requests/new"
              element={<ChangeRequestPage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('ChangeRequestPage', () => {
  beforeEach(() => {
    // 모듈 전역 zustand 스토어 — 테스트 간 수정 권한 상태 누수 방지.
    useProjectFlow.setState({ phases: {}, editRequests: {} })
  })

  it('빈 수정 사유로 권한 요청을 차단하고 danger 토스트를 띄운다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.clear(
      screen.getByPlaceholderText(/왜 다시 수정해야 하는지 적어주세요/),
    )
    await user.click(screen.getByRole('button', { name: '수정 권한 요청' }))

    expect(
      await screen.findByText('수정 사유를 입력해 주세요'),
    ).toBeInTheDocument()
  })

  it('수정 권한을 요청하면 성공 토스트와 승인 대기 상태를 보여준다', async () => {
    const user = userEvent.setup()
    renderPage()

    // 예시 문구는 placeholder 로만 보여 준다 — 사유는 수강생이 직접 적는다.
    await user.type(
      screen.getByPlaceholderText(/왜 다시 수정해야 하는지 적어주세요/),
      '산출물 링크가 만료되어 최신 문서로 교체하려 합니다.',
    )
    await user.click(screen.getByRole('button', { name: '수정 권한 요청' }))

    expect(
      await screen.findByText('수정 권한을 요청했어요'),
    ).toBeInTheDocument()
    // 승인 대기 상태로 전환 — '요청 취소' 액션은 requested 상태에만 존재.
    expect(
      await screen.findByRole('button', { name: '요청 취소' }),
    ).toBeInTheDocument()
  })
})
