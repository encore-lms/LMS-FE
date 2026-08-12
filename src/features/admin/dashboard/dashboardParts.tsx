import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, XCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import {
  Skeleton,
  SkeletonKpiRow,
  SkeletonTable,
} from '@/components/ui/Skeleton'
import { ISSUE_PAGE_SIZE, RISK_META, riskTier } from './dashboardConstants'

/* ─────────────── 소형 빌딩 블록 ─────────────── */

// p-8 여백은 DataBoundary className에서 부여 — 여기서 중복 패딩을 만들지 않는다.
export function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      {/* 상단 — 날짜 + 기수 스위처 자리 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-56 rounded-lg" />
      </div>
      {/* KPI 합산 */}
      <SkeletonKpiRow className="mt-5" />
      {/* 기수 비교 표 */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <SkeletonTable rows={3} columns={7} />
      </div>
      {/* 관리 필요 수강생 패널 */}
      <div className="mt-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-surface rounded-xl border p-5"
            >
              <Skeleton className="mb-3 h-4 w-20" />
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 지표를 못 채운 기수 — CSV 인입을 걷어낸 뒤로 HRD 집계가 아직 없다는 뜻이다. */
export function NoData() {
  return <span className="text-fg-subtle text-[12px]">집계 없음</span>
}

export function Panel({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border bg-surface rounded-xl border">
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-fg-muted text-[12.5px] font-bold">{title}</p>
        {sub && <p className="text-fg-subtle text-[11px]">{sub}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function PanelEmpty({ text }: { text: string }) {
  return <p className="text-fg-subtle py-6 text-center text-[13px]">{text}</p>
}

export function BarRow({
  items,
  max,
  min,
  unit,
  narrow,
}: {
  items: { label: string; value: number }[]
  max: number
  min: number
  unit: string
  narrow?: boolean
}) {
  const last = items.length - 1
  return (
    <div className="flex items-end gap-2" style={{ height: 110 }}>
      {items.map((item, i) => {
        const h = Math.max(
          4,
          Math.round(((item.value - min) / (max - min)) * 78),
        )
        return (
          <div
            key={item.label}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1',
              narrow ? 'w-16' : 'flex-1',
            )}
            title={`${item.label} ${item.value}${unit}`}
          >
            <span className="text-fg-muted text-[11px] font-semibold tabular-nums">
              {item.value}
            </span>
            <div
              className={cn(
                'w-full max-w-9 rounded-t',
                i === last ? 'bg-brand' : 'bg-brand/35',
              )}
              style={{ height: h }}
            />
            <span className="text-fg-subtle text-[10.5px] whitespace-nowrap">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// 관리 필요 수강생 한 행 — 연속 지각·결석 감지 디자인.
// 좌: 아바타(이름 뒤 2글자)·이름·등급 칩(관찰/주의/긴급) / 우: 최근 5영업일 도트 + 지각·결석 칩.
const MARK_DOT: Record<string, string> = {
  late: 'bg-warning',
  absent: 'bg-danger',
  ok: 'border-border border bg-transparent',
  none: 'bg-surface-muted',
}

function RiskStudentRow({
  name,
  lateCount,
  absentCount,
  marks,
  onClick,
}: {
  name: string
  lateCount: number
  absentCount: number
  marks?: string[]
  onClick?: () => void
}) {
  const tier = riskTier(lateCount, absentCount)
  const meta = RISK_META[tier]
  // 도트는 항상 5칸 — marks 없으면(구 BE) 기록없음 표시로 채운다.
  const dots =
    marks && marks.length > 0
      ? marks.slice(0, 5)
      : Array.from({ length: 5 }, () => 'none')

  const inner = (
    <>
      <span className="bg-info-bg text-info flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold">
        {name.slice(-2)}
      </span>
      <span className="text-fg shrink-0 truncate text-[14px] font-bold">
        {name}
      </span>
      {meta.badge && (
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold',
            meta.badgeCls,
          )}
        >
          {meta.badge}
        </span>
      )}
      <span className="min-w-0 flex-1" />
      <span className="flex shrink-0 items-center gap-1.5">
        {dots.map((m, i) => (
          <span
            key={i}
            className={cn('size-4 rounded-full', MARK_DOT[m] ?? MARK_DOT.none)}
          />
        ))}
      </span>
      <span className="bg-warning-bg text-warning flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-bold tabular-nums">
        <Clock3 className="size-3.5" />
        {lateCount}
      </span>
      <span className="bg-danger-bg text-danger flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-bold tabular-nums">
        <XCircle className="size-3.5" />
        {absentCount}
      </span>
    </>
  )

  const cls =
    'bg-surface-muted/50 flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left'
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(cls, 'hover:bg-surface-muted transition-colors')}
    >
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

// 위험도 목록 — 결석 많은 순 정렬 + 한 번에 5명 페이지네이션(딥다이브용).
export function RiskList({
  issues,
  onStudentClick,
}: {
  issues: {
    studentUuid: string
    name: string
    lateCount: number
    absentCount: number
    marks?: string[]
  }[]
  onStudentClick?: (name: string) => void
}) {
  const [page, setPage] = useState(0)
  const sorted = useMemo(
    () =>
      [...issues].sort(
        (a, b) => b.absentCount - a.absentCount || b.lateCount - a.lateCount,
      ),
    [issues],
  )
  const pageCount = Math.ceil(sorted.length / ISSUE_PAGE_SIZE)
  const safePage = Math.min(page, Math.max(0, pageCount - 1))
  const start = safePage * ISSUE_PAGE_SIZE
  const visible = sorted.slice(start, start + ISSUE_PAGE_SIZE)

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2.5">
        {visible.map((i) => (
          <RiskStudentRow
            key={i.studentUuid}
            name={i.name}
            lateCount={i.lateCount}
            absentCount={i.absentCount}
            marks={i.marks}
            onClick={onStudentClick ? () => onStudentClick(i.name) : undefined}
          />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="border-border mt-2 flex items-center justify-between border-t pt-2">
          <span className="text-fg-subtle text-[11px] tabular-nums">
            {start + 1}–{Math.min(start + ISSUE_PAGE_SIZE, sorted.length)} / 총{' '}
            {sorted.length}명
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="이전 수강생"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              className="border-border text-fg-muted hover:bg-surface-muted flex size-6 items-center justify-center rounded-md border disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-fg-subtle text-[11px] tabular-nums">
              {safePage + 1}/{pageCount}
            </span>
            <button
              type="button"
              aria-label="다음 수강생"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= pageCount - 1}
              className="border-border text-fg-muted hover:bg-surface-muted flex size-6 items-center justify-center rounded-md border disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 결석자 목록 — 한 번에 최대 5명, 좌우 화살표로 페이지 이동.
export function IssueList({
  rows,
}: {
  rows: { key: string; name: string; desc: string }[]
}) {
  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(rows.length / ISSUE_PAGE_SIZE)
  // rows가 줄어 현재 페이지가 범위를 벗어나면 보정.
  const safePage = Math.min(page, Math.max(0, pageCount - 1))
  const start = safePage * ISSUE_PAGE_SIZE
  const visible = rows.slice(start, start + ISSUE_PAGE_SIZE)

  return (
    <div className="flex flex-col">
      <ul className="divide-border divide-y">
        {visible.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <span className="text-fg text-[13px] font-semibold">
              {row.name}
            </span>
            <span className="text-fg-muted text-[12px]">{row.desc}</span>
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <div className="border-border mt-2 flex items-center justify-between border-t pt-2">
          <span className="text-fg-subtle text-[11px] tabular-nums">
            {start + 1}–{Math.min(start + ISSUE_PAGE_SIZE, rows.length)} / 총{' '}
            {rows.length}명
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="이전 수강생"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              className="border-border text-fg-muted hover:bg-surface-muted flex size-6 items-center justify-center rounded-md border disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-fg-subtle text-[11px] tabular-nums">
              {safePage + 1}/{pageCount}
            </span>
            <button
              type="button"
              aria-label="다음 수강생"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= pageCount - 1}
              className="border-border text-fg-muted hover:bg-surface-muted flex size-6 items-center justify-center rounded-md border disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
