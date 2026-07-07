import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Mail,
  MailOpen,
  MessageSquare,
  Search,
  SquarePen,
  Users,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import {
  ACTIVE_COHORT,
  COHORTS,
  FEEDBACK,
  PROGRAM,
  ROSTER,
  type FeedbackItem,
  type ResumeStatus,
  type RosterRow,
} from './mocks'

const STATUS_TONE: Record<ResumeStatus, BadgeTone> = {
  미작성: 'neutral',
  '작성 중': 'warning',
  '작성 완료': 'success',
}

// 완성도 막대 색 — 토큰 기반(낮음 danger → 중간 warning → 높음 success).
function barTone(pct: number) {
  if (pct >= 80) return 'bg-success'
  if (pct >= 40) return 'bg-warning'
  return 'bg-danger'
}

/** 이니셜 아바타 — 작성 이력 있으면 보라 강조, 미작성이면 흐리게. */
function ResumeAvatar({ name, muted }: { name: string; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
        muted
          ? 'bg-accent/15 text-accent-strong/60'
          : 'bg-accent-strong text-on-color',
      )}
    >
      {name.trim().charAt(0)}
    </span>
  )
}

/** KPI 타일 — 아이콘 + 값 + 라벨. */
function StatCard({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: ReactNode
  iconClass: string
  value: ReactNode
  label: string
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-4 rounded-xl border p-5">
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5',
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-fg text-2xl font-bold">{value}</span>
        <span className="text-fg-muted text-[13px]">{label}</span>
      </div>
    </div>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-[280px] max-w-full">
      <Search className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        placeholder={placeholder}
        className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border pr-3 pl-9 text-[14px] focus:outline-none"
      />
    </div>
  )
}

function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="bg-surface-muted flex items-center gap-1 rounded-lg p-1">
      {options.map((f) => {
        const on = f === value
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors',
              on
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {f}
          </button>
        )
      })}
    </div>
  )
}

/** 최고 완성도 — 막대 + %. 미작성(null)이면 대시. */
function CompletionCell({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-fg-subtle">-</span>
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-divider relative h-1.5 w-[120px] overflow-hidden rounded-full">
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full', barTone(pct))}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-fg text-[13px] font-medium tabular-nums">
        {pct}%
      </span>
    </div>
  )
}

const STATUS_FILTERS = ['전체', '작성 완료', '작성 중', '미작성'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

/** 이력서 현황 — 수강생 작성 현황 로스터. embedded=true면 KPI 카드 숨김. */
function RosterView({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParamState('q')
  const [statusFilter, setStatusFilter] = useSearchParamState(
    'statusfilter',
    '전체',
  )

  const kpis = useMemo(() => {
    const by = (s: ResumeStatus) => ROSTER.filter((r) => r.status === s).length
    return {
      total: ROSTER.length,
      done: by('작성 완료'),
      writing: by('작성 중'),
      none: by('미작성'),
    }
  }, [])

  const rows = useMemo(() => {
    const q = search.trim()
    const list = ROSTER.filter(
      (r) =>
        (statusFilter === '전체' || r.status === statusFilter) &&
        (q === '' || r.name.includes(q)),
    )
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ko'))
  }, [search, statusFilter])

  const columns: Column<RosterRow>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <ResumeAvatar name={r.name} muted={r.status === '미작성'} />
          <div className="flex flex-col">
            <span
              className={cn(
                'text-[14px] font-semibold',
                r.status === '미작성' ? 'text-fg-subtle' : 'text-fg',
              )}
            >
              {r.name}
            </span>
            <span className="text-fg-subtle text-[12px]">{r.cohort}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'count',
      header: '이력서 수',
      cell: (r) => (
        <span className={r.resumeCount === 0 ? 'text-fg-subtle' : 'text-fg'}>
          {r.resumeCount}개
        </span>
      ),
    },
    {
      key: 'completion',
      header: '최고 완성도',
      cell: (r) => <CompletionCell pct={r.completion} />,
    },
    {
      key: 'status',
      header: '대표 상태',
      cell: (r) => (
        <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} />
      ),
    },
    {
      key: 'updatedAt',
      header: '최종 수정일',
      cell: (r) => (
        <span className={r.updatedAt ? 'text-fg-muted' : 'text-fg-subtle'}>
          {r.updatedAt ?? '-'}
        </span>
      ),
    },
    {
      key: 'feedback',
      header: '피드백',
      cell: (r) =>
        r.feedback ? (
          <span className="text-accent-strong inline-flex items-center gap-1 text-[13px] font-semibold">
            <MessageSquare className="h-4 w-4" />
            {r.feedback}
          </span>
        ) : (
          <span className="text-fg-subtle">-</span>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {!embedded && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Users />}
            iconClass="bg-accent-bg text-accent-strong"
            value={`${kpis.total}명`}
            label="전체 수강생"
          />
          <StatCard
            icon={<CheckCircle2 />}
            iconClass="bg-success-bg text-success"
            value={`${kpis.done}명`}
            label="작성 완료"
          />
          <StatCard
            icon={<SquarePen />}
            iconClass="bg-warning-bg text-warning"
            value={`${kpis.writing}명`}
            label="작성 중"
          />
          <StatCard
            icon={<AlertCircle />}
            iconClass="bg-danger-bg text-danger"
            value={`${kpis.none}명`}
            label="미작성"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="이름 검색"
        />
        <FilterPills
          options={STATUS_FILTERS}
          value={statusFilter as StatusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) =>
          r.resumeCount > 0 && navigate(`/admin/resume/${r.id}`)
        }
        empty="조건에 맞는 수강생이 없습니다"
      />
    </div>
  )
}

