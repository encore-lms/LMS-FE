import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from './Header'
import { ToastProvider } from '@/components/ui/Toast'
import { useAuthStore } from '@/shared/store'
import { apiClient } from '@/shared/api'
import type { Role } from '@/shared/types'

// apiClient의 원본 모듈(client)을 mock한다 — 배럴(@/shared/api)의 재export와
// 직접 모듈(@/shared/api/notifications)의 import를 모두 이 mock으로 잡기 위함.
vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

function renderHeader(role: Role) {
  useAuthStore.getState().setSession('tok', {
    id: 'u1',
    email: 'user@playdata.io',
    name: '김유저',
    role,
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('Header 알림 벨', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    vi.clearAllMocks()
  })

  it('운영(MANAGER)도 종을 누르면 서버 알림을 조회한다 (역할 공통)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderHeader('MANAGER')
    await user.click(screen.getByRole('button', { name: '알림' }))
    expect(screen.getByText('알림이 없어요')).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledWith('/notifications')
  })

  it('수강생은 서버 알림을 조회해 드롭다운에 표시한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          id: 'n1',
          title: '과제 마감 임박',
          source: '운영자 박지수',
          relativeTime: '1시간 전',
          unread: true,
        },
      ],
    })
    const user = userEvent.setup()
    renderHeader('STUDENT')
    await user.click(
      await screen.findByRole('button', { name: /알림 1건 미확인/ }),
    )
    expect(screen.getByText('과제 마감 임박')).toBeInTheDocument()
    expect(screen.getByText(/미확인 1건/)).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledWith('/notifications')
  })

  it('멘토·강사에서도 종이 동작한다 (역할 공통)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderHeader('MENTOR')
    await user.click(screen.getByRole('button', { name: '알림' }))
    expect(screen.getByText('알림이 없어요')).toBeInTheDocument()
  })
})

describe('Header 아바타 드롭다운 — 마이 프로필', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    vi.clearAllMocks()
  })

  it.each(['STUDENT', 'INSTRUCTOR', 'MENTOR', 'MANAGER'] as const)(
    '%s 역할도 마이 프로필 메뉴가 항상 보인다 (§7-X)',
    async (role) => {
      const user = userEvent.setup()
      renderHeader(role)
      await user.click(screen.getByRole('button', { name: '프로필 메뉴' }))
      expect(
        screen.getByRole('button', { name: /마이 프로필/ }),
      ).toBeInTheDocument()
    },
  )
})
