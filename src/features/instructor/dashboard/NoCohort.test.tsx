import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import DashboardPage from './DashboardPage'
import { useInstructorDashboard } from '../api/console'
import type { InstructorDashboardData } from '@/shared/types'

vi.mock('../api/console')

// 담당 기수 0 변형 — 대시보드 대신 안내 표시 (Figma 2750:1974)
const noCohort: InstructorDashboardData = {
  instructorName: '신규',
  cohortCount: 0,
  cohorts: [],
  kpiGrading: { value: 0, hint: '-' },
  kpiRecords: { value: 0, hint: '-' },
  kpiProjects: { value: 0, hint: '-' },
  kpiSupplements: { value: 0, hint: '-' },
  priorities: [],
  shortcuts: {
    quizzes: { badge: 0, hint: '-' },
    students: { hint: '-' },
    reviews: { badge: 0, hint: '-' },
  },
}

describe('대시보드 담당 기수 없음 분기', () => {
  it('cohortCount 0이면 대시보드 대신 안내·다음 단계를 렌더한다', () => {
    vi.mocked(useInstructorDashboard).mockReturnValue({
      data: noCohort,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useInstructorDashboard>)
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/instructor']}>
          <DashboardPage />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.getByText('아직 담당된 기수가 없습니다')).toBeInTheDocument()
    expect(screen.getByText('다음 단계')).toBeInTheDocument()
    expect(
      screen.getByText(/검색, 검토, 과제 생성 액션은 비활성화합니다/),
    ).toBeInTheDocument()
    // 대시보드 본문은 미노출
    expect(screen.queryByText('우선 처리 목록')).not.toBeInTheDocument()
  })
})
