import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import { useHrdLiveSummaries, useMyCohorts } from './api/dashboard'
import type { CohortHrdSummary, MyCohortRef } from './dashboard/types'

// emptyBoard·kstToday 는 담당 기수를 보드로 옮기는 순수 함수라 실제 구현을 쓴다.
vi.mock('./api/dashboard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/dashboard')>()),
  useMyCohorts: vi.fn(),
  useHrdLiveSummaries: vi.fn(),
}))

// 운영 대시보드(관제탑형) — 담당 기수 + HRD 라이브로 보드를 만든다.
// CSV 인입(staging) 집계를 걷어낸 뒤로 지표 원천은 HRD 하나다(2026-08-05).

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

const hrd24: CohortHrdSummary = {
  cohortLabel: '24기',
  date: '2026-07-06',
  students: { total: 30, active: 28, dropout: 2 },
  todayPresent: null,
  todayTotal: null,
  todayAbsentees: [],
  avgRate: 91.4,
  weekly: [
    { date: '2026-06-29', rate: 90.0 },
    { date: '2026-06-30', rate: 93.3 },
  ],
  issues: [{ studentUuid: 'u1', name: '문성준', lateCount: 1, absentCount: 5 }],
}

function mockHooks(
  myData: MyCohortRef[] | undefined,
  live: Record<string, CohortHrdSummary> = {},
) {
  vi.mocked(useMyCohorts).mockReturnValue({
    data: myData,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMyCohorts>)
  vi.mocked(useHrdLiveSummaries).mockReturnValue({
    data: live,
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
  // 기수 상태·잔여일은 오늘 기준으로 계산한다 — 예전엔 BE 응답의 today 를 썼다.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-07-06T09:00:00+09:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('전체 뷰 — 기수 비교 표 + 상태 + 통합 관리 필요를 렌더한다', () => {
    mockHooks(refs, { c24: hrd24 })
    renderPage()
    expect(screen.getByText('기수 비교')).toBeInTheDocument()
    expect(screen.getAllByText('24기').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('35기').length).toBeGreaterThanOrEqual(1)
    // 종료일이 지난 24기는 수료, 기간 중인 35기는 진행 중.
    expect(screen.getByText('수료')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('문성준')).toBeInTheDocument()
  })

  // HRD 집계가 없는 기수는 지표를 비운 채로 남는다 — 예전 '인입 대기' 표기를 대체한다.
  it('HRD 집계가 없는 기수는 집계 없음으로 표시한다', () => {
    mockHooks(refs, { c24: hrd24 })
    renderPage()
    expect(screen.getAllByText('집계 없음').length).toBeGreaterThanOrEqual(1)
  })

  it('비교 표 행 클릭 — 해당 기수 상세 모달을 연다', async () => {
    mockHooks(refs, { c24: hrd24 })
    const user = userEvent.setup()
    renderPage()
    await user.click(within(screen.getByRole('table')).getByText('24기'))
    expect(
      screen.getAllByText('SK네트웍스 Family AI 캠프 24기').length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('최종 출석률')).toBeInTheDocument()
  })

  it('담당 기수가 1개면 오늘 인사이트와 기수 상세를 함께 보여준다', () => {
    mockHooks([refs[0]], { c24: hrd24 })
    renderPage()
    expect(screen.getByText('오늘 인사이트')).toBeInTheDocument()
    expect(screen.getByText('최종 출석률')).toBeInTheDocument()
  })

  it('기수가 하나도 없으면 등록 안내 빈 화면을 보여준다', () => {
    // 담당 미배정은 useMyCohorts가 전체 기수로 폴백하므로, refs가 비면 시스템에 기수 자체가 없는 경우다.
    mockHooks([])
    renderPage()
    expect(screen.getByText('등록된 과정·기수가 없어요')).toBeInTheDocument()
  })
})
