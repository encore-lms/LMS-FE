import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertOctagon,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClockAlert,
  HeartPulse,
  Inbox,
  Info,
  ListChecks,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Sparkline } from './Sparkline'
import { useCountUp } from './useCountUp'
import type { CohortBoard, ScheduleItem } from './types'

// 오늘 인사이트 히어로 — 이전 LMS DashboardHeroCard(디자인·기능)를 새 데이터(CohortBoard[])로 이식.
// 좌: 액션 큐 + 상황 요약 문장 / 우: 4개 지표 타일(hover 팝오버 · 출석률 스파크라인 추이).
// 다크 카드로 단일 커밋된 디자인(테마 무관, 원본과 동일한 룩).
// 일일 운영 지표(출결·위험군)는 진행 중 기수만, 처리 대기는 전체 기수에서 집계한다.

type Tone = 'critical' | 'warning' | 'info' | 'positive'

const ACTION_ICON_COLOR: Record<Tone, string> = {
  critical: 'text-[#FF8787]',
  warning: 'text-[#FFD43B]',
  info: 'text-[#74C0FC]',
  positive: 'text-[#69DB7C]',
}
const INSIGHT_ICON: Record<Tone, { icon: LucideIcon; color: string }> = {
  critical: { icon: AlertOctagon, color: 'text-[#FF6B6B]' },
  warning: { icon: TriangleAlert, color: 'text-[#FFD43B]' },
  info: { icon: Info, color: 'text-[#4DABF7]' },
  positive: { icon: CheckCircle2, color: 'text-[#51CF66]' },
}

interface Insight {
  tone: Tone
  text: string
}
interface Action {
  tone: Tone
  icon: LucideIcon
  label: string
  value: string
  detail: string
  to?: string // 클릭 시 이동할 처리 화면(없으면 정적 표시)
}
interface PopoverItem {
  key: string
  label: string
  value: ReactNode
  /** 값이 길어 라벨 우측에 못 들어가는 경우(미출석 명단 등) 라벨 아래 전체 폭으로 줄바꿈. */
  stacked?: boolean
}

