import {
  AlertOctagon,
  Bell,
  CheckCircle2,
  ClockAlert,
  HeartPulse,
  Inbox,
  type LucideIcon,
} from 'lucide-react'
import type { CohortBoard, ScheduleItem } from './types'

export type Tone = 'critical' | 'warning' | 'info' | 'positive'

export interface Insight {
  tone: Tone
  text: string
}
export interface Action {
  tone: Tone
  icon: LucideIcon
  label: string
  value: string
  detail: string
  to?: string // 클릭 시 이동할 처리 화면(없으면 정적 표시)
}

/** 오늘 주목 포인트 문장 — 시급한 것부터 최대 3개. */
export function buildInsights(
  boards: CohortBoard[],
  upcoming: ScheduleItem[],
): Insight[] {
  const insights: Insight[] = []

  // 오늘~D-3 임박 일정.
  const imminent = upcoming.filter((s) => s.daysUntil <= 3)
  if (imminent.length > 0) {
    const s = imminent[0]
    insights.push({
      tone: 'info',
      text: `${s.cohortLabel} ${s.title}이(가) ${s.daysUntil === 0 ? '오늘' : `D-${s.daysUntil}`} 예정입니다.`,
    })
  }
  const active = boards.filter((b) => b.status === 'operating')
  const live = active.filter((b) => b.attendance?.todayTotal != null)
  const todayTotal = live.reduce(
    (s, b) => s + (b.attendance?.todayTotal ?? 0),
    0,
  )
  const todayPresent = live.reduce(
    (s, b) => s + (b.attendance?.todayPresent ?? 0),
    0,
  )
  const todayAbsent = live.reduce(
    (s, b) => s + (b.attendance?.todayAbsentees?.length ?? 0),
    0,
  )
  const attendanceRate =
    todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : null
  const issues = active
    .flatMap((b) => b.issues.map((i) => ({ ...i, cohortLabel: b.cohortLabel })))
    .sort((a, b) => b.absentCount - a.absentCount)

  if (active.length === 0) {
    insights.push({
      tone: 'info',
      text: '진행 중인 기수가 없습니다. 수료 기수 기록은 기수 상세에서 확인하세요.',
    })
  }
  if (issues.length > 0) {
    const top = issues[0]
    insights.push(
      top.absentCount >= 4
        ? {
            tone: 'critical',
            text: `${top.cohortLabel} ${top.name} 수강생은 결석 ${top.absentCount}회로 긴급 개입이 필요해 보입니다.`,
          }
        : {
            tone: 'warning',
            text: `지각·결석이 반복되는 수강생이 ${issues.length}명입니다. 선제적으로 확인해 주세요.`,
          },
    )
  } else if (active.length > 0) {
    insights.push({
      tone: 'positive',
      text: '지각·결석이 반복되는 수강생이 없습니다.',
    })
  }
  if (todayTotal > 0) {
    insights.push(
      todayAbsent > 0
        ? {
            tone: 'warning',
            text: `오늘 입실하지 않은 수강생 ${todayAbsent}명에게 공지를 보내주세요.`,
          }
        : {
            tone: 'positive',
            text: `진행 중인 기수 ${live.length}개 모두 오늘 출석을 완료했습니다.`,
          },
    )
  }
  if (attendanceRate != null) {
    if (attendanceRate === 100)
      insights.push({
        tone: 'positive',
        text: '오늘 전체 출석률이 100%로 매우 양호합니다.',
      })
    else if (attendanceRate >= 95)
      insights.push({
        tone: 'info',
        text: `오늘 전체 출석률은 ${attendanceRate}%로 안정적인 수준입니다.`,
      })
    else if (attendanceRate >= 85)
      insights.push({
        tone: 'warning',
        text: `오늘 출석률이 ${attendanceRate}%로 다소 낮습니다.`,
      })
    else
      insights.push({
        tone: 'critical',
        text: `오늘 출석률이 ${attendanceRate}%로 평소 대비 많이 낮습니다. 원인 확인이 필요해 보입니다.`,
      })
  }

  // 성취도 신호 — 진행 중 기수의 최신 회차 하락·저조·미응시.
  for (const b of active) {
    const a = b.assessment
    if (!a || a.latestRound == null) continue
    if (a.delta != null && a.delta <= -5) {
      insights.push({
        tone: 'warning',
        text: `${b.cohortLabel} 성취도 ${a.latestRound}회차 평균이 직전 대비 ${Math.abs(a.delta)}점 하락했습니다.`,
      })
    }
    if (a.nonTakers > 0) {
      insights.push({
        tone: 'info',
        text: `${b.cohortLabel} 성취도 ${a.latestRound}회차 미응시자가 ${a.nonTakers}명입니다.`,
      })
    }
  }

  // 위클리 체크 조기경보 — 진행 중 기수의 컨디션 저조·상담 요청.
  for (const b of active) {
    const w = b.weeklyCheck
    if (!w) continue
    if (w.counselRequests > 0) {
      insights.push({
        tone: 'warning',
        text: `${b.cohortLabel} 위클리 체크에서 상담을 요청한 수강생이 ${w.counselRequests}명입니다.`,
      })
    }
    if (w.lowCondition > 0) {
      insights.push({
        tone: 'warning',
        text: `${b.cohortLabel}에서 컨디션 저조(1~2점)를 보고한 수강생이 ${w.lowCondition}명입니다.`,
      })
    }
  }

  // 수료 임박 기수 — D-7 이내.
  const soon = boards
    .filter(
      (b) => b.status === 'operating' && b.daysLeft >= 0 && b.daysLeft <= 7,
    )
    .sort((a, b) => a.daysLeft - b.daysLeft)
  if (soon.length > 0) {
    const b = soon[0]
    insights.push({
      tone: 'info',
      text: `${b.cohortLabel}가 ${b.daysLeft === 0 ? '오늘' : `D-${b.daysLeft}`} 수료 예정입니다. 자격증 승인·취업지원을 점검하세요.`,
    })
  }

  return insights.slice(0, 4)
}

