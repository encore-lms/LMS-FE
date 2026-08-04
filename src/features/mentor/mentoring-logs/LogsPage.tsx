import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Calendar,
  Check,
  Clock3,
  FileText,
  Info,
  Search,
  Send,
} from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { Pagination } from '@/components/data/Pagination'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import LogDetailModal from './LogDetailModal'
import { useMentoringLogs } from '../api/logs'
import { MENTOR_FLOW_CAPTION } from '../constants'
import { CohortChip } from '../components/chips'
import type { MentoringLogListItem, MentoringLogStatus } from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { LogStateChip } from './LogChips'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import {
  LOG_STATUS_META,
  LOG_SUBMITTED_TOAST,
  PLACE_TYPE_ICON,
} from './logMeta'
import { SearchInput } from '@/components/ui/SearchInput'

const PERIOD_OPTIONS = [
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 90일' },
  { value: 'all', label: '전체' },
] as const

const STATUS_OPTIONS: { value: MentoringLogStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'submitted', label: '승인 대기' },
  { value: 'valid', label: '유효' },
  { value: 'change_requested', label: '수정 요청' },
]

const DAY_MS = 24 * 60 * 60 * 1000

// 행별 액션 — 상태 연동 변형: 승인 대기·유효=열기(상세 모달) / 수정 요청=수정(재제출 폼).
// 수정은 작성 화면 ?logId= 딥링크.
function rowAction(log: MentoringLogListItem, backTo?: string) {
  const from = backTo ? `&from=${encodeURIComponent(backTo)}` : ''
  switch (log.status) {
    case 'change_requested':
      return {
        kind: 'edit' as const,
        label: '수정',
        to: `/mentor/mentoring-logs/new?logId=${log.logId}${from}`,
        className: 'bg-danger text-on-color hover:bg-danger/90 font-bold',
      }
    default:
      return {
        kind: 'open' as const,
        label: '열기',
        to: `/mentor/mentoring-logs/${log.logId}`,
        className:
          'border-border text-fg-muted hover:bg-surface-muted border font-medium',
      }
  }
}

