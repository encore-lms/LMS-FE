import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import AdminDashboard from './AdminDashboard'
import { useAdminDashboard } from './api/dashboard'
import type { AdminOperatorDashboard } from './dashboard/types'

vi.mock('./api/dashboard')

type DashboardHook = ReturnType<typeof useAdminDashboard>

const dashboard: AdminOperatorDashboard = {
  today: '2026-07-02',
  hrdAvailable: true,
  cohorts: [
    {
      cohortId: 'c1',
      name: 'SKN 22기',
      totalStudents: 20,
      checkedInToday: 18,
      absentToday: [
        { id: 's1', name: '김민준' },
        { id: 's2', name: '이서연' },
      ],
      weeklyAttendanceRate: [95, 90, 100, 88, 92],
    },
  ],
  repeatedIssues: [
    {
      studentId: 's2',
      name: '이서연',
      cohortName: 'SKN 22기',
      lateCount: 3,
      absenceCount: 1,
    },
  ],
  pending: {
    mileage: 4,
    blog: 6,
    study: 2,
    certificate: 1,
    recordsTotal: 9,
    topCohort: { mileage: null, blog: 'c1', study: 'c1', certificate: 'c1' },
  },
  upcoming: {
    quizzes: [
      {
        id: 'q1',
        title: 'Python 평가',
        cohortName: 'SKN 22기',
        endAt: '2026-07-03T18:00:00',
        questionCount: 20,
        totalScore: 100,
      },
    ],
    cohortEndings: [
      { cohortId: 'c1', name: 'SKN 22기', endDate: '2026-07-20', daysLeft: 18 },
    ],
  },
}

function mockHook(value: Partial<DashboardHook>) {
  vi.mocked(useAdminDashboard).mockReturnValue(
    value as unknown as DashboardHook,
  )
}

function renderDash() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AdminDashboard />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('AdminDashboard (운영 대시보드 포팅)', () => {
  it('핵심 섹션(오늘 미출석·연속 결석·처리 대기·일정)을 렌더한다', () => {
    mockHook({
      data: dashboard,
      isPending: false,
      isError: false,
      isFetching: false,
    })
    renderDash()
    expect(screen.getByText('오늘 미출석 체크')).toBeInTheDocument()
    expect(screen.getByText('연속 지각·결석 감지')).toBeInTheDocument()
    // '처리 대기'는 히어로 지표 타일에도 나오므로 섹션 제목(heading)으로 특정
    expect(
      screen.getByRole('heading', { name: /처리 대기/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('일정')).toBeInTheDocument()
    // 미출석자 이름 + 처리 대기 라벨
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('마일리지 구매 요청')).toBeInTheDocument()
    expect(screen.getByText('Python 평가')).toBeInTheDocument()
  })

  it('에러 상태에서 다시 시도 버튼을 표시한다', () => {
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderDash()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
