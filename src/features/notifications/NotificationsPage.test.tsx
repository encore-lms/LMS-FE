import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationsPage } from './NotificationsPage'
import { ToastProvider } from '@/components/ui/Toast'
import { useAuthStore } from '@/shared/store'
import { apiClient } from '@/shared/api/client'

// 분류 필터는 서버에서 걸어야 커서 페이지네이션과 결과가 어긋나지 않는다 —
// 칩을 고르면 category 파라미터가 실려 나가는지, 서버가 준 칩만 그려지는지 확인한다.
vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const page = {
  items: [
    {
      id: 'n1',
      title: '과제 검토가 완료됐어요',
      source: '과제 검토',
      category: 'ASSIGNMENT',
      categoryLabel: '과제',
      relativeTime: '1시간 전',
      unread: true,
      link: '/student/assignments/a1',
    },
  ],
  nextCursor: null,
  categories: [
    { key: null, label: '전체', count: 3 },
    { key: 'ASSIGNMENT', label: '과제', count: 2 },
    { key: 'QUIZ', label: '퀴즈', count: 1 },
  ],
  unreadTotal: 2,
}

function renderPage() {
  useAuthStore.getState().setSession('tok', {
    id: 'u1',
    email: 'student@playdata.io',
    name: '김수강',
    role: 'STUDENT',
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.get).mockResolvedValue({ data: page } as never)
  })

  it('서버가 준 분류 칩과 알림을 그린다', async () => {
    renderPage()
    expect(
      await screen.findByText('과제 검토가 완료됐어요'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /전체 3/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /과제 2/ })).toBeInTheDocument()
    // 건수 0인 분류는 BE가 빼고 내려주므로 화면에도 없어야 한다.
    expect(screen.queryByRole('button', { name: /출결/ })).toBeNull()
    expect(screen.getByText(/미확인 2건/)).toBeInTheDocument()
  })

  it('분류 칩을 고르면 category 를 실어 다시 조회한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('과제 검토가 완료됐어요')

    await user.click(screen.getByRole('button', { name: /과제 2/ }))

    const last = vi.mocked(apiClient.get).mock.calls.at(-1)
    expect(last?.[0]).toBe('/notifications/inbox')
    expect((last?.[1] as { params: { category?: string } }).params.category).toBe(
      'ASSIGNMENT',
    )
  })
})
