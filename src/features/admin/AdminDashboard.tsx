import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, Inbox, Users } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import {
  Skeleton,
  SkeletonKpiRow,
  SkeletonTable,
} from '@/components/ui/Skeleton'
import { usePageHeader } from '@/shared/store'
import {
  useHrdLiveSummaries,
  useMyCohorts,
  useOperatorDashboard,
} from './api/dashboard'
import { DashboardInsight } from './dashboard/DashboardInsight'
import { Sparkline } from './dashboard/Sparkline'
import type { CohortBoard, CohortStatus, ScheduleItem } from './dashboard/types'

// 운영 대시보드(관제탑형) — 담당 기수 스코프 실데이터(P0 staging 집계).
// 기본 화면은 담당 기수 전체 비교, 칩/행 클릭으로 기수 딥다이브 전환.
// 담당 기수가 1개면 스위처를 숨기고 바로 딥다이브로 시작한다.

const STATUS_META: Record<CohortStatus, { label: string; tone: BadgeTone }> = {
  operating: { label: '진행 중', tone: 'success' },
  ended: { label: '수료', tone: 'neutral' },
  upcoming: { label: '개강 전', tone: 'warning' },
}

const COHORT_COLORS = [
  'var(--color-brand)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-accent-strong)',
]

function cohortColor(index: number) {
  return COHORT_COLORS[index % COHORT_COLORS.length]
}

function fmtDate(d: string) {
  return d.replaceAll('-', '.')
}