/** 지금 할 일 — 시급한 것부터 최대 3개. */
export function buildActions(
  boards: CohortBoard[],
  quarantineCount: number,
): Action[] {
  const actions: Action[] = []
  const active = boards.filter((b) => b.status === 'operating')
  const absentByCohort = active
    .map((b) => ({
      label: b.cohortLabel,
      n: b.attendance?.todayAbsentees?.length ?? 0,
    }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)
  const totalAbsent = absentByCohort.reduce((s, c) => s + c.n, 0)
  const issues = active.flatMap((b) =>
    b.issues.map((i) => ({ ...i, cohortLabel: b.cohortLabel })),
  )
  const urgent = issues.filter((i) => i.absentCount >= 4)
  const pending = boards.reduce(
    (s, b) =>
      s + (b.pending ? b.pending.certificates + b.pending.troubleshooting : 0),
    0,
  )

  if (totalAbsent > 0)
    actions.push({
      tone: 'critical',
      icon: Bell,
      label: '미출석 공지',
      value: `${totalAbsent}명`,
      detail: `${absentByCohort[0].label} ${absentByCohort[0].n}명부터 확인`,
      to: '/admin/students',
    })
  if (urgent.length > 0)
    actions.push({
      tone: 'critical',
      icon: AlertOctagon,
      label: '긴급 위험군',
      value: `${urgent.length}명`,
      detail: `${urgent[0].cohortLabel} ${urgent[0].name} 우선 상담`,
      to: '/admin/students',
    })
  else if (issues.length > 0)
    actions.push({
      tone: 'warning',
      icon: ClockAlert,
      label: '반복 이상 출결',
      value: `${issues.length}명`,
      detail: '지각·결석 패턴 확인',
      to: '/admin/students',
    })
  // 위클리 체크 상담 요청 — 진행 중 기수.
  const counselByCohort = active
    .map((b) => ({
      label: b.cohortLabel,
      n: b.weeklyCheck?.counselRequests ?? 0,
      flag: b.weeklyCheck?.flagged ?? [],
    }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)
  const totalCounsel = counselByCohort.reduce((s, c) => s + c.n, 0)
  if (totalCounsel > 0) {
    const top = counselByCohort[0]
    const firstName = top.flag.find((f) => f.reason.includes('상담'))?.name
    actions.push({
      tone: 'warning',
      icon: HeartPulse,
      label: '상담 요청',
      value: `${totalCounsel}명`,
      detail: firstName
        ? `${top.label} ${firstName} 등 확인`
        : `${top.label} ${top.n}명`,
      to: '/admin/students',
    })
  }

  if (pending + quarantineCount > 0)
    actions.push({
      tone: 'info',
      icon: Inbox,
      label: '처리 대기',
      value: `${pending + quarantineCount}건`,
      detail:
        quarantineCount > 0
          ? `승인 ${pending} · 인입 격리 ${quarantineCount}`
          : '자격증·트러블슈팅 승인 필요',
      to:
        quarantineCount > 0 && pending === 0
          ? '/admin/ingestion/quarantine'
          : '/admin/certificates/reviews',
    })
  if (actions.length === 0)
    actions.push({
      tone: 'positive',
      icon: CheckCircle2,
      label: '오늘 운영 안정',
      value: '0건',
      detail: '즉시 확인할 출결·승인 이슈가 없습니다',
    })
  return actions.slice(0, 3)
}

/** 진행 중 기수들의 주간 출석률을 일자별 평균으로 병합해 최근 7일 추이를 만든다. */
export function mergeTrend(active: CohortBoard[]): {
  points: number[]
  dates: string[]
} {
  const byDate = new Map<string, number[]>()
  for (const b of active)
    for (const w of b.attendance?.weekly ?? []) {
      if (!byDate.has(w.date)) byDate.set(w.date, [])
      byDate.get(w.date)!.push(w.rate)
    }
  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const last = sorted.slice(-7)
  return {
    points: last.map(
      ([, rates]) =>
        Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 10) / 10,
    ),
    dates: last.map(([d]) => d),
  }
}

export const fmtMD = (d: string) =>
  d.length >= 10 ? `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}` : d

const SCHEDULE_TONE: Record<string, string> = {
  '성취도 평가': 'bg-info-inverse/15 text-info-inverse',
  '단위 프로젝트': 'bg-accent-inverse/15 text-accent-inverse',
  발표회: 'bg-warning-inverse/15 text-warning-inverse',
  '최종 프로젝트': 'bg-success-inverse/15 text-success-inverse',
}
export function scheduleTone(cat: string) {
  return SCHEDULE_TONE[cat] ?? 'bg-white/[0.07] text-white/70'
}

/** 출석률에 따른 게이지 색 — 이전 LMS 신호등 규칙(초록/노랑/빨강). */
export function gaugeColor(rate: number) {
  if (rate >= 90) return 'var(--color-chart-positive)'
  if (rate >= 80) return 'var(--color-chart-caution)'
  return 'var(--color-chart-negative)'
}
