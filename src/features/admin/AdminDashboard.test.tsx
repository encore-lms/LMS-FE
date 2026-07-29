import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import {
  useHrdLiveSummaries,
  useMyCohorts,
  useOperatorDashboard,
} from './api/dashboard'
import type {
  CohortBoard,
  MyCohortRef,
  OperatorDashboard,
} from './dashboard/types'

vi.mock('./api/dashboard')

// 운영 대시보드(관제탑형) — 전체 비교 표 렌더 + 기수 칩 전환 + 미배정 빈 화면.

const refs: MyCohortRef[] = [
  {
    cohortId: 'c24',
    courseId: 'course1',
    courseName: 'SK네트웍스 Family AI 캠프',
    cohortNo: '24',
    startDate: '2025-12-30',
    endDate: '2026-06-30',
  },
  {
    cohortId: 'c35',
    courseId: 'course1',
    courseName: 'SK네트웍스 Family AI 캠프',
    cohortNo: '35',
    startDate: '2026-06-16',
    endDate: '2026-12-08',
  },
]

const board24: CohortBoard = {
  cohortId: 'c24',
  courseName: 'SK네트웍스 Family AI 캠프',
  cohortLabel: '24기',
  startDate: '2025-12-30',
  endDate: '2026-06-30',
  status: 'ended',
  daysLeft: -6,
  hasData: true,
  students: { total: 30, active: 28, dropout: 2 },
  attendance: {
    todayPresent: null,
    todayTotal: null,
    avgRate: 91.4,
    weekly: [
      { date: '2026-06-29', rate: 90.0 },
      { date: '2026-06-30', rate: 93.3 },
    ],
    todayAbsentees: [],
  },
  assessment: {
    avg: 66.1,
    rounds: [{ round: 1, avg: 81.4 }],
    latestRound: 1,
    latestAvg: 81.4,
    delta: null,
    lowPerformers: 0,
    nonTakers: 2,
  },
  weeklyCheck: null,
  issues: [{ studentUuid: 'u1', name: '문성준', lateCount: 1, absentCount: 5 }],
  pending: { certificates: 4, troubleshooting: 5 },
}

const board35: CohortBoard = {
  ...board24,
  cohortId: 'c35',
  cohortLabel: '35기',
  startDate: '2026-06-16',
  endDate: '2026-12-08',
  status: 'operating',
  daysLeft: 155,
  hasData: false,
  students: null,
  attendance: null,
  assessment: null,
  issues: [],
  pending: null,
}

const dashboard: OperatorDashboard = {
  today: '2026-07-06',
  cohorts: [board24, board35],
  quarantineCount: 2,
  upcoming: [],
}

function mockHooks(
  myData: MyCohortRef[] | undefined,
  boardData: OperatorDashboard | undefined,
) {
  vi.mocked(useMyCohorts).mockReturnValue({
    data: myData,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMyCohorts>)
  vi.mocked(useOperatorDashboard).mockReturnValue({
    data: boardData,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useOperatorDashboard>)
  vi.mocked(useHrdLiveSummaries).mockReturnValue({
    // HRD 라이브 쿼리가 resolve된 상태(빈 결과) — 35기는 HRD 데이터 없이 '인입 대기'로 렌더.
    data: {},
    isPending: false,
    isFetching: false,
    isError: false,
  } as unknown as ReturnType<typeof useHrdLiveSummaries>)
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  )
}

describe('AdminDashboard (관제탑형)', () => {
  it('전체 뷰 — KPI 합산 + 기수 비교 표 + 통합 관리 필요를 렌더한다', () => {
    mockHooks(refs, dashboard)
    renderPage()
    expect(screen.getByText('기수 비교')).toBeInTheDocument()
    expect(screen.getAllByText('24기').length).toBeGreaterThanOrEqual(2) // 칩 + 표 행
    // 35기는 칩과 표에 모두 존재
    expect(screen.getAllByText('35기').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('수료')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    // 미인입 기수 표기
    expect(screen.getAllByText('인입 대기').length).toBeGreaterThanOrEqual(1)
    // 통합 관리 필요 리스트
    expect(screen.getByText('문성준')).toBeInTheDocument()
  })

  it('비교 표 행 클릭 — 해당 기수 상세 모달을 연다', async () => {
    // 헤더 기수 칩 제거(운영 요구) 이후 상세 진입은 비교 표 행 클릭(onRowClick)이다.
    mockHooks(refs, dashboard)
    renderPage()
    const user = userEvent.setup()
    await user.click(within(screen.getByRole('table')).getByText('24기'))
    // 기수명은 연속 지각·결석 감지 그룹 헤더에도 렌더되므로 존재 여부만 단언한다.
    expect(
      screen.getAllByText('SK네트웍스 Family AI 캠프 24기').length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('최종 출석률')).toBeInTheDocument()
    expect(screen.getByText('성취도 평가 회차별 평균')).toBeInTheDocument()
  })

  it('담당 기수가 1개면 오늘 인사이트와 기수 상세를 함께 보여준다', () => {
    mockHooks([refs[0]], { ...dashboard, cohorts: [board24] })
    renderPage()
    // 상단 인사이트 히어로 + 아래 해당 기수 딥다이브(수료 기수 → 최종 출석률)가 같이 렌더된다.
    expect(screen.getByText('오늘 인사이트')).toBeInTheDocument()
    expect(screen.getByText('최종 출석률')).toBeInTheDocument()
  })

  it('기수가 하나도 없으면 등록 안내 빈 화면을 보여준다', () => {
    // 담당 미배정은 useMyCohorts가 전체 기수로 폴백하므로, refs가 비면 시스템에 기수 자체가 없는 경우다.
    mockHooks([], undefined)
    renderPage()
    expect(screen.getByText('등록된 과정·기수가 없어요')).toBeInTheDocument()
  })
})
