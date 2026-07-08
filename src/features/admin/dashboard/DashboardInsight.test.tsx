import { describe, expect, it } from 'vitest'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { DashboardInsight } from './DashboardInsight'
import type { CohortBoard } from './types'

// 오늘 인사이트 — 데이터 상황에 따라 액션 큐·인사이트 문장을 자동 생성한다.

function board(over: Partial<CohortBoard>): CohortBoard {
  return {
    cohortId: 'c',
    courseName: 'SK네트웍스 Family AI 캠프',
    cohortLabel: '35기',
    startDate: '2026-06-16',
    endDate: '2026-12-08',
    status: 'operating',
    daysLeft: 120,
    hasData: true,
    students: { total: 30, active: 30, dropout: 0 },
    attendance: {
      todayPresent: 28,
      todayTotal: 30,
      avgRate: 92,
      weekly: [],
      todayAbsentees: [
        { studentUuid: 'u1', name: '김OO', detail: '무단' },
        { studentUuid: 'u2', name: '이OO', detail: '질병' },
      ],
    },
    assessment: null,
    weeklyCheck: null,
    issues: [],
    pending: { certificates: 3, troubleshooting: 2 },
    ...over,
  }
}

function renderInsight(props: ComponentProps<typeof DashboardInsight>) {
  return render(
    <MemoryRouter>
      <DashboardInsight {...props} />
    </MemoryRouter>,
  )
}

describe('DashboardInsight', () => {
  it('오늘 미출석이 있으면 미출석 공지 액션과 공지 인사이트를 만든다', () => {
    renderInsight({
      boards: [board({})],
      quarantineCount: 0,
      today: '2026-07-06',
      upcoming: [],
    })
    expect(screen.getByText('미출석 공지')).toBeInTheDocument()
    expect(screen.getByText('2명')).toBeInTheDocument()
    expect(
      screen.getByText(/오늘 입실하지 않은 수강생 2명/),
    ).toBeInTheDocument()
  })

  it('결석 4회 이상 반복자는 긴급 위험군으로 잡힌다', () => {
    const b = board({
      attendance: { ...board({}).attendance!, todayAbsentees: [] },
      issues: [
        { studentUuid: 'u9', name: '문성준', lateCount: 1, absentCount: 5 },
      ],
    })
    renderInsight({
      boards: [b],
      quarantineCount: 0,
      today: '2026-07-06',
      upcoming: [],
    })
    expect(screen.getByText('긴급 위험군')).toBeInTheDocument()
    expect(screen.getByText(/문성준 수강생은 결석 5회/)).toBeInTheDocument()
  })

  it('이슈·미출석이 없으면 운영 안정 액션을 보여준다', () => {
    const b = board({
      attendance: {
        ...board({}).attendance!,
        todayPresent: 30,
        todayAbsentees: [],
      },
      issues: [],
      pending: { certificates: 0, troubleshooting: 0 },
    })
    renderInsight({
      boards: [b],
      quarantineCount: 0,
      today: '2026-07-06',
      upcoming: [],
    })
    expect(screen.getByText('오늘 운영 안정')).toBeInTheDocument()
  })

  it('처리 대기(승인+격리)를 합산해 액션으로 만든다', () => {
    const b = board({
      attendance: { ...board({}).attendance!, todayAbsentees: [] },
      issues: [],
    })
    renderInsight({
      boards: [b],
      quarantineCount: 4,
      today: '2026-07-06',
      upcoming: [],
    })
    // 액션 큐 + 지표 팝오버 제목 양쪽에 노출되므로 최소 1개 이상
    expect(screen.getAllByText('처리 대기').length).toBeGreaterThanOrEqual(1)
    // 승인 5(자격증3+트러블2) + 격리 4 = 9건
    expect(screen.getAllByText('9건').length).toBeGreaterThanOrEqual(1)
  })

  it('수료 기수의 과거 이력은 오늘 인사이트에서 제외한다', () => {
    const ended = board({
      status: 'ended',
      cohortLabel: '24기',
      attendance: {
        ...board({}).attendance!,
        todayTotal: null,
        todayPresent: null,
        todayAbsentees: [],
      },
      issues: [
        { studentUuid: 'd1', name: '문성준', lateCount: 0, absentCount: 117 },
      ],
      pending: { certificates: 0, troubleshooting: 0 },
    })
    renderInsight({
      boards: [ended],
      quarantineCount: 0,
      today: '2026-07-06',
      upcoming: [],
    })
    // 결석 117회가 긴급 위험군으로 노출되면 안 된다
    expect(screen.queryByText(/문성준/)).not.toBeInTheDocument()
    expect(screen.queryByText('긴급 위험군')).not.toBeInTheDocument()
    // 진행 기수 없음 안내
    expect(screen.getByText(/진행 중인 기수가 없습니다/)).toBeInTheDocument()
  })

  it('위클리 체크 상담 요청·컨디션 저조를 액션과 밴드에 노출한다', () => {
    const b = board({
      attendance: { ...board({}).attendance!, todayAbsentees: [] },
      issues: [],
      weeklyCheck: {
        respondents: 20,
        lowCondition: 3,
        counselRequests: 5,
        flagged: [{ studentUuid: 'w1', name: '고아라', reason: '상담 요청' }],
      },
    })
    renderInsight({
      boards: [b],
      quarantineCount: 0,
      today: '2026-07-06',
      upcoming: [],
    })
    expect(screen.getByText('상담 요청')).toBeInTheDocument()
    expect(screen.getByText('위클리 체크')).toBeInTheDocument()
    expect(screen.getByText('상담 5')).toBeInTheDocument()
    expect(screen.getByText('컨디션 3')).toBeInTheDocument()
  })

  it('다가오는 일정을 표시한다', () => {
    renderInsight({
      boards: [
        board({
          attendance: { ...board({}).attendance!, todayAbsentees: [] },
          issues: [],
        }),
      ],
      quarantineCount: 0,
      today: '2026-07-06',
      upcoming: [
        {
          cohortLabel: '35기',
          date: '2026-07-06',
          endDate: '',
          category: '성취도 평가',
          title: '1회차 성취도 평가',
          daysUntil: 0,
        },
      ],
    })
    expect(screen.getByText('다가오는 일정')).toBeInTheDocument()
    expect(screen.getByText('1회차 성취도 평가')).toBeInTheDocument()
    expect(screen.getByText('오늘')).toBeInTheDocument()
  })
})
