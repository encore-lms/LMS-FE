import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import type { TsReviewRow, TsReviewStatus } from '@/shared/types'
import { useTsReviews } from '../api/reviews'
import { QueueFilterBar, QueueStats } from './QueueShell'

type StatusFilter = 'all' | TsReviewStatus

const STATUS_META: Record<
  TsReviewStatus,
  { label: string; tone: BadgeTone; action: string }
> = {
  pending: { label: '검토 대기', tone: 'warning', action: '인증' },
  supplementing: { label: '보완 중', tone: 'danger', action: '확인' },
  certified: { label: '인증 완료', tone: 'success', action: '결과' },
}

// 트러블슈팅 검토 (/instructor/troubleshooting/review) — §15. (Figma 1422:10543)
// STAR 사례 인증 큐 — 인증 시 TroubleshootingCertification 생성, 인증 후 직접 수정 불가(§12 변경 제안 분리).
export default function TsReviewPage() {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useTsReviews()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  usePageHeader(
    '트러블슈팅 검토',
    'STAR 사례 인증 큐 — 독립해결·소요일수 근거 확인 후 인증',
  )

  const filtered = useMemo(() => {
    const rows = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (needle && !r.studentName.toLowerCase().includes(needle)) return false
      return true
    })
  }, [data, q, status])

  if (isPending) {
    return <div className="text-fg-muted p-8">사례 큐를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="사례 큐를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const columns: Column<TsReviewRow>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-32',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.studentName}</p>
          <p className="text-fg-subtle text-xs">{r.cohortLabel}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: '사례 제목',
      cell: (r) => <StatusBadge label={r.title} tone="neutral" />,
    },
    {
      key: 'category',
      header: '카테고리',
      className: 'w-28',
      cell: (r) => <span className="text-fg-muted text-sm">{r.category}</span>,
    },
    {
      key: 'solved',
      header: '독립해결·소요',
      className: 'w-32',
      cell: (r) =>
        r.solvedBy === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <div>
            <p className="text-fg text-sm font-medium">{r.solvedBy}</p>
            <p className="text-fg-subtle text-xs">{r.durationDays}</p>
          </div>
        ),
    },
    {
      key: 'project',
      header: '발표 프로젝트',
      className: 'w-32',
      cell: (r) =>
        r.project === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <StatusBadge label={r.project} tone="neutral" />
        ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-32',
      cell: (r) => (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (r.status === 'pending')
                toast.success(
                  `${r.title} 인증 — TroubleshootingCertification 생성 (mock)`,
                )
              else
                toast.info(
                  `${r.title} ${STATUS_META[r.status].action} — 후속 화면 (mock)`,
                )
            }}
            className={
              r.status === 'pending'
                ? 'bg-brand-deep rounded-md px-2.5 py-1 text-xs font-bold text-white'
                : 'border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium'
            }
          >
            {STATUS_META[r.status].action}
          </button>
          {!(r.status === 'certified' && r.solvedBy === null) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.info(`${r.title} 상세 — 후속 화면 (mock)`)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
            >
              상세
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <QueueStats stats={data.stats} />
      <QueueFilterBar
        q={q}
        onSearch={setQ}
        searchPlaceholder="이름으로 검색"
        tabs={[
          { key: 'all' as StatusFilter, label: '전체', count: data.counts.all },
          {
            key: 'pending' as StatusFilter,
            label: '검토 대기',
            count: data.counts.pending,
          },
          {
            key: 'supplementing' as StatusFilter,
            label: '보완 중',
            count: data.counts.supplementing,
          },
          {
            key: 'certified' as StatusFilter,
            label: '인증 완료',
            count: data.counts.certified,
          },
        ]}
        active={status}
        onTab={setStatus}
      />
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          empty="조건에 맞는 사례가 없어요"
        />
      </div>
      <p className="text-fg-subtle mt-3 text-xs">
        인증 시 TroubleshootingCertification 기록이 생성되며, 인증 후 학생 직접
        수정은 차단됩니다 (§12 변경 제안 흐름)
      </p>
    </div>
  )
}
