import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Paperclip,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type {
  AttendanceFormReviewStatus,
  AttendanceFormRow,
  AttendanceFormType,
} from '@/shared/types'
import { useStudentAttendanceForms } from '../api/students'

const TYPE_META: Record<
  AttendanceFormType,
  { label: string; tone: BadgeTone }
> = {
  late: { label: '지각', tone: 'warning' },
  early_leave: { label: '조퇴', tone: 'info' },
  absent: { label: '결석', tone: 'danger' },
  outing: { label: '외출', tone: 'info' },
}

const STATUS_META: Record<
  AttendanceFormReviewStatus,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: '대기', tone: 'neutral' },
  approval_pending: { label: '승인 대기', tone: 'info' },
  confirmed: { label: '확정', tone: 'success' },
  changes: { label: '보완 요청', tone: 'warning' },
}

type Filter = 'all' | 'late' | 'early_outing' | 'official_leave'
type Decision = 'approve' | 'changes' | 'reject'

// 우측 검토 패널 — 승인 전 신청 사유·증빙·공가 확인. (Figma "출결 폼 검토")
function ReviewPane({
  row,
  onDecide,
}: {
  row: AttendanceFormRow | null
  onDecide: (d: Decision) => void
}) {
  if (!row) {
    return (
      <div className="border-border bg-surface rounded-xl border">
        <Empty
          title="검토할 출결 폼을 선택하세요"
          description="좌측에서 행을 클릭하면 신청 사유·증빙이 표시됩니다."
        />
      </div>
    )
  }
  const fields = [
    { label: '제출자', value: row.submitter },
    { label: '유형', value: TYPE_META[row.type].label },
    { label: '대상 일자', value: row.targetDate },
    { label: '신청 사유', value: row.reason },
    { label: '공가 사용', value: row.officialLeaveUsed ? '사용' : '미사용' },
    { label: '상태', value: STATUS_META[row.status].label },
  ]
  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border">
      <div className="border-divider border-b p-4">
        <p className="text-fg font-bold">출결 폼 검토</p>
        <p className="text-fg-subtle text-xs">
          승인 전 필요한 근거와 잔여 공가를 확인합니다.
        </p>
      </div>
      <dl className="flex flex-col gap-2.5 p-4">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-3 text-sm">
            <dt className="text-fg-muted w-16 shrink-0 text-xs">{f.label}</dt>
            <dd className="text-fg">{f.value}</dd>
          </div>
        ))}
        <p className="text-fg-subtle mt-1 flex items-center gap-1.5 text-xs">
          <Paperclip className="h-3.5 w-3.5" />
          증빙 파일: {row.evidence} {row.evidenceFiles}개
        </p>
      </dl>
      <div className="border-divider mt-auto flex gap-2 border-t p-4">
        <button
          type="button"
          onClick={() => onDecide('approve')}
          className="bg-success hover:bg-success/90 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold text-white"
        >
          <Check className="h-4 w-4" /> 승인
        </button>
        <button
          type="button"
          onClick={() => onDecide('changes')}
          className="bg-warning-bg text-warning hover:bg-warning-bg/70 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold"
        >
          <AlertCircle className="h-4 w-4" /> 보완 요청
        </button>
        <button
          type="button"
          onClick={() => onDecide('reject')}
          className="bg-danger-bg text-danger hover:bg-danger-bg/70 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold"
        >
          <XCircle className="h-4 w-4" /> 반려
        </button>
      </div>
    </div>
  )
}

// 출결 폼 탭 — 학생 출결 폼 제출을 [좌]테이블 + [우]검토 패널로 승인/보완/반려. (Figma 1457:10955)
export function AttendanceFormTab() {
  const { data, isPending, isError, refetch } = useStudentAttendanceForms()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [processed, setProcessed] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const rows = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (processed.has(r.id)) return false
      if (filter === 'late' && r.type !== 'late') return false
      if (
        filter === 'early_outing' &&
        r.type !== 'early_leave' &&
        r.type !== 'outing'
      )
        return false
      if (filter === 'official_leave' && !r.officialLeaveUsed) return false
      if (needle) {
        const hay = `${r.submitter} ${r.reason}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, filter, q, processed])

  const selected =
    filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="출결 폼을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { summary } = data
  const decide = (d: Decision) => {
    if (!selected) return
    const name = selected.submitter
    if (d === 'approve') toast.success(`승인 — ${name} 출결 폼 확정`)
    else if (d === 'changes') toast.warning(`보완 요청 — ${name}에게 알림 발송`)
    else toast.danger(`반려 — ${name} 출결 폼 반려`)
    setProcessed((p) => new Set(p).add(selected.id))
    setSelectedId(null)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'late', label: '지각' },
    { key: 'early_outing', label: '조퇴·외출' },
    { key: 'official_leave', label: '공가 포함' },
  ]

  const columns: Column<AttendanceFormRow>[] = [
    {
      key: 'submitter',
      header: '제출자',
      className: 'w-28',
      cell: (r) => <span className="text-fg font-medium">{r.submitter}</span>,
    },
    {
      key: 'date',
      header: '대상 일자',
      className: 'w-24',
      cell: (r) => (
        <span className="text-fg-muted">{r.targetDate.slice(5)}</span>
      ),
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-20',
      cell: (r) => (
        <StatusBadge
          label={TYPE_META[r.type].label}
          tone={TYPE_META[r.type].tone}
        />
      ),
    },
    {
      key: 'leave',
      header: '공가',
      className: 'w-16',
      cell: (r) => (
        <span className="text-fg-muted text-xs">
          {r.officialLeaveUsed ? '사용' : '미사용'}
        </span>
      ),
    },
    {
      key: 'evidence',
      header: '증빙',
      cell: (r) => <span className="text-fg-muted text-xs">{r.evidence}</span>,
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-20',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(r.id)
          }}
          className="text-brand text-xs font-medium hover:underline"
        >
          검토
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="전체 제출"
          value={summary.totalSubmitted}
          hint="이번 주"
        />
        <KpiCard label="지각" value={summary.late} tone="warning" hint="대기" />
        <KpiCard
          label="조퇴·외출"
          value={summary.earlyLeaveOuting}
          tone="info"
          hint="승인 대기"
        />
        <KpiCard
          label="결석"
          value={summary.absent}
          tone="danger"
          hint="증빙 확인"
        />
        <KpiCard
          label="공가 사용"
          value={summary.officialLeaveUsed}
          tone="success"
          hint="잔여일 확인"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                filter === f.key
                  ? 'bg-accent-bg text-accent-strong'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제출자·사유 검색"
          aria-label="출결 폼 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedId(r.id)}
            rowClassName={(r) =>
              r.id === selected?.id ? 'bg-accent-bg/40' : ''
            }
            empty="조건에 맞는 출결 폼이 없어요"
          />
          <div className="text-fg-subtle mt-3 text-xs">
            총 {filtered.length}건 · 전체 제출 {summary.totalSubmitted}
          </div>
        </div>
        <ReviewPane row={selected} onDecide={decide} />
      </div>
    </>
  )
}
