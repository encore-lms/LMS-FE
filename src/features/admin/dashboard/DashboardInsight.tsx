import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  Info,
  ListChecks,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Sparkline } from './Sparkline'
import { useCountUp } from './useCountUp'
import {
  buildActions,
  buildInsights,
  fmtMD,
  mergeTrend,
  type Tone,
} from './insightLogic'
import {
  FocusBand,
  MetricTile,
  UpcomingSchedule,
  type PopoverItem,
} from './insightParts'
import type { CohortBoard, ScheduleItem } from './types'

// 오늘 인사이트 히어로 — 이전 LMS DashboardHeroCard(디자인·기능)를 새 데이터(CohortBoard[])로 이식.
// 좌: 액션 큐 + 상황 요약 문장 / 우: 4개 지표 타일(hover 팝오버 · 출석률 스파크라인 추이).
// 다크 카드로 단일 커밋된 디자인(테마 무관, 원본과 동일한 룩).
// 일일 운영 지표(출결·위험군)는 진행 중 기수만, 처리 대기는 전체 기수에서 집계한다.

const ACTION_ICON_COLOR: Record<Tone, string> = {
  critical: 'text-danger-inverse',
  warning: 'text-warning-inverse',
  info: 'text-info-inverse',
  positive: 'text-success-inverse',
}
const INSIGHT_ICON: Record<Tone, { icon: LucideIcon; color: string }> = {
  critical: { icon: AlertOctagon, color: 'text-danger-inverse' },
  warning: { icon: TriangleAlert, color: 'text-warning-inverse' },
  info: { icon: Info, color: 'text-info-inverse' },
  positive: { icon: CheckCircle2, color: 'text-success-inverse' },
}

// 날짜 축 라벨 하나가 안 잘리려면 필요한 최소 폭(9px 폰트 "7.20" + 여백, px).
const DATE_LABEL_MIN_PX = 38

// total개 날짜 중 max개만 균등하게 고른다(항상 첫·마지막 포함). 좁은 타일에서 라벨이 잘리지 않게.
function pickDateIndices(total: number, max: number): Set<number> {
  if (max >= total) return new Set(Array.from({ length: total }, (_, i) => i))
  if (max <= 1 || total <= 1) return new Set([0, total - 1])
  const picked = new Set<number>([0, total - 1])
  for (let i = 1; i < max - 1; i++) {
    picked.add(Math.round((i * (total - 1)) / (max - 1)))
  }
  return picked
}

// 컨테이너 폭 측정 훅(ResizeObserver, 미지원 환경 방어).
function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(Math.floor(el.getBoundingClientRect().width))
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) setWidth(Math.floor(cr.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
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
  // 날짜 축 라벨 — 타일 폭에 맞춰 표시 개수를 자동 조절(좁으면 균등하게 골라 안 잘리게).
  const [dateAxisRef, dateAxisW] = useMeasuredWidth()
  const maxDateLabels =
    dateAxisW > 0
      ? Math.max(2, Math.floor(dateAxisW / DATE_LABEL_MIN_PX))
      : trend.dates.length
  const shownDateIdx = pickDateIndices(trend.dates.length, maxDateLabels)

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
          <span className="text-surface-inverse text-right font-bold">
            {rate}%
          </span>
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
          <span className="text-surface-inverse text-right font-bold">
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
          <span className="text-surface-inverse text-right font-bold">
            {n}건
          </span>
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
        <span className="text-surface-inverse font-bold tabular-nums">
          {quarantineCount}건
        </span>
      ),
    })

  return (
    <section className="bg-surface-inverse relative z-[1] flex flex-col gap-4 overflow-hidden rounded-3xl p-6 text-white">
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
            <ListChecks className="text-warning-inverse h-4 w-4" />
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
                  height={32}
                  stroke="var(--color-chart-positive)"
                  todayIndex={todayIdx}
                />
                <div
                  ref={dateAxisRef}
                  className="grid gap-0.5 overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${trend.dates.length}, minmax(0, 1fr))`,
                  }}
                >
                  {trend.dates.map((d, i) =>
                    shownDateIdx.has(i) ? (
                      // 각 라벨을 자기 포인트 컬럼에 배치. 표시 안 하는 이웃 칸이 비어 있어
                      // 라벨이 잘리지 않고 넘쳐도 겹치지 않는다(양 끝은 타일 경계에 정렬).
                      <span
                        key={d}
                        style={{ gridColumnStart: i + 1 }}
                        className={cn(
                          'text-[9px] whitespace-nowrap tabular-nums',
                          i === todayIdx
                            ? 'font-bold text-white'
                            : 'text-white/[0.42]',
                          i === 0
                            ? 'text-left'
                            : i === trend.dates.length - 1
                              ? 'text-right'
                              : 'text-center',
                        )}
                      >
                        {fmtMD(d)}
                      </span>
                    ) : null,
                  )}
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
                <span className="text-success-inverse">이상 출결 없음</span>
              ) : urgentCount > 0 ? (
                <span className="text-danger-inverse">
                  긴급 {urgentCount}명 포함
                </span>
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
                <span className="text-success-inverse">
                  모든 기수 출석 완료
                </span>
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
                <span className="text-success-inverse inline-flex items-center gap-1">
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
