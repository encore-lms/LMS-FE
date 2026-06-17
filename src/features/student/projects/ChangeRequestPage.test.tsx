import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import ChangeRequestPage from './ChangeRequestPage'

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
  it('빈 변경 사유 제출을 차단하고 danger 토스트를 띄운다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.clear(
      screen.getByDisplayValue(
        '결제 모듈 리팩터링 결과를 설명에 반영하고, 최신 API 명세서로 산출물을 교체하기 위함입니다.',
      ),
    )
    await user.click(screen.getByRole('button', { name: '변경 제안 저장' }))

    expect(
      await screen.findByText('변경 사유를 입력해 주세요'),
    ).toBeInTheDocument()
  })

  it('변경 제안을 저장하면 성공 토스트를 띄운다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '변경 제안 저장' }))

    expect(
      await screen.findByText('변경 제안을 저장했습니다'),
    ).toBeInTheDocument()
  })
})