/** 현재 목록 CSV 다운로드 — 필터 적용 행 기준(클라이언트 생성, BOM 포함). */
function exportCsv(rows: MentoringLogListItem[]) {
  const header = [
    '진행 일시',
    '기수',
    '팀',
    '요지',
    '장소',
    '실제(분)',
    '인정(h)',
    '초과(h)',
    '상태',
  ]
  const lines = rows.map((l) => [
    `${l.yearLabel}-${l.performedAt.slice(5, 10)} ${l.timeLabel}`,
    l.cohortLabel,
    l.teamName,
    l.summary,
    `${MENTORING_PLACE_TYPE_LABEL[l.placeType]} · ${l.placeDetail}`,
    String(l.actualMinutes),
    l.recognizedHours != null ? String(l.recognizedHours) : '',
    l.excessHours > 0 ? String(l.excessHours) : '',
    LOG_STATUS_META[l.status].label,
  ])
  const csv = [header, ...lines]
    .map((cols) =>
      cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n')
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'mentoring-logs.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

// 멘토링 일지 (/mentor/mentoring-logs) — Figma 2553:4040.
// 필터(팀/상태/기간/검색) · KPI 4 · 8컬럼 테이블 · CSV · 일지 정책 요약 배너.
// :logId 상세 모달은 중첩 라우트(Outlet) 오버레이 — 목록 필터 상태 유지.
// 목록 페이지당 일지 수 — 표가 길어지지 않게 페이지네이션(공통 Pagination).
const LOG_PAGE_SIZE = 8

export default function LogsPage({
  embedded = false,
  teamId: fixedTeamId,
}: {
  /** 팀 상세 '일지' 탭에 얹을 때 — 자체 헤더·바깥 여백을 생략한다. */
  embedded?: boolean
  /** 주면 그 팀 일지만 — 팀이 이미 정해졌으니 팀 고르는 칸도 없앤다. */
  teamId?: string
} = {}) {
  usePageHeader('멘토링 일지', MENTOR_FLOW_CAPTION, !embedded)
  const { data, isPending, isError, refetch } = useMentoringLogs()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // 제출 완료 복귀 — /mentor/mentoring-logs?toast=submitted (2582:6348). 공통 토스트로
  // 1회 표시 후 쿼리 제거(전용 완료 화면 대신 목록+토스트 — M2 응답 저장 선례).
  const toastShownRef = useRef(false)
  useEffect(() => {
    if (toastShownRef.current || searchParams.get('toast') !== 'submitted')
      return
    toastShownRef.current = true
    toast.success(LOG_SUBMITTED_TOAST)
    const next = new URLSearchParams(searchParams)
    next.delete('toast')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, toast])

  // 팀 필터 — ?teamId= 딥링크 지원(M1 팀 카드 '일지 수정' 진입 경로).
  // 팀 상세에 얹힐 때는 그 팀으로 고정한다(고르는 칸도 감춘다).
  const [teamId, setTeamId] = useState(
    fixedTeamId ?? searchParams.get('teamId') ?? 'all',
  )
  // 팀 안에서 그 자리에 띄운 상세 — 라우트 대신 값으로 연다.
  const [openLogId, setOpenLogId] = useState<string | null>(null)
  // 팀 안에 얹혀 있으면 작성 화면에서 돌아올 곳은 그 팀이다.
  const backTo = fixedTeamId
    ? `/mentor/teams/${fixedTeamId}?tab=logs`
    : undefined
  const [status, setStatus] = useState<MentoringLogStatus | 'all'>('all')
  // 팀 상세에 얹힐 때는 기간을 자르지 않는다 — 그 팀 것이 몇 건 안 되는데 최근 30일로
  // 잘리면 홈에서 센 건수와 어긋나 보인다.
  const [period, setPeriod] = useState<string>(fixedTeamId ? 'all' : '30')
  const [q, setQ] = useState('')

  // 팀 상세에 얹힐 때는 그 팀 것만이 이 화면의 전부다 — KPI·팀 목록까지 함께 좁힌다.
  // (목록만 걸렀더니 '총 일지 8건'인데 표는 0줄이라 수가 어긋나 보였다.)
  const logs = useMemo(() => {
    const all = data?.logs ?? []
    return fixedTeamId ? all.filter((l) => l.teamId === fixedTeamId) : all
  }, [data, fixedTeamId])

  // 기간 기준일 — 목록 내 최근 진행 일시 기준 상대 계산(M2 선례 — mock 더미 보존,
  // 실서버 연동 시 서버 필터로 대체 TODO).
  const anchorMs = useMemo(
    () =>
      logs.reduce(
        (max, l) => Math.max(max, new Date(l.performedAt).getTime()),
        0,
      ),
    [logs],
  )
  const periodDays = period === 'all' ? null : Number(period)

  const periodFiltered = useMemo(
    () =>
      logs.filter(
        (l) =>
          periodDays === null ||
          anchorMs - new Date(l.performedAt).getTime() <= periodDays * DAY_MS,
      ),
    [logs, periodDays, anchorMs],
  )

  const teamOptions = useMemo(() => {
    const seen = new Map<string, string>()
    logs.forEach((l) => {
      if (!seen.has(l.teamId))
        seen.set(l.teamId, `${l.cohortLabel} · ${l.teamName}`)
    })
    return [...seen.entries()].map(([value, label]) => ({ value, label }))
  }, [logs])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return periodFiltered.filter((l) => {
      if (teamId !== 'all' && l.teamId !== teamId) return false
      if (status !== 'all' && l.status !== status) return false
      if (needle) {
        const hay = `${l.teamName} ${l.summary}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [periodFiltered, teamId, status, q])

  // 페이지네이션 — 필터(팀/상태/기간/검색) 변경 시 1페이지로 리셋. 건수 칩·CSV는 전체 기준.
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(visible.length / LOG_PAGE_SIZE))
  useEffect(() => setPage(1), [teamId, status, period, q])
  const paged = useMemo(
    () => visible.slice((page - 1) * LOG_PAGE_SIZE, page * LOG_PAGE_SIZE),
    [visible, page],
  )

  // KPI — 기간 필터 기준 집계(캡션 '최근 30일'과 정합)
  const kpis = {
    total: periodFiltered.length,
    valid: periodFiltered.filter((l) => l.status === 'valid').length,
    submitted: periodFiltered.filter((l) => l.status === 'submitted').length,
    changeRequested: periodFiltered.filter(
      (l) => l.status === 'change_requested',
    ).length,
    draft: periodFiltered.filter((l) => l.status === 'draft').length,
  }

  const columns: Column<MentoringLogListItem>[] = [
    {
      key: 'datetime',
      header: '진행 일시',
      className: 'w-[110px]',
      cell: (l) => (
        <span className="flex flex-col">
          <span className="text-fg text-[13px] font-bold whitespace-nowrap">
            {l.dateLabel} {l.timeLabel}
          </span>
          <span className="text-fg-subtle text-[10px]">{l.yearLabel}</span>
        </span>
      ),
    },
    {
      key: 'team',
      header: '팀',
      cell: (l) => (
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <CohortChip label={l.cohortLabel} mini />
            <span className="text-fg text-[13px] font-semibold">
              {l.teamName}
            </span>
            {l.excessHours > 0 && (
              <span className="bg-accent-bg text-accent-strong rounded px-[5px] py-px text-[9px] font-bold whitespace-nowrap">
                초과 멘토링 {l.excessHours}h
              </span>
            )}
          </span>
          <span className="text-fg-muted text-[11px]">{l.summary}</span>
        </span>
      ),
    },
    {
      key: 'place',
      header: '장소',
      align: 'center',
      className: 'w-[130px]',
      cell: (l) => {
        const Icon = PLACE_TYPE_ICON[l.placeType]
        return (
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-fg-muted flex items-center gap-1 text-[11px]">
              <Icon className="h-[11px] w-[11px]" />
              {MENTORING_PLACE_TYPE_LABEL[l.placeType]}
            </span>
            {/* 장소 상세는 컬럼(130px)보다 길 수 있어 셀 안에서 말줄임 — 전체는 title 로 */}
            <span
              className="text-fg-subtle block max-w-[98px] truncate text-[11px]"
              title={l.placeDetail}
            >
              {l.placeDetail}
            </span>
          </span>
        )
      },
    },
    {
      key: 'actual',
      header: '실제',
      align: 'right',
      className: 'w-20',
      cell: (l) => (
        <span className="text-fg-muted text-[13px] font-bold whitespace-nowrap">
          {l.actualMinutes}분
        </span>
      ),
    },
    {
      key: 'recognized',
      header: '인정',
      align: 'right',
      className: 'w-[70px]',
      cell: (l) =>
        l.recognizedHours != null ? (
          <span className="text-success text-[13px] font-bold">
            {l.recognizedHours}h
          </span>
        ) : (
          <span className="text-fg-subtle text-[13px]">-</span>
        ),
    },
    {
      key: 'excess',
      header: '초과',
      align: 'right',
      className: 'w-[70px]',
      cell: (l) =>
        l.excessHours > 0 ? (
          <span className="text-accent-strong text-[13px] font-bold">
            {l.excessHours}h
          </span>
        ) : (
          <span className="text-fg-subtle text-[13px]">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      className: 'w-[170px]',
      cell: (l) => <LogStateChip status={l.status} note={l.statusNote} />,
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-[110px]',
      cell: (l) => {
        const action = rowAction(l, backTo)
        const cls = cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] whitespace-nowrap',
          action.className,
        )
        // 팀 안에서 연 상세는 팀 안에 머문다 — 라우트로 나가면 팀 밖 전체 목록 위에 뜬다.
        if (embedded && action.kind === 'open') {
          return (
            <button
              type="button"
              onClick={() => setOpenLogId(l.logId)}
              className={cls}
            >
              {action.label}
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          )
        }
        return (
          <Link to={action.to} className={cls}>
            {action.label}
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        )
      },
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage kpis={4} columns={5} className="" />}
      errorTitle="멘토링 일지를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      <div className={cn('flex flex-col gap-5', !embedded && 'p-8')}>
        {/* 필터 행 — 팀/상태/기간 드롭다운 + 검색 + 새 일지 작성 */}
        <div className="flex flex-wrap items-center gap-2">
          {!fixedTeamId && (
            <FilterSelect
              icon={<Send className="text-fg-muted h-3.5 w-3.5 shrink-0" />}
              label="팀"
              value={teamId}
              onChange={setTeamId}
              options={[{ value: 'all', label: '전체' }, ...teamOptions]}
            />
          )}
          <FilterSelect
            icon={<Info className="text-fg-muted h-3.5 w-3.5 shrink-0" />}
            label="상태"
            value={status}
            onChange={(v) => setStatus(v as MentoringLogStatus | 'all')}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            icon={<Calendar className="text-fg-muted h-3.5 w-3.5 shrink-0" />}
            label="기간"
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
          />
          <label className="border-border focus-within:border-brand bg-surface flex h-10 w-[240px] items-center gap-2 rounded-[10px] border px-3.5">
            <Search className="text-fg-subtle h-3.5 w-3.5 shrink-0" />
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="팀명·일지 요지 검색"
              ariaLabel="팀명·일지 요지 검색"
              className="min-w-0 flex-1"
            />
          </label>
          <Link
            to={
              backTo
                ? `/mentor/mentoring-logs/new?teamId=${fixedTeamId}&from=${encodeURIComponent(backTo)}`
                : '/mentor/mentoring-logs/new'
            }
            className={buttonClass({ className: 'ml-auto whitespace-nowrap' })}
          >
            <Check className="h-3.5 w-3.5" />새 일지 작성
          </Link>
        </div>

        {/* KPI 4 — 우상단 아이콘은 Figma KPI 카드 정합(멘토링 일지 2553:4040) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="총 일지"
            icon={<FileText className="text-brand h-4 w-4" />}
            value={<KpiCount count={kpis.total} />}
            hint={
              PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? '전체'
            }
          />
          <KpiCard
            label="유효"
            icon={<Check className="text-success h-4 w-4" />}
            value={<KpiCount count={kpis.valid} />}
            hint="매니저 승인 완료 · 인정 시간 산입"
          />
          <KpiCard
            label="승인 대기"
            icon={<Clock3 className="text-warning h-4 w-4" />}
            value={<KpiCount count={kpis.submitted} />}
            hint="매니저 승인 후 인정"
            tone={kpis.submitted > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            label="수정 요청"
            icon={<AlertTriangle className="text-danger h-4 w-4" />}
            value={<KpiCount count={kpis.changeRequested} />}
            hint="멘토가 전체 수정 후 재제출 필요"
            tone={kpis.changeRequested > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* 섹션 헤더 — 건수 칩 + CSV 내보내기 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-fg text-lg font-bold">멘토링 일지</h2>
            <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
              {visible.length}건
            </span>
          </div>
          <button
            type="button"
            onClick={() => exportCsv(visible)}
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <ArrowDown className="h-3 w-3" />
            CSV 내보내기
          </button>
        </div>

        {/* 일지 테이블 — 8컬럼 고정폭(Figma) */}
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(l) => l.logId}
          empty="조건에 맞는 일지가 없습니다"
        />
        {visible.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            totalCount={visible.length}
            shownCount={paged.length}
            onPage={setPage}
          />
        )}

        {/* 팀 안에서 연 상세 — 같은 화면 위에 그대로 띄운다 */}
        {embedded && openLogId && (
          <LogDetailModal
            logId={openLogId}
            onClose={() => setOpenLogId(null)}
          />
        )}

        {/* /:logId 상세 모달 — 목록 필터 상태 유지한 채 오버레이 */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </div>
    </DataBoundary>
  )
}

// 드롭다운 트리거 — [아이콘 | 라벨 | 값 캐럿] (Figma 필터 문법)
function FilterSelect({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-fg-subtle text-[11px] font-medium whitespace-nowrap">
        {label}
      </span>
      <Select
        aria-label={`${label} 필터`}
        value={value}
        onChange={onChange}
        options={[...options]}
      />
    </div>
  )
}

// KPI 값 행 — 큰 숫자 + '건' 단위(M1 KpiValue 선례)
function KpiCount({ count }: { count: number }) {
  return (
    <span className="flex items-baseline gap-1">
      {count}
      <span className="text-fg-muted text-[13px] font-medium">건</span>
    </span>
  )
}
