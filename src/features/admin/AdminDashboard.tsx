import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Users,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { Modal } from '@/components/ui/Modal'
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
import { QuickLinks } from './dashboard/QuickLinks'
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
  usePageHeader('운영 대시보드', '담당 기수의 운영 현황을 한눈에 확인합니다')
  const myCohorts = useMyCohorts()
  const dashboard = useOperatorDashboard(myCohorts.data)
  const hrdLive = useHrdLiveSummaries(myCohorts.data, dashboard.data?.cohorts)
  // 상세 모달로 띄울 기수 id. null이면 전체 비교 화면.
  const [selected, setSelected] = useState<string | null>(null)

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
  // 담당 1개면 딥다이브를 그대로 노출, 여러 개면 전체 비교 + 기수 클릭 시 상세 모달.
  const modalBoard = single
    ? null
    : (boards.find((b) => b.cohortId === selected) ?? null)

  // HRD 라이브로 채워야 하는 기수(staging 미인입·개강 전 아님)가 있는데 아직 안 오면 대기.
  // staging 기수만 먼저 렌더되고 HRD 기수가 뒤늦게 '뚝' 나타나는 끊김을 막는다.
  const needsHrd = (dashboard.data?.cohorts ?? []).some(
    (b) => !b.hasData && b.status !== 'upcoming',
  )
  const hrdNotReady = needsHrd && hrdLive.data == null && !hrdLive.isError

  if (
    myCohorts.isPending ||
    (myCohorts.data?.length && dashboard.isPending) ||
    (dashboard.data && hrdNotReady)
  ) {
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
  // 담당 미배정은 useMyCohorts가 전체 기수로 폴백하므로 여기 도달 = 시스템에 기수 자체가 없음.
  if ((myCohorts.data?.length ?? 0) === 0) {
    return (
      <div className="p-8">
        <Empty
          icon={<Users />}
          title="등록된 과정·기수가 없어요"
          description="설정 > 과정 관리에서 과정과 기수를 등록하면 운영 현황이 여기에 표시됩니다."
        />
      </div>
    )
  }
  if (!dashboard.data) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-8">
      {/* 날짜·기수 칩 헤더 행은 제거(운영 요구) — 기수 상세는 비교 표 행 클릭으로 진입. */}
      <div>
        {single ? (
          // 담당 1기수도 상단 '오늘 인사이트'를 동일하게 제공(전 매니저 첫인상 통일),
          // 그 아래 해당 기수 상세를 이어서 보여준다.
          <div className="flex flex-col gap-6">
            <DashboardInsight
              boards={boards}
              quarantineCount={dashboard.data.quarantineCount}
              today={dashboard.data.today}
              upcoming={dashboard.data.upcoming}
            />
            <QuickLinks />
            <CohortDeepDive
              board={boards[0]}
              hrdPending={hrdLive.isPending && hrdLive.isFetching}
            />
          </div>
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

      {/* 기수 상세 모달 — 비교 표/칩에서 기수 클릭 시 */}
      <Modal
        open={!!modalBoard}
        onClose={() => setSelected(null)}
        size="lg"
        title={
          modalBoard
            ? `${modalBoard.courseName} ${modalBoard.cohortLabel}`
            : undefined
        }
      >
        {modalBoard && (
          <CohortDeepDive
            board={modalBoard}
            hrdPending={hrdLive.isPending && hrdLive.isFetching}
            hideHeader
          />
        )}
      </Modal>
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

      {/* 바로가기 — 자주 쓰는 화면 타일(매니저 개인 편집 가능) */}
      <div className="mt-5">
        <QuickLinks />
      </div>

      {/* KPI 합산 카드는 제거(운영 요구) — 인사이트 지표 타일과 중복. */}

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
          <p className="text-fg-subtle py-8 text-center text-[13px]">
            지각·결석 반복 수강생이 없어요
          </p>
        ) : (
          // 아웃라인 없는 플랫 디자인 — 기수별로 얇은 구분선 헤더 + 행 목록만.
          <div className="flex flex-col gap-7">
            {issueBoards.map((b) => (
              <div key={b.cohortId}>
                <div className="border-divider flex items-center justify-between border-b pb-2">
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
                <div className="pt-1">
                  <RiskList issues={b.issues} />
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
  hideHeader,
}: {
  board: CohortBoard
  hrdPending?: boolean
  /** 모달에서 제목이 이미 있을 때 내부 헤더를 숨긴다. 소스·기간 배지는 유지. */
  hideHeader?: boolean
}) {
  const meta = STATUS_META[board.status]

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {!hideHeader && (
          <p className="text-fg text-[15px] font-bold">
            {board.courseName} {board.cohortLabel}
          </p>
        )}
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
                <RiskList issues={board.issues} />
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

const ISSUE_PAGE_SIZE = 5

// 위험도 등급 — 결석 4회↑=긴급, 결석 2회↑ 또는 지각 5회↑=주의(인사이트 기준과 일치).
type RiskTier = 'danger' | 'warning' | 'neutral'
function riskTier(lateCount: number, absentCount: number): RiskTier {
  if (absentCount >= 4) return 'danger'
  if (absentCount >= 2 || lateCount >= 5) return 'warning'
  return 'neutral'
}
const RISK_META: Record<
  RiskTier,
  { badge: string | null; badgeCls: string; bar: string; dot: string }
> = {
  danger: {
    badge: '긴급',
    badgeCls: 'bg-danger-bg text-danger',
    bar: 'bg-danger',
    dot: 'bg-danger',
  },
  warning: {
    badge: '주의',
    badgeCls: 'bg-warning-bg text-warning',
    bar: 'bg-warning',
    dot: 'bg-warning',
  },
  neutral: {
    badge: null,
    badgeCls: '',
    bar: 'bg-fg-subtle/40',
    dot: 'bg-fg-subtle/40',
  },
}

// 관리 필요 수강생 한 행 — 위험도 점/막대(결석 비중)·지각·결석·등급 배지 + 클릭 시 상세.
// 넓어진 전폭 행의 가운데를 위험도 막대로 채워 심각도가 한눈에 보이게 한다.
function RiskStudentRow({
  name,
  lateCount,
  absentCount,
  maxAbsent,
  onClick,
}: {
  name: string
  lateCount: number
  absentCount: number
  maxAbsent: number
  onClick?: () => void
}) {
  const tier = riskTier(lateCount, absentCount)
  const meta = RISK_META[tier]
  const pct =
    maxAbsent > 0 ? Math.max(6, Math.round((absentCount / maxAbsent) * 100)) : 0

  const inner = (
    <>
      <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
      <span className="text-fg w-24 shrink-0 truncate text-[13px] font-semibold">
        {name}
      </span>
      <span className="bg-surface-muted hidden h-1.5 min-w-0 flex-1 overflow-hidden rounded-full sm:block">
        <span
          className={cn('block h-full rounded-full', meta.bar)}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-fg-muted shrink-0 text-[12px] tabular-nums">
        지각 {lateCount} · 결석 {absentCount}
      </span>
      {meta.badge && (
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold',
            meta.badgeCls,
          )}
        >
          {meta.badge}
        </span>
      )}
      {onClick && (
        <ChevronRight className="text-fg-subtle group-hover/risk:text-fg size-4 shrink-0 transition-colors" />
      )}
    </>
  )

  const cls =
    'flex w-full items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0'
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        cls,
        'group/risk hover:bg-surface-muted/50 -mx-2 rounded-md px-2',
      )}
    >
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

// 위험도 목록 — 결석 많은 순 정렬 + 한 번에 5명 페이지네이션(딥다이브용).
function RiskList({
  issues,
  onStudentClick,
}: {
  issues: { studentUuid: string; name: string; lateCount: number; absentCount: number }[]
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
  const maxAbsent = Math.max(1, ...sorted.map((i) => i.absentCount))
  const pageCount = Math.ceil(sorted.length / ISSUE_PAGE_SIZE)
  const safePage = Math.min(page, Math.max(0, pageCount - 1))
  const start = safePage * ISSUE_PAGE_SIZE
  const visible = sorted.slice(start, start + ISSUE_PAGE_SIZE)

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        {visible.map((i) => (
          <RiskStudentRow
            key={i.studentUuid}
            name={i.name}
            lateCount={i.lateCount}
            absentCount={i.absentCount}
            maxAbsent={maxAbsent}
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
function IssueList({
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
