import { useMemo, useState } from 'react'
import { AlertTriangle, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import type {
  InstructorRecordCategory,
  InstructorRecordRow,
  InstructorRecordStatus,
} from '@/shared/types'
import { useRecordReviews } from '../api/reviews'
import { QueueFilterBar, QueueStats } from './QueueShell'

type CategoryFilter = 'all' | InstructorRecordCategory

const CATEGORY_LABEL: Record<InstructorRecordCategory, string> = {
  blog: '블로그',
  study: '스터디',
  cert: '자격증',
}

const STATUS_META: Record<
  InstructorRecordStatus,
  { label: string; tone: BadgeTone; action: string }
> = {
  pending: { label: '대기', tone: 'warning', action: '상세' },
  changes_requested: { label: '보완 요청', tone: 'danger', action: '확인' },
  approved: { label: '승인', tone: 'success', action: '결과' },
  rejected: { label: '반려', tone: 'neutral', action: '사유' },
}

// 학습 기록 조회 (/instructor/records/review) — §13. (Figma 1422:10009)
// 조회 전용 큐 — 승인·반려·보완요청은 /admin/records/review 매니저 단독.
export default function RecordReviewPage() {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useRecordReviews()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  usePageHeader(
    '학습 기록 조회',
    '담당 기수 기록 제출·검토 현황 조회 — 승인·반려는 운영 매니저가 처리',
  )

  const filtered = useMemo(() => {
    const rows = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (category !== 'all' && r.category !== category) return false
      if (needle && !r.studentName.toLowerCase().includes(needle)) return false
      return true
    })
  }, [data, q, category])

  if (isPending) {
    return <div className="text-fg-muted p-8">기록 현황을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="기록 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const columns: Column<InstructorRecordRow>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-36',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.studentName}</p>
          <p className="text-fg-subtle text-xs">{r.cohortLabel}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
      className: 'w-24',
      cell: (r) => (
        <StatusBadge label={CATEGORY_LABEL[r.category]} tone="info" />
      ),
    },
    {
      key: 'title',
      header: '제목·요약',
      cell: (r) => <span className="text-fg text-sm">{r.title}</span>,
    },
    {
      key: 'submittedAt',
      header: '제출 시각',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-sm">{r.submittedAt ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: '매니저 상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'attachments',
      header: '첨부',
      className: 'w-20',
      cell: (r) =>
        r.attachments === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <span className="text-fg-muted flex items-center gap-1 text-sm">
            <Paperclip className="h-3.5 w-3.5" /> {r.attachments}
          </span>
        ),
    },
    {
      key: 'actions',
      header: '보기',
      className: 'w-32',
      cell: (r) => (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toast.info(
                `${r.title} ${STATUS_META[r.status].action} — 후속 화면 (mock)`,
              )
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
          >
            {STATUS_META[r.status].action}
          </button>
          {r.status !== 'pending' && r.status !== 'rejected' && (
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
          {
            key: 'all' as CategoryFilter,
            label: '전체',
            count: data.counts.all,
          },
          {
            key: 'blog' as CategoryFilter,
            label: '블로그',
            count: data.counts.blog,
          },
          {
            key: 'study' as CategoryFilter,
            label: '스터디',
            count: data.counts.study,
          },
          {
            key: 'cert' as CategoryFilter,
            label: '자격증',
            count: data.counts.cert,
          },
        ]}
        active={category}
        onTab={setCategory}
      />
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          empty="조건에 맞는 기록이 없어요"
        />
      </div>
      <p className="text-fg-subtle mt-3 text-xs">
        조회 전용 — 승인·반려·보완 요청 처리는 운영
        매니저(/admin/records/review) 단독 권한입니다
      </p>
    </div>
  )
}