const READ_FILTERS = ['전체', '읽지 않음', '읽음'] as const
type ReadFilter = (typeof READ_FILTERS)[number]

function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ResumeAvatar name={item.studentName} />
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">
              {item.studentName}
            </span>
            <span className="text-fg-subtle text-[12px]">
              {item.resumeName}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-accent-strong text-[12px] font-semibold">
            {item.category}
          </span>
          <span className="text-fg-subtle text-[12px]">{item.date}</span>
        </div>
      </div>
      <p className="text-fg-muted text-[13px] leading-relaxed">{item.body}</p>
      <span className="text-fg-subtle text-[12px]">{item.author}</span>
    </div>
  )
}

/** 피드백 관리 — 학생 이력서에 남긴 피드백 목록. */
function FeedbackView() {
  const [search, setSearch] = useSearchParamState('q')
  const [readFilter, setReadFilter] = useSearchParamState('readfilter', '전체')

  const kpis = useMemo(
    () => ({
      total: FEEDBACK.length,
      unread: FEEDBACK.filter((f) => !f.read).length,
      read: FEEDBACK.filter((f) => f.read).length,
    }),
    [],
  )

  const items = useMemo(() => {
    const q = search.trim()
    return FEEDBACK.filter(
      (f) =>
        (readFilter === '전체' || (readFilter === '읽음' ? f.read : !f.read)) &&
        (q === '' ||
          f.studentName.includes(q) ||
          f.resumeName.includes(q) ||
          f.body.includes(q)),
    )
  }, [search, readFilter])

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<MessageSquare />}
          iconClass="bg-accent-bg text-accent-strong"
          value={`${kpis.total}건`}
          label="전체 피드백"
        />
        <StatCard
          icon={<Mail />}
          iconClass="bg-warning-bg text-warning"
          value={`${kpis.unread}건`}
          label="읽지 않음"
        />
        <StatCard
          icon={<MailOpen />}
          iconClass="bg-success-bg text-success"
          value={`${kpis.read}건`}
          label="읽음"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="이름·이력서·내용 검색"
        />
        <FilterPills
          options={READ_FILTERS}
          value={readFilter as ReadFilter}
          onChange={setReadFilter}
        />
      </div>

      {items.length === 0 ? (
        <div className="border-border text-fg-subtle bg-surface rounded-xl border px-4 py-10 text-center text-sm">
          조건에 맞는 피드백이 없습니다
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((f) => (
            <FeedbackCard key={f.id} item={f} />
          ))}
        </div>
      )}
    </div>
  )
}

const TABS = [
  { key: 'roster', label: '이력서 현황' },
  { key: 'feedback', label: '피드백 관리' },
] as const

/**
 * 이력서 관리 (/admin/resume) — 운영 콘솔. 학생 관리 하위.
 * 상위 탭: 이력서 현황(작성 현황 로스터) · 피드백 관리(피드백 목록).
 * 공통: 프로그램 선택 + 기수 탭. 데이터는 ./mocks(목업), BE 연동은 후속.
 */
// embedded=true면 과정·기수·교과목 탭 안에 임베드된 상태(자체 헤더·패딩 생략).
export default function ResumePage({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const [tab, setTab] = useSearchParamState('tab', 'roster')
  const [cohort, setCohort] = useState(ACTIVE_COHORT)
  usePageHeader(
    '이력서 관리',
    '수강생 이력서 현황과 피드백을 관리합니다',
    !embedded,
  )

  return (
    <div
      className={embedded ? 'flex flex-col gap-5' : 'flex flex-col gap-5 p-8'}
    >
      {/* 상위 탭 */}
      <div className="border-divider flex items-center gap-6 border-b">
        {TABS.map((t) => {
          const on = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'relative -mb-px px-1 pb-3 text-[15px]',
                on
                  ? 'text-fg border-fg border-b-2 font-bold'
                  : 'text-fg-subtle hover:text-fg-muted font-semibold',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 프로그램 선택·기수 탭 — 임베드(과정·기수·교과목 탭) 시엔 상위 과정/기수 선택을 쓰므로 숨김 */}
      {!embedded && (
        <>
          <button
            type="button"
            className="text-fg flex items-center gap-2 text-2xl font-bold"
          >
            {PROGRAM}
            <ChevronDown className="text-fg-muted h-5 w-5" />
          </button>

          <div className="border-divider flex items-center gap-1 overflow-x-auto border-b">
            {COHORTS.map((c) => {
              const on = c === cohort
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCohort(c)}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative shrink-0 px-3 py-2.5 text-[14px] font-semibold',
                    on ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
                  )}
                >
                  {c}
                  {on && (
                    <span className="bg-fg absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {tab === 'roster' ? <RosterView embedded={embedded} /> : <FeedbackView />}
    </div>
  )
}