export default function AdminDashboard() {
  usePageHeader('운영 대시보드', '담당 기수 운영 현황 — CSV 인입 원본 기준')
  const myCohorts = useMyCohorts()
  const dashboard = useOperatorDashboard(myCohorts.data)
  const hrdLive = useHrdLiveSummaries(myCohorts.data, dashboard.data?.cohorts)
  const [selected, setSelected] = useState<'all' | string>('all')

  // 소스 우선순위 — 인입큐(staging) 데이터가 있으면 staging, 없으면 HRD-Net 라이브 집계로 채운다.
  const boards = useMemo<CohortBoard[]>(() => {
    const base = dashboard.data?.cohorts ?? []
    return base.map((b) => {
      if (b.hasData) return { ...b, source: 'staging' as const }
      const live = hrdLive.data?.[b.cohortId]
      if (!live) return b
      return {
        ...b,
        hasData: true,
        source: 'hrd-live' as const,
        students: live.students,
        attendance: {
          todayPresent: live.todayPresent,
          todayTotal: live.todayTotal,
          avgRate: live.avgRate,
          weekly: live.weekly,
          todayAbsentees: live.todayAbsentees,
        },
        assessment: null,
        weeklyCheck: null,
        issues: live.issues,
        pending: null,
      }
    })
  }, [dashboard.data, hrdLive.data])
  const single = boards.length === 1
  const current = single
    ? boards[0]
    : selected === 'all'
      ? null
      : (boards.find((b) => b.cohortId === selected) ?? null)

  if (myCohorts.isPending || (myCohorts.data?.length && dashboard.isPending)) {
    return <DashboardSkeleton />
  }
  if (myCohorts.isError || dashboard.isError) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="대시보드를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <Button
              onClick={() =>
                myCohorts.isError ? myCohorts.refetch() : dashboard.refetch()
              }
            >
              다시 시도
            </Button>
          }
        />
      </div>
    )
  }
  if ((myCohorts.data?.length ?? 0) === 0) {
    return (
      <div className="p-8">
        <Empty
          icon={<Users />}
          title="담당 과정·기수가 없어요"
          description="설정 > 계정 관리에서 담당 과정·기수를 배정하면 해당 기수의 운영 현황이 여기에 표시됩니다."
        />
      </div>
    )
  }
  if (!dashboard.data) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-8">
      {/* 상단 — 날짜 + 기수 스위처 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-fg-muted text-[13px]">
          {dashboard.data.today} · 담당 {boards.length}개 기수
        </p>
        {!single && (
          <div className="border-border bg-surface inline-flex gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setSelected('all')}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                selected === 'all'
                  ? 'bg-brand text-on-color'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              전체
            </button>
            {boards.map((b) => (
              <button
                key={b.cohortId}
                type="button"
                onClick={() => setSelected(b.cohortId)}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  selected === b.cohortId
                    ? 'bg-brand text-on-color'
                    : 'text-fg-muted hover:text-fg',
                )}
              >
                {b.cohortLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        {current ? (
          <CohortDeepDive
            board={current}
            hrdPending={hrdLive.isPending && hrdLive.isFetching}
          />
        ) : (
          <AllCohortsView
            boards={boards}
            quarantineCount={dashboard.data.quarantineCount}
            today={dashboard.data.today}
            upcoming={dashboard.data.upcoming}
            onSelect={(id) => setSelected(id)}
          />
        )}
      </div>
    </div>
  )
}

/* ─────────────── 전체 비교 뷰 ─────────────── */

function AllCohortsView({
  boards,
  quarantineCount,
  today,
  upcoming,
  onSelect,
}: {
  boards: CohortBoard[]
  quarantineCount: number
  today: string
  upcoming: ScheduleItem[]
  onSelect: (cohortId: string) => void
}) {
  const totalStudents = boards.reduce(
    (s, b) => s + (b.students?.active ?? 0),
    0,
  )
  const live = boards.filter((b) => b.attendance?.todayTotal != null)
  const todayPresent = live.reduce(
    (s, b) => s + (b.attendance?.todayPresent ?? 0),
    0,
  )
  const todayTotal = live.reduce(
    (s, b) => s + (b.attendance?.todayTotal ?? 0),
    0,
  )
  const issueCount = boards.reduce((s, b) => s + b.issues.length, 0)
  const pendingCount = boards.reduce(
    (s, b) =>
      s + (b.pending ? b.pending.certificates + b.pending.troubleshooting : 0),
    0,
  )

  const columns: Column<CohortBoard>[] = [
    {
      key: 'cohort',
      header: '기수',
      cell: (b) => (
        <span className="flex items-center gap-2.5">
          <i
            className="h-6 w-[3px] shrink-0 rounded-full"
            style={{ background: cohortColor(boards.indexOf(b)) }}
            aria-hidden
          />
          <span>
            <span className="text-fg block text-[13px] font-bold">
              {b.cohortLabel}
            </span>
            <span className="text-fg-subtle block text-[11px]">
              {fmtDate(b.startDate)}–{fmtDate(b.endDate)}
              {b.source === 'hrd-live' && (
                <span className="text-info ml-1.5 font-semibold">
                  HRD 라이브
                </span>
              )}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (b) => (
        <StatusBadge
          label={STATUS_META[b.status].label}
          tone={STATUS_META[b.status].tone}
        />
      ),
    },
    {
      key: 'students',
      header: '수강생',
      className: 'w-28',
      cell: (b) =>
        b.students ? (
          <span className="text-fg text-[13px] tabular-nums">
            {b.students.active}명
            {b.students.dropout > 0 && (
              <span className="text-fg-subtle text-[11px]">
                {' '}
                · 탈락 {b.students.dropout}
              </span>
            )}
          </span>
        ) : (
          <NoData />
        ),
    },
    {
      key: 'today',
      header: '오늘 출석',
      className: 'w-24',
      cell: (b) =>
        b.attendance?.todayTotal != null ? (
          <span className="text-fg text-[13px] font-semibold tabular-nums">
            {b.attendance.todayPresent}/{b.attendance.todayTotal}
          </span>
        ) : (
          <span className="text-fg-subtle text-[12px]">
            {b.status === 'ended'
              ? '종료'
              : b.status === 'upcoming'
                ? '개강 전'
                : '—'}
          </span>
        ),
    },
    {
      key: 'trend',
      header: '출석률 추이',
      className: 'w-44',
      cell: (b) =>
        b.attendance && b.attendance.weekly.length >= 2 ? (
          <span className="flex items-center gap-2">
            <Sparkline
              points={b.attendance.weekly.map((w) => w.rate)}
              width={110}
              height={30}
              stroke={cohortColor(boards.indexOf(b))}
              todayIndex={b.attendance.weekly.length - 1}
            />
            <span className="text-fg text-[12px] font-semibold tabular-nums">
              {b.attendance.avgRate}%
            </span>
          </span>
        ) : (
          <NoData />
        ),
    },
    {
      key: 'assessment',
      header: '성취도',
      className: 'w-20',
      cell: (b) =>
        b.assessment?.avg != null ? (
          <span className="text-fg text-[13px] tabular-nums">
            {b.assessment.avg}점
          </span>
        ) : (
          <NoData />
        ),
    },
    {
      key: 'issues',
      header: '관리',
      className: 'w-20',
      cell: (b) =>
        b.issues.length > 0 ? (
          <StatusBadge label={`${b.issues.length}건`} tone="warning" />
        ) : (
          <span className="text-fg-subtle text-[12px]">—</span>
        ),
    },
  ]

  // 기수별로 분리해 보여준다 — 이슈가 있는 기수만 패널을 만든다.
  const issueBoards = boards.filter((b) => b.issues.length > 0)

  return (
    <>
      {/* 오늘 인사이트 — 자동 생성 액션 큐 + 상황 요약 + 지표 팝오버 */}
      <DashboardInsight
        boards={boards}
        quarantineCount={quarantineCount}
        today={today}
        upcoming={upcoming}
      />

      {/* KPI 합산 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="담당 수강생"
          value={`${totalStudents}명`}
          hint={`${boards.length}개 기수 합산`}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="오늘 출석"
          value={todayTotal > 0 ? `${todayPresent}/${todayTotal}` : '—'}
          hint={
            todayTotal > 0
              ? `진행 기수 ${live.length}개 기준`
              : '오늘 수업 중인 기수 없음'
          }
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <KpiCard
          label="관리 필요"
          value={`${issueCount}건`}
          hint="지각·결석 반복 수강생"
          tone={issueCount > 0 ? 'warning' : 'default'}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="승인·인입 대기"
          value={`${pendingCount + quarantineCount}건`}
          hint={`승인 ${pendingCount} · 격리 큐 ${quarantineCount}`}
          tone={pendingCount + quarantineCount > 0 ? 'info' : 'default'}
          icon={<Inbox className="h-4 w-4" />}
        />
      </div>

      {/* 기수 비교 표 */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-fg text-[15px] font-bold">기수 비교</p>
          <p className="text-fg-subtle text-[12px]">
            행을 클릭하면 기수 상세로 이동해요
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={boards}
          rowKey={(b) => b.cohortId}
          onRowClick={(b) => onSelect(b.cohortId)}
          empty="담당 기수가 없어요"
        />
      </div>

      {/* 관리 필요 수강생 — 기수별 분리 패널 */}
      <div className="mt-6">
        <p className="text-fg mb-2 text-[15px] font-bold">관리 필요 수강생</p>
        {issueBoards.length === 0 ? (
          <div className="border-border bg-surface rounded-xl border p-5">
            <p className="text-fg-subtle py-4 text-center text-[13px]">
              지각·결석 반복 수강생이 없어요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {issueBoards.map((b) => (
              <div
                key={b.cohortId}
                className="border-border bg-surface rounded-xl border"
              >
                <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <i
                      className="h-3.5 w-[3px] rounded-full"
                      style={{ background: cohortColor(boards.indexOf(b)) }}
                      aria-hidden
                    />
                    <span className="text-fg text-[12.5px] font-bold">
                      {b.cohortLabel}
                    </span>
                    {b.source === 'hrd-live' && (
                      <span className="text-info text-[11px] font-semibold">
                        HRD 라이브
                      </span>
                    )}
                  </span>
                  <span className="text-fg-subtle text-[11.5px]">
                    {b.issues.length}명
                  </span>
                </div>
                <div className="p-4">
                  <ul className="divide-border divide-y">
                    {b.issues.map((issue) => (
                      <li
                        key={issue.studentUuid}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <span className="text-fg text-[13px] font-semibold">
                          {issue.name}
                        </span>
                        <span className="text-fg-muted text-[12px]">
                          지각 {issue.lateCount}회 · 결석 {issue.absentCount}회
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ─────────────── 기수 딥다이브 뷰 ─────────────── */

function CohortDeepDive({
  board,
  hrdPending,
}: {
  board: CohortBoard
  hrdPending?: boolean
}) {
  const meta = STATUS_META[board.status]

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-fg text-[15px] font-bold">
          {board.courseName} {board.cohortLabel}
        </p>
        <StatusBadge label={meta.label} tone={meta.tone} />
        {board.source === 'hrd-live' && (
          <StatusBadge label="HRD-Net 라이브" tone="info" />
        )}
        {board.source === 'staging' && (
          <StatusBadge label="인입 데이터" tone="neutral" />
        )}
        <p className="text-fg-subtle text-[12px]">
          {fmtDate(board.startDate)} – {fmtDate(board.endDate)}
        </p>
      </div>

      {!board.hasData ? (
        <div className="mt-4">
          {hrdPending ? (
            <p className="text-fg-muted py-10 text-center text-[13px]">
              HRD-Net에서 출결 데이터를 불러오는 중…
            </p>
          ) : (
            <Empty
              icon={<Inbox />}
              title="아직 인입된 데이터가 없어요"
              description="CSV 매핑·업로드에서 이 기수의 출결·평가 데이터를 인입하면 여기에 집계가 표시됩니다."
            />
          )}
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="수강생"
              value={`${board.students?.active ?? 0}명`}
              hint={
                board.students && board.students.dropout > 0
                  ? `중도탈락 ${board.students.dropout}명 포함 ${board.students.total}명 입과`
                  : `입과 ${board.students?.total ?? 0}명`
              }
            />
            <KpiCard
              label="오늘 출석"
              value={
                board.attendance?.todayTotal != null
                  ? `${board.attendance.todayPresent}/${board.attendance.todayTotal}`
                  : '—'
              }
              hint={
                board.attendance?.todayTotal != null
                  ? `결석 ${board.attendance.todayAbsentees.length}명`
                  : board.status === 'ended'
                    ? '과정 종료'
                    : '오늘 수업 없음'
              }
            />
            <KpiCard
              label={board.status === 'ended' ? '최종 출석률' : '평균 출석률'}
              value={
                board.attendance?.avgRate != null
                  ? `${board.attendance.avgRate}%`
                  : '—'
              }
              hint="전체 수업일 기준"
            />
            <KpiCard
              label="성취도 평균"
              value={
                board.assessment?.avg != null
                  ? `${board.assessment.avg}점`
                  : '—'
              }
              hint={
                board.assessment && board.assessment.rounds.length > 0
                  ? `${board.assessment.rounds.length}회차 평가 기준`
                  : '평가 전'
              }
            />
          </div>

          {/* 차트 2열 */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="최근 수업일 출석률" sub="단위 %">
              {board.attendance && board.attendance.weekly.length > 0 ? (
                <BarRow
                  items={board.attendance.weekly.map((w) => ({
                    label: w.date.slice(5).replace('-', '/'),
                    value: w.rate,
                  }))}
                  max={100}
                  min={60}
                  unit="%"
                />
              ) : (
                <PanelEmpty text="출석 데이터가 없어요" />
              )}
            </Panel>

            <Panel
              title={
                board.attendance?.todayTotal != null
                  ? '오늘 결석자'
                  : '관리 필요 수강생'
              }
            >
              {board.attendance?.todayTotal != null ? (
                board.attendance.todayAbsentees.length === 0 ? (
                  <PanelEmpty text="전원 출석이에요" />
                ) : (
                  <IssueList
                    rows={board.attendance.todayAbsentees.map((a) => ({
                      key: a.studentUuid,
                      name: a.name,
                      desc: a.detail,
                    }))}
                  />
                )
              ) : board.issues.length === 0 ? (
                <PanelEmpty text="지각·결석 반복 수강생이 없어요" />
              ) : (
                <IssueList
                  rows={board.issues.map((i) => ({
                    key: i.studentUuid,
                    name: i.name,
                    desc: `지각 ${i.lateCount}회 · 결석 ${i.absentCount}회`,
                  }))}
                />
              )}
            </Panel>
          </div>

          {/* 성취도 회차별 */}
          {board.assessment && board.assessment.rounds.length > 0 && (
            <div className="mt-4">
              <Panel title="성취도 평가 회차별 평균" sub="100점 만점">
                <BarRow
                  items={board.assessment.rounds.map((r) => ({
                    label: `${r.round}회차`,
                    value: r.avg,
                  }))}
                  max={100}
                  min={0}
                  unit="점"
                  narrow
                />
              </Panel>
            </div>
          )}

          {/* 승인 대기 */}
          {board.pending &&
            board.pending.certificates + board.pending.troubleshooting > 0 && (
              <p className="text-fg-muted mt-4 text-[12.5px]">
                승인 대기 — 자격증 {board.pending.certificates}건 · 트러블슈팅{' '}
                {board.pending.troubleshooting}건
              </p>
            )}
        </>
      )}
    </>
  )
}

/* ─────────────── 소형 빌딩 블록 ─────────────── */

function DashboardSkeleton() {
  return (
    <div className="p-8" aria-busy="true">
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

function NoData() {
  return <span className="text-fg-subtle text-[12px]">인입 대기</span>
}

function Panel({
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

function PanelEmpty({ text }: { text: string }) {
  return <p className="text-fg-subtle py-6 text-center text-[13px]">{text}</p>
}

function BarRow({
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

function IssueList({
  rows,
}: {
  rows: { key: string; name: string; desc: string }[]
}) {
  return (
    <ul className="divide-border divide-y">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
        >
          <span className="text-fg text-[13px] font-semibold">{row.name}</span>
          <span className="text-fg-muted text-[12px]">{row.desc}</span>
        </li>
      ))}
    </ul>
  )
}
