import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { gaugeColor, scheduleTone } from './insightLogic'
import type { CohortBoard, ScheduleItem } from './types'

export interface PopoverItem {
  key: string
  label: string
  value: ReactNode
  /** 값이 길어 라벨 우측에 못 들어가는 경우(미출석 명단 등) 라벨 아래 전체 폭으로 줄바꿈. */
  stacked?: boolean
}

/** 지표 타일 — hover/focus 시 기수별 상세 팝오버 노출. sub는 숫자 아래 한 줄 맥락. */
export function MetricTile({
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
          'text-surface-inverse invisible absolute top-[calc(100%+0.625rem)] z-[10002] w-max max-w-[26rem] min-w-[17rem] scale-[0.98] rounded-[14px] bg-white p-4 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:scale-100 group-focus-visible:opacity-100',
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
                  <span className="text-surface-inverse shrink-0 text-right font-bold tabular-nums">
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

/** 하단 초점 밴드 — 기수별 출석률 게이지 · 성취도 · 위클리 · 수료 임박. */
export function FocusBand({ boards }: { boards: CohortBoard[] }) {
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
                        a.delta > 0
                          ? 'text-success-inverse'
                          : 'text-danger-inverse',
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
                    <span className="bg-warning-inverse/15 text-warning-inverse rounded-md px-1.5 py-0.5 text-[11px] font-bold">
                      상담 {w.counselRequests}
                    </span>
                  )}
                  {w.lowCondition > 0 && (
                    <span className="bg-danger-inverse/15 text-danger-inverse rounded-md px-1.5 py-0.5 text-[11px] font-bold">
                      컨디션 {w.lowCondition}
                    </span>
                  )}
                  {w.counselRequests === 0 && w.lowCondition === 0 && (
                    <span className="text-success-inverse text-[11px]">
                      양호
                    </span>
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
                      ? 'bg-warning-inverse/15 text-warning-inverse'
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
export function UpcomingSchedule({ upcoming }: { upcoming: ScheduleItem[] }) {
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
