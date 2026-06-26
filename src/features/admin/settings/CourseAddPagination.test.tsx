import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/Toast'
import CourseAddPage from './CourseAddPage'

// 실제 useHrdCourseSearch(React Query) 흐름을 그대로 태우고, apiClient만 page별 데이터로 모킹.
// → 페이지 번호 클릭 시 setPage → 재조회 → 데이터 교체가 실제로 일어나는지 검증.
vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn((url: string, params?: { page?: number }) => {
      // 인증키 select용 활성 HRD Key 목록.
      if (url.includes('/admin/hrd-keys')) {
        return Promise.resolve({
          data: {
            items: [
              {
                id: 'key-1',
                name: '운영키',
                maskedKey: '****AAAA',
                description: null,
                active: true,
                createdBy: 'u',
                updatedBy: 'u',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ],
            page: 0,
            size: 100,
            totalElements: 1,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
            sort: 'latest',
          },
        })
      }
      // 과정 검색(page별 다른 데이터).
      const page = params?.page ?? 1
      const results = Array.from({ length: 12 }, (_, i) => ({
        trprId: `T-${page}-${i + 1}`,
        status: 'unregistered' as const,
        title: `${page}페이지 과정 ${i + 1}`,
        grade: `${i + 1}기`,
        period: '2026-01-01 ~ 2026-06-30',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        capacity: 100,
        applied: 50,
        hrdUrl: 'https://www.hrd.go.kr/',
      }))
      return Promise.resolve({
        data: {
          summary: { total: 128, registrable: 100, registered: 18, ended: 10 },
          page,
          pageSize: 12,
          totalPages: 11,
          results,
        },
      })
    }),
  },
  adminKeys: {
    settingsHrdSearch: (params: unknown) =>
      ['admin', 'settings', 'hrd-search', params ?? {}] as const,
    settingsHrdKeyList: (params: unknown) =>
      ['admin', 'settings', 'hrd-keys', 'list', params ?? {}] as const,
  },
}))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <CourseAddPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('CourseAddPage 페이지네이션', () => {
  it('페이지 번호를 누르면 해당 페이지 데이터로 카드가 바뀐다', async () => {
    const user = userEvent.setup()
    renderPage()

    // 조회 후에만 검색된다.
    await user.click(screen.getByRole('button', { name: '조회' }))

    // 1페이지 데이터
    expect(await screen.findByText('1페이지 과정 1')).toBeInTheDocument()

    // 2페이지로 이동
    await user.click(screen.getByRole('button', { name: '2' }))

    // 2페이지 데이터로 교체되고 1페이지 데이터는 사라진다
    expect(await screen.findByText('2페이지 과정 1')).toBeInTheDocument()
    expect(screen.queryByText('1페이지 과정 1')).not.toBeInTheDocument()
  })
})
