import { useMemo, useState } from 'react'
import { AlertTriangle, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type {
  AttendanceFormLink,
  HrdAttendanceStatus,
  StudentAttendanceRow,
} from '@/shared/types'
import { useStudentAttendance } from '../api/students'

const HRD_META: Record<HrdAttendanceStatus, { label: string; cls: string }> = {
  normal: { label: '정상', cls: 'text-success' },
  late: { label: '지각', cls: 'text-warning' },
  absent: { label: '결석', cls: 'text-danger' },
  early_leave: { label: '조퇴', cls: 'text-info' },
  leave_missing: { label: '퇴실 누락', cls: 'text-accent-strong' },
}

const FORM_LINK_LABEL: Record<AttendanceFormLink, string> = {
  none: '-',
  submitted: '제출됨',
  not_submitted: '미제출',
  pending: '승인 대기',
}

function actionLabel(r: StudentAttendanceRow): string {
  if (r.hrdStatus === 'leave_missing') return '확인'
  if (r.formLink === 'not_submitted') return '요청'
  if (r.formLink === 'submitted' || r.formLink === 'pending') return '검토'
  return '상세'
}

// 우측 검증 패널 — HRD 원본과 내부 사유 폼 대조. (Figma "출결 검증 패널")
function VerifyPane({
  row,
  onSync,
  onMemo,
}: {
  row: StudentAttendanceRow | null
  onSync: () => void
  onMemo: () => void
}) {
  if (!row) {
    return (
      <div className="border-border bg-surface rounded-xl border">
        <Empty
          title="검증할 출결 행을 선택하세요"
          description="좌측에서 행을 클릭하면 HRD 대조 결과가 표시됩니다."
        />
      </div>
    )
  }
  const fields = [
    { label: '불일치 유형', value: row.verify.mismatchType },
    { label: '추천 처리', value: row.verify.recommendedAction },
    { label: '필요 증빙', value: row.verify.evidenceNeeded },
    { label: '담당자', value: row.verify.assignee },
  ]
  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border">
      <div className="border-divider border-b p-4">
        <p className="text-fg font-bold">출결 검증 패널</p>
        <p className="text-fg-subtle text-xs">
          HRD 원본과 내부 사유 폼을 대조합니다.
        </p>
        <p className="text-info mt-2 flex items-center gap-1 text-xs font-medium">
          <Lock className="h-3 w-3" />
          HRD-Net 원본은 읽기 전용입니다.
        </p>
      </div>
      <dl className="flex flex-col gap-2.5 p-4">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-3 text-sm">
            <dt className="text-fg-muted w-20 shrink-0 text-xs">{f.label}</dt>
            <dd className="text-fg">{f.value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-divider mt-auto flex gap-2 border-t p-4">
        <Button onClick={onSync} className="flex-1">
          <RefreshCw className="h-4 w-4" /> 재동기화
        </Button>
        <Button variant="secondary" onClick={onMemo} className="flex-1">
          정정 메모
        </Button>
      </div>
    </div>
  )
}

// 출결 탭 — HRD 출결 관제 [좌]테이블 + [우]검증 패널. (Figma 1457:10799)
export function AttendanceTab() {
  const { data, isPending, isError, refetch } = useStudentAttendance()
  const toast = useToast()
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const rows = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (onlyIssues && r.hrdStatus === 'normal') return false
      if (needle) {
        const hay =
          `${r.studentName} ${HRD_META[r.hrdStatus].label}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, onlyIssues, q])

  const selected =
    filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="출결 현황을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { summary, cohortLabel } = data

  const columns: Column<StudentAttendanceRow>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-32',
      cell: (r) => <span className="text-fg font-medium">{r.studentName}</span>,
    },
    {
      key: 'in',
      header: '입실',
      className: 'w-20',
      cell: (r) => <span className="text-fg-muted">{r.checkIn ?? '-'}</span>,
    },
    {
      key: 'out',
      header: '퇴실',
      className: 'w-20',
      cell: (r) => <span className="text-fg-muted">{r.checkOut ?? '-'}</span>,
    },
    {
      key: 'hrd',
      header: 'HRD 상태',
      className: 'w-28',
      cell: (r) => (
        <span className={cn('text-sm font-medium', HRD_META[r.hrdStatus].cls)}>
          {HRD_META[r.hrdStatus].label}
        </span>
      ),
    },
    {
      key: 'form',
      header: '출결 폼',
      className: 'w-24',
      cell: (r) => (
        <span className="text-fg-muted text-xs">
          {FORM_LINK_LABEL[r.formLink]}
        </span>
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
          {actionLabel(r)}
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="출석"
          value={summary.present}
          tone="success"
          hint="오늘 정상 입실"
        />
        <KpiCard
          label="지각"
          value={summary.late}
          tone="warning"
          hint="사유 미제출 3건"
        />
        <KpiCard
          label="조퇴·외출"
          value={summary.earlyLeaveOuting}
          tone="info"
          hint="승인 대기 2건"
        />
        <KpiCard
          label="결석"
          value={summary.absent}
          tone="danger"
          hint="공가 후보 1건"
        />
        <KpiCard
          label="HRD 불일치"
          value={summary.hrdMismatch}
          tone="accent"
          hint="재동기화 필요"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          <span className="bg-accent-bg text-accent-strong rounded-md px-3 py-1.5 text-sm font-medium">
            {cohortLabel}
          </span>
          <button
            type="button"
            onClick={() => setOnlyIssues(false)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              !onlyIssues
                ? 'bg-surface-muted text-fg'
                : 'text-fg-muted hover:bg-surface-muted',
            )}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => setOnlyIssues(true)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              onlyIssues
                ? 'bg-surface-muted text-fg'
                : 'text-fg-muted hover:bg-surface-muted',
            )}
          >
            이상만
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름·출결 상태 검색"
          aria-label="출결 검색"
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
            empty="조건에 맞는 출결 행이 없어요"
          />
          <div className="text-fg-subtle mt-3 text-xs">
            총 {filtered.length}건
          </div>
        </div>
        <VerifyPane
          row={selected}
          onSync={() =>
            selected &&
            toast.success(
              `${selected.studentName} · HRD 재동기화 요청 — 처리 중`,
            )
          }
          onMemo={() =>
            selected &&
            toast.info(`${selected.studentName} · 정정 메모 — 감사 로그 기록`)
          }
        />
      </div>
    </>
  )
}
