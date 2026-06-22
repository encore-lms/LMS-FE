import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import ChangeRequestPage from './ChangeRequestPage'
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
      screen.getByPlaceholderText('왜 다시 수정해야 하는지 적어주세요'),
    )
    await user.click(screen.getByRole('button', { name: '수정 권한 요청' }))

    expect(
      await screen.findByText('수정 사유를 입력해 주세요'),
    ).toBeInTheDocument()
  })

  it('수정 권한을 요청하면 성공 토스트와 승인 대기 상태를 보여준다', async () => {
    const user = userEvent.setup()
    renderPage()

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