/** 오늘 주목 포인트 문장 — 시급한 것부터 최대 3개. */
function buildInsights(
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
function buildActions(
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
function mergeTrend(active: CohortBoard[]): {
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

const fmtMD = (d: string) =>
  d.length >= 10 ? `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}` : d

/** 지표 타일 — hover/focus 시 기수별 상세 팝오버 노출. sub는 숫자 아래 한 줄 맥락. */
function MetricTile({
  label,
  value,
  suffix,
  sub,
  popoverTitle,
  items,
  emptyText,
  alignRight,
  children,
}: {
  label: string
  value: number
  suffix: string
  sub?: ReactNode
  popoverTitle: string
  items: PopoverItem[]
  emptyText: string
  alignRight?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className="group relative z-0 flex min-h-[6.25rem] min-w-0 flex-col gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-[0.8rem] transition-all outline-none hover:z-30 hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.075] focus-visible:z-30 focus-visible:border-white/20 focus-visible:bg-white/[0.075]"
      tabIndex={0}
    >
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide whitespace-nowrap text-white/55">
        {label}
        <Info className="h-3 w-3 text-white/35 transition-colors group-hover:text-white/75 group-focus-visible:text-white/75" />
      </span>
      <span className="inline-flex items-baseline gap-0.5 text-[1.5rem] leading-none font-extrabold tracking-tight text-white">
        {value}
        <span className="text-[0.8rem] font-semibold text-white/55">
          {suffix}
        </span>
      </span>
      {sub && (
        <span className="text-[11px] leading-tight break-keep text-white/50">
          {sub}
        </span>
      )}
      {children}

      {/* hover 팝오버 — 기수별 상세 */}
      <div
        role="tooltip"
        className={cn(
          'invisible absolute top-[calc(100%+0.625rem)] z-[10002] w-max max-w-[26rem] min-w-[17rem] scale-[0.98] rounded-[14px] bg-white p-4 text-[#181A20] opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:scale-100 group-focus-visible:opacity-100',
          alignRight ? 'right-0' : 'left-0',
        )}
      >
        <span className="mb-2.5 block border-b border-black/[0.08] pb-2.5 text-[11px] font-bold tracking-wider text-black/55 uppercase">
          {popoverTitle}
        </span>
        {items.length === 0 ? (
          <span className="text-[13px] text-black/55">{emptyText}</span>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {items.map((it) =>
              it.stacked ? (
                // 긴 값(미출석 명단) — 라벨 위, 값은 아래 전체 폭으로 줄바꿈.
                <li
                  key={it.key}
                  className="flex flex-col gap-1 text-[13px] leading-snug"
                >
                  <span className="font-semibold break-keep text-black/[0.78]">
                    {it.label}
                  </span>
                  <span className="text-left [overflow-wrap:anywhere] break-keep text-black/[0.65]">
                    {it.value}
                  </span>
                </li>
              ) : (
                <li
                  key={it.key}
                  className="flex items-center justify-between gap-4 text-[13px] leading-tight"
                >
                  <span className="min-w-0 flex-1 font-semibold break-keep text-black/[0.78]">
                    {it.label}
                  </span>
                  <span className="shrink-0 text-right font-bold text-[#181A20] tabular-nums">
                    {it.value}
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

const SCHEDULE_TONE: Record<string, string> = {
  '성취도 평가': 'bg-[#74C0FC]/15 text-[#74C0FC]',
  '단위 프로젝트': 'bg-[#B197FC]/15 text-[#B197FC]',
  발표회: 'bg-[#FFD43B]/15 text-[#FFD43B]',
  '최종 프로젝트': 'bg-[#69DB7C]/15 text-[#69DB7C]',
}
function scheduleTone(cat: string) {
  return SCHEDULE_TONE[cat] ?? 'bg-white/[0.07] text-white/70'
}

/** 출석률에 따른 게이지 색 — 이전 LMS 신호등 규칙(초록/노랑/빨강). */
function gaugeColor(rate: number) {
  if (rate >= 90) return '#40C057'
  if (rate >= 80) return '#FAB005'
  return '#FF6B6B'
}

/** 하단 초점 밴드 — 기수별 출석률 게이지 · 성취도 · 위클리 · 수료 임박. */
function FocusBand({ boards }: { boards: CohortBoard[] }) {
  const active = boards.filter((b) => b.status === 'operating')
  // 기수별 출석률 게이지 — 데이터 있는 기수(평균 출석률) 도형화.
  const gaugeCards = boards
    .filter((b) => b.attendance?.avgRate != null)
    .map((b) => ({ label: b.cohortLabel, rate: b.attendance!.avgRate! }))
  const assessmentCards = active
    .filter((b) => b.assessment?.latestRound != null)
    .map((b) => ({ label: b.cohortLabel, a: b.assessment! }))
  // 위클리 체크는 데이터 있는 기수(수료 포함) 스냅샷으로 표시 — 최근 정서 신호는 이력도 유용.
  const weeklyCards = boards
    .filter((b) => b.weeklyCheck != null && b.weeklyCheck.respondents > 0)
    .map((b) => ({ label: b.cohortLabel, w: b.weeklyCheck! }))
  const ending = boards
    .filter((b) => b.status === 'operating')
    .sort((a, b) => a.daysLeft - b.daysLeft)

  if (
    gaugeCards.length === 0 &&
    assessmentCards.length === 0 &&
    weeklyCards.length === 0 &&
    ending.length === 0
  )
    return null

  return (
    <div className="relative z-[1] grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* 기수별 출석률 게이지 — 도형 시각화 */}
      {gaugeCards.length > 0 && (
        <div className="rounded-2xl bg-white/[0.05] p-4">
          <p className="text-[11px] font-semibold tracking-wide text-white/55">
            기수별 출석률
          </p>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {gaugeCards.map(({ label, rate }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="w-10 shrink-0 text-[12px] font-bold text-white">
                  {label}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, rate)}%`,
                      background: gaugeColor(rate),
                    }}
                  />
                </span>
                <span
                  className="w-11 shrink-0 text-right text-[12px] font-extrabold tabular-nums"
                  style={{ color: gaugeColor(rate) }}
                >
                  {rate}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 성취도 스냅샷 */}
      {assessmentCards.length > 0 && (
        <div className="rounded-2xl bg-white/[0.05] p-4">
          <p className="text-[11px] font-semibold tracking-wide text-white/55">
            최근 성취도
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {assessmentCards.map(({ label, a }) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-[13px] font-bold text-white">
                  {label}{' '}
                  <span className="font-normal text-white/50">
                    {a.latestRound}회차
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[13px] tabular-nums">
                  <span className="font-extrabold text-white">
                    {a.latestAvg}점
                  </span>
                  {a.delta != null && a.delta !== 0 && (
                    <span
                      className={cn(
                        'text-[11px] font-bold',
                        a.delta > 0 ? 'text-[#69DB7C]' : 'text-[#FF8787]',
                      )}
                    >
                      {a.delta > 0 ? '▲' : '▼'}
                      {Math.abs(a.delta)}
                    </span>
                  )}
                  {(a.lowPerformers > 0 || a.nonTakers > 0) && (
                    <span className="text-[11px] text-white/50">
                      {a.lowPerformers > 0 && `저조 ${a.lowPerformers}`}
                      {a.lowPerformers > 0 && a.nonTakers > 0 && ' · '}
                      {a.nonTakers > 0 && `미응시 ${a.nonTakers}`}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 위클리 체크 조기경보 */}
      {weeklyCards.length > 0 && (
        <div className="rounded-2xl bg-white/[0.05] p-4">
          <p className="text-[11px] font-semibold tracking-wide text-white/55">
            위클리 체크
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {weeklyCards.map(({ label, w }) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-[13px] font-bold text-white">
                  {label}{' '}
                  <span className="font-normal text-white/50">
                    응답 {w.respondents}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[12px] tabular-nums">
                  {w.counselRequests > 0 && (
                    <span className="rounded-md bg-[#FFD43B]/15 px-1.5 py-0.5 text-[11px] font-bold text-[#FFD43B]">
                      상담 {w.counselRequests}
                    </span>
                  )}
                  {w.lowCondition > 0 && (
                    <span className="rounded-md bg-[#FF8787]/15 px-1.5 py-0.5 text-[11px] font-bold text-[#FF8787]">
                      컨디션 {w.lowCondition}
                    </span>
                  )}
                  {w.counselRequests === 0 && w.lowCondition === 0 && (
                    <span className="text-[11px] text-[#69DB7C]">양호</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 수료 임박 */}
      {ending.length > 0 && (
        <div className="rounded-2xl bg-white/[0.05] p-4">
          <p className="text-[11px] font-semibold tracking-wide text-white/55">
            수료 일정
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ending.map((b) => {
              const soon = b.daysLeft >= 0 && b.daysLeft <= 14
              return (
                <li
                  key={b.cohortId}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold',
                    soon
                      ? 'bg-[#FFD43B]/15 text-[#FFD43B]'
                      : 'bg-white/[0.07] text-white/80',
                  )}
                >
                  <span>{b.cohortLabel}</span>
                  <span className="tabular-nums">
                    {b.daysLeft < 0
                      ? '수료'
                      : b.daysLeft === 0
                        ? '오늘 수료'
                        : `D-${b.daysLeft}`}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/** 다가오는 일정/마일스톤 행 — 오늘 이후 가까운 순. */
function UpcomingSchedule({ upcoming }: { upcoming: ScheduleItem[] }) {
  if (upcoming.length === 0) return null
  return (
    <div className="relative z-[1] border-t border-white/10 pt-5">
      <p className="text-[11px] font-semibold tracking-wide text-white/55">
        다가오는 일정
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {upcoming.map((s, i) => (
          <li
            key={`${s.date}-${i}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] py-1.5 pr-3 pl-2"
          >
            <span
              className={cn(
                'rounded-lg px-2 py-1 text-[11px] font-bold tabular-nums',
                scheduleTone(s.category),
              )}
            >
              {s.daysUntil === 0 ? '오늘' : `D-${s.daysUntil}`}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[12.5px] font-semibold text-white">
                {s.title}
              </span>
              <span className="text-[10.5px] text-white/45">
                {s.cohortLabel} · {s.category}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardInsight({
  boards,
  quarantineCount,
  today,
  upcoming,
}: {
  boards: CohortBoard[]
  quarantineCount: number
  today: string
  upcoming: ScheduleItem[]
}) {
  const insights = buildInsights(boards, upcoming)
  const actions = buildActions(boards, quarantineCount)

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
  const attendanceRate =
    todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0
  const riskCount = active.reduce((s, b) => s + (b.issues?.length ?? 0), 0)
  // 타일 서브 맥락 — 위험군 중 긴급(결석 4회↑) 인원, 미출석이 발생한 기수 수.
  const urgentCount = active.reduce(
    (s, b) => s + b.issues.filter((i) => i.absentCount >= 4).length,
    0,
  )
  const absentCohortCount = live.filter(
    (b) => (b.attendance?.todayAbsentees?.length ?? 0) > 0,
  ).length
  const absentCount = live.reduce(
    (s, b) => s + (b.attendance?.todayAbsentees?.length ?? 0),
    0,
  )
  const pendingCount =
    boards.reduce(
      (s, b) =>
        s +
        (b.pending ? b.pending.certificates + b.pending.troubleshooting : 0),
      0,
    ) + quarantineCount

  const rateAnim = useCountUp(attendanceRate)
  const riskAnim = useCountUp(riskCount)
  const absentAnim = useCountUp(absentCount)
  const pendingAnim = useCountUp(pendingCount)

  const trend = mergeTrend(active)
  const todayIdx = trend.dates.indexOf(today)

  // 팝오버 항목 — 기수별 분해.
  const attendanceItems: PopoverItem[] = live.map((b) => {
    const p = b.attendance!.todayPresent ?? 0
    const t = b.attendance!.todayTotal ?? 0
    const rate = t > 0 ? Math.round((p / t) * 100) : 0
    return {
      key: b.cohortId,
      label: b.cohortLabel,
      value: (
        <span className="inline-grid grid-cols-[4rem_3rem] items-baseline gap-2.5 tabular-nums">
          <span className="text-right font-semibold text-black/65">
            {p}/{t}
          </span>
          <span className="text-right font-bold text-[#181A20]">{rate}%</span>
        </span>
      ),
    }
  })
  const riskItems: PopoverItem[] = active
    .filter((b) => b.issues.length > 0)
    .map((b) => ({
      key: b.cohortId,
      label: b.cohortLabel,
      value: (
        <span className="inline-grid grid-cols-[2rem_1rem] items-baseline gap-0.5 tabular-nums">
          <span className="text-right font-bold text-[#181A20]">
            {b.issues.length}
          </span>
          <span className="text-left font-semibold text-black/60">명</span>
        </span>
      ),
    }))
  const absentItems: PopoverItem[] = live
    .filter((b) => (b.attendance?.todayAbsentees?.length ?? 0) > 0)
    .map((b) => ({
      key: b.cohortId,
      label: `${b.cohortLabel} (${b.attendance!.todayAbsentees.length}명)`,
      stacked: true,
      value: b.attendance!.todayAbsentees.map((a) => a.name).join(', '),
    }))
  const pendingItems: PopoverItem[] = boards
    .map((b) => {
      const n = b.pending
        ? b.pending.certificates + b.pending.troubleshooting
        : 0
      return { b, n }
    })
    .filter((x) => x.n > 0)
    .map(({ b, n }) => ({
      key: b.cohortId,
      label: b.cohortLabel,
      value: (
        <span className="inline-grid grid-cols-[2.5rem_4.25rem_4rem] items-baseline gap-1.5 tabular-nums">
          <span className="text-right font-bold text-[#181A20]">{n}건</span>
          <span className="text-right font-semibold text-black/65">
            자격증 {b.pending?.certificates ?? 0}
          </span>
          <span className="text-right font-semibold text-black/65">
            트러블 {b.pending?.troubleshooting ?? 0}
          </span>
        </span>
      ),
    }))
  if (quarantineCount > 0)
    pendingItems.push({
      key: '__quarantine',
      label: '인입 격리 큐',
      value: (
        <span className="font-bold text-[#181A20] tabular-nums">
          {quarantineCount}건
        </span>
      ),
    })

  return (
    <section className="relative z-[1] flex flex-col gap-4 overflow-hidden rounded-3xl bg-[#181A20] p-6 text-white">
      {/* 우상단 은은한 그린 글로우 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(64,192,87,0.08) 0%, transparent 50%)',
        }}
      />

      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* 좌: 라벨 + 액션 큐 + 인사이트 문장 */}
        <div className="relative z-[1] flex min-w-0 flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-wide text-white/[0.78]">
            <ListChecks className="h-4 w-4 text-[#FAB005]" />
            오늘 인사이트
          </span>

          <ul className="grid gap-2">
            {actions.map((a) => {
              const Icon = a.icon
              const inner = (
                <>
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10',
                      ACTION_ICON_COLOR[a.tone],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <strong className="text-[13px] tracking-tight text-white">
                      {a.label}
                    </strong>
                    <small className="truncate text-[11px] text-white/[0.62]">
                      {a.detail}
                    </small>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[1.05rem] font-extrabold whitespace-nowrap text-white tabular-nums">
                    {a.value}
                    {a.to && (
                      <ChevronRight className="h-4 w-4 text-white/35 transition-all group-hover/act:translate-x-0.5 group-hover/act:text-white/80" />
                    )}
                  </span>
                </>
              )
              const cls =
                'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-white/[0.07] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              return (
                <li key={a.label}>
                  {a.to ? (
                    // 행동 큐는 처리 화면으로 바로 이동(클릭 유도 — chevron·호버 강조)
                    <Link
                      to={a.to}
                      className={cn(
                        cls,
                        'group/act transition-colors hover:bg-white/[0.12]',
                      )}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>

          <ul className="flex flex-col gap-2">
            {insights.slice(0, 3).map((it, i) => {
              const { icon: Icon, color } = INSIGHT_ICON[it.tone]
              return (
                <li
                  key={i}
                  className="grid grid-cols-[1.125rem_1fr] items-start gap-2.5 text-[13px] leading-[1.5] tracking-tight text-white/[0.88]"
                >
                  <Icon className={cn('mt-0.5 h-3.5 w-3.5', color)} />
                  <span>{it.text}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* 우: 4개 지표 타일 (2x2) */}
        <div className="relative z-[1] grid grid-cols-2 items-stretch gap-2.5 rounded-[18px] bg-white/5 p-3.5">
          <MetricTile
            label="오늘 출석률"
            value={rateAnim}
            suffix="%"
            popoverTitle="기수별 출석률"
            items={attendanceItems}
            emptyText="오늘 진행 중인 수업이 없습니다."
          >
            {trend.points.length >= 2 && (
              <div className="mt-1 flex flex-col gap-1">
                <Sparkline
                  points={trend.points}
                  width={168}
                  height={32}
                  stroke="#40C057"
                  todayIndex={todayIdx}
                />
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${trend.dates.length}, 1fr)`,
                  }}
                >
                  {trend.dates.map((d, i) => (
                    <span
                      key={d}
                      className={cn(
                        'text-center text-[10px] whitespace-nowrap tabular-nums',
                        i === todayIdx
                          ? 'font-bold text-white'
                          : 'text-white/[0.42]',
                        i === 0 && 'text-left',
                        i === trend.dates.length - 1 && 'text-right',
                      )}
                    >
                      {fmtMD(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </MetricTile>

          <MetricTile
            label="위험군"
            value={riskAnim}
            suffix="명"
            sub={
              riskCount === 0 ? (
                <span className="text-[#69DB7C]">이상 출결 없음</span>
              ) : urgentCount > 0 ? (
                <span className="text-[#FF8787]">긴급 {urgentCount}명 포함</span>
              ) : (
                '반복 지각·결석 인원'
              )
            }
            popoverTitle="기수별 반복 이상 출결"
            items={riskItems}
            emptyText="진행 중 기수 위험군이 없습니다."
            alignRight
          />
          <MetricTile
            label="오늘 미출석"
            value={absentAnim}
            suffix="명"
            sub={
              absentCount === 0 ? (
                <span className="text-[#69DB7C]">모든 기수 출석 완료</span>
              ) : (
                `${absentCohortCount}개 기수에서 발생`
              )
            }
            popoverTitle="기수별 미출석 수강생"
            items={absentItems}
            emptyText="모든 기수 출석 완료"
          />
          <MetricTile
            label="처리 대기"
            value={pendingAnim}
            suffix="건"
            sub={
              pendingCount === 0 ? (
                <span className="inline-flex items-center gap-1 text-[#69DB7C]">
                  <CheckCircle2 className="h-3 w-3" />
                  모두 처리했어요
                </span>
              ) : quarantineCount > 0 ? (
                `승인 ${pendingCount - quarantineCount} · 격리 ${quarantineCount}`
              ) : (
                '자격증·트러블슈팅 승인'
              )
            }
            popoverTitle="기수별 처리 대기"
            items={pendingItems}
            emptyText="처리 대기 업무가 없습니다."
            alignRight
          />
        </div>
      </div>

      {/* 하단 초점 밴드 — 성취도 · 위클리 · 수료 임박 */}
      <FocusBand boards={boards} />

      {/* 다가오는 일정/마일스톤 */}
      <UpcomingSchedule upcoming={upcoming} />
    </section>
  )
}
