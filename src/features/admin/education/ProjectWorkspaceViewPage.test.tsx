import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { mockWorkspace } from '@/features/student/projects/mocks'
import ProjectWorkspaceViewPage from './ProjectWorkspaceViewPage'
import { useAdminProjectWorkspace } from './api'

// 탭 내부 수강생 mutation 훅 — readOnly에선 UI가 숨겨져 호출되지 않지만 훅 선언은 실행된다.
vi.mock('@/features/student/api/projects')
vi.mock('@/features/student/api/peers')
vi.mock('./api')
vi.mock('@/features/instructor/education/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useInstructorProjectWorkspace: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

function renderPage() {
  vi.mocked(useAdminProjectWorkspace).mockReturnValue({
    data: mockWorkspace,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAdminProjectWorkspace>)
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={['/admin/education/co1/projects/p1']}>
        <ToastProvider>
          <Routes>
            <Route
              path="/admin/education/:cohortId/projects/:projectId"
              element={<ProjectWorkspaceViewPage source="admin" />}
            />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProjectWorkspaceViewPage (검토자 읽기 전용)', () => {
  it('조회 7탭만 노출 — 상호평가·인증·설정 탭과 히어로 액션이 없다', () => {
    renderPage()
    for (const label of [
      '홈',
      '보드·작업',
      '캘린더',
      '회의록',
      '문서·파일·위키',
      '이슈',
      '성과',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '상호평가' })).toBeNull()
    expect(screen.queryByRole('button', { name: '인증 요청' })).toBeNull()
    expect(screen.queryByRole('button', { name: '설정' })).toBeNull()
    // 히어로 쓰기 진입 2종 미노출
    expect(screen.queryByRole('button', { name: /팀원 초대/ })).toBeNull()
    // 홈 탭 — 작업 완료 체크(쓰기)·GitHub 섹션 미노출, '(본인)' 표기 없음
    expect(screen.queryByRole('button', { name: /완료 처리/ })).toBeNull()
    expect(screen.queryByText(/\(본인\)/)).toBeNull()
  })

  // 검토자는 팀원이 아니라 배정된 작업이 없다 — '내 할 일'은 늘 빈 카드였다.
  // 같은 자리에 운영이 실제로 볼 것(팀의 남은 작업)을 담당자와 함께 보여준다.
  it('홈의 내 할 일 자리에 팀의 남은 작업을 보여준다', () => {
    renderPage()
    expect(screen.getByText('팀 작업 현황')).toBeInTheDocument()
    expect(screen.queryByText('내 할 일')).toBeNull()
    expect(screen.getByText('결제 실패 재시도 로직 구현')).toBeInTheDocument()
    expect(screen.getByText(/최유나 · D-6/)).toBeInTheDocument()
  })
})
