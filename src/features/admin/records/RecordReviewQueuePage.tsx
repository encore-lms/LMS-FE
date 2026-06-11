import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  MessageSquare,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  RecordCategory,
  RecordDecision,
  RecordReviewItem,
  RecordReviewStatus,
} from '@/shared/types'
import { useRecordReviewAction, useRecordReviewQueue } from '../api/records'
import { CATEGORY_META, PreviewPane, STATUS_META } from './PreviewPane'
import { RECORD_SEGMENT_BY_CATEGORY } from './detailMeta'

type CategoryTab = 'all' | RecordCategory
type StatusFilter = 'all' | RecordReviewStatus

// 학습 기록 검토 큐 (/admin/records/review) — 운영(MANAGER) 1차 검토.
// 블로그·스터디·자격증 제출을 [좌]테이블 + [우]인라인 미리보기로 triage,
// 승인·반려·보완 요청을 한 화면에서 닫는다. (Figma "운영 — 학습 기록 검토 큐" 1507:10816)
export default function RecordReviewQueuePage() {
  const { data, isPending, isError, refetch } = useRecordReviewQueue()
  usePageHeader('학습 기록 검토 큐', '운영 › 학습 기록 검토')
  const navigate = useNavigate()
  const [tab, setTab] = useState<CategoryTab>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const reviewAction = useRecordReviewAction()
  const toast = useToast()

  const items = useMemo(() => data?.items ?? [], [data])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((it) => {
      if (tab !== 'all' && it.category !== tab) return false
      if (status !== 'all' && it.status !== status) return false
      if (needle) {
        const hay = `${it.student.name} ${it.title} ${it.summary}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [items, tab, status, q])

  const selected =
    filtered.find((it) => it.id === selectedId) ?? filtered[0] ?? null

  // 선택이 바뀌면 입력 중이던 사유를 비워 다른 행으로 새어 들어가지 않게 한다.
  useEffect(() => {
    setReason('')
  }, [selected?.id])

  if (isPending) {
    return <div className="text-fg-muted p-8">검토 큐를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="검토 큐를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 결정 — mutation으로 서버(mock) 상태를 실제로 바꾸고, 성공 시 invalidate로 큐 재조회.
  const decide = (d: RecordDecision) => {
    if (!selected) return
    const { id, category, mileageCandidate } = selected
    const name = selected.student.name
    reviewAction.mutate(
      {
        recordId: id,
        category,
        decision: d,
        payload: { studentVisibleComment: reason.trim() },
      },
      {
        onSuccess: () => {
          if (d === 'approve') {
            toast.success(
              `승인 — ${name} · RecordReview.status = approved${
                mileageCandidate ? ' · 마일리지 지급 후보 생성' : ''
              }`,
            )
          } else if (d === 'changes') {
            toast.warning(`보완 요청 — ${name} · 학생에게 알림 발송`)
          } else {
            toast.danger(`반려 — ${name} · 사유 코멘트 학생에게 발송`)
          }
          setSelectedId(null)
          setReason('')
        },
        onError: () =>
          toast.danger('처리에 실패했어요 — 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  const tabs: { key: CategoryTab; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: data.pendingTotal },
    { key: 'blog', label: '블로그', count: data.byCategory.blog },
    { key: 'study', label: '스터디', count: data.byCategory.study },
    { key: 'certificate', label: '자격증', count: data.byCategory.certificate },
  ]

  const columns: Column<RecordReviewItem>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-44',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.student.name} size={30} />
          <div className="flex flex-col">
            <span className="text-fg font-medium">{r.student.name}</span>
            <span className="text-fg-subtle text-xs">{r.student.cohort}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: '카테',
      className: 'w-20',
      cell: (r) => <StatusBadge label={CATEGORY_META[r.category].label} />,
    },
    {
      key: 'title',
      header: '제목·요약',
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-fg font-medium">{r.title}</span>
            {r.noteCount > 0 && (
              <span className="text-fg-subtle inline-flex items-center gap-0.5 text-[11px]">
                <MessageSquare className="h-3 w-3" />
                {r.noteCount}
              </span>
            )}
          </div>
          <span className="text-fg-subtle text-xs">{r.summary}</span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: '제출',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-xs whitespace-nowrap">
          {r.submittedAt.slice(5)}
        </span>
      ),
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
      className: 'w-28',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <span
            title="승인"
            className="bg-success-bg text-success inline-flex h-6 w-6 items-center justify-center rounded-md"
          >
            <Check className="h-3.5 w-3.5" />
          </span>
          <span
            title="보완 요청"
            className="bg-warning-bg text-warning inline-flex h-6 w-6 items-center justify-center rounded-md"
          >
            <AlertCircle className="h-3.5 w-3.5" />
          </span>
          <span
            title="반려"
            className="bg-danger-bg text-danger inline-flex h-6 w-6 items-center justify-center rounded-md"
          >
            <XCircle className="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              // 검토 상세 3종 — certificate(단수)→certificates(복수) 세그먼트 매핑
              navigate(
                `/admin/records/${RECORD_SEGMENT_BY_CATEGORY[r.category]}/${r.id}`,
              )
            }}
            className="border-border text-fg-muted hover:bg-surface-muted ml-1 rounded-md border px-2 py-1 text-xs font-medium"
          >
            상세
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-brand flex items-center justify-between gap-4 rounded-xl px-6 py-5 text-white">
        <div>
          <p className="font-bold">
            블로그·스터디·자격증 1차 검토 — 승인·반려·보완 요청
          </p>
          <p className="mt-1 text-sm text-white/80">
            기수 {data.cohort} · 담당 강사 {data.instructor} · MANAGER 전용 ·
            1차 검토 단독 권한
          </p>
        </div>
        <div className="flex shrink-0 gap-6 text-right">
          <div>
            <p className="text-xs text-white/70">처리 대기</p>
            <p className="text-2xl font-bold">{data.pendingTotal}</p>
            <p className="text-[11px] text-white/60">승인·반려·보완 필요</p>
          </div>
          <div>
            <p className="text-xs text-white/70">이번 주 처리</p>
            <p className="text-2xl font-bold">{data.weekProcessed}</p>
            <p className="text-[11px] text-white/60">
              평균 {data.avgHours}시간
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="검토 대기"
          value={data.pendingTotal}
          hint={`미배정 ${data.unassigned} · 24h 초과 ${data.over24h}`}
        />
        <KpiCard
          label="보완 요청 중"
          value={data.changesRequested}
          tone="warning"
          hint="재제출 대기"
        />
        <KpiCard
          label="오늘 승인"
          value={data.approvedToday}
          tone="success"
          hint={`지급 후보 ${data.payoutCandidates}건`}
        />
        <KpiCard
          label="이번 주 반려"
          value={data.rejectedThisWeek}
          tone="danger"
          hint="사유 코멘트 첨부"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                tab === t.key
                  ? 'bg-accent-bg text-accent-strong'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {t.label} <span className="text-fg-subtle">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="상태 필터"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="all">상태 전체</option>
            <option value="pending">대기</option>
            <option value="changes_requested">보완 요청</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="수강생·제목 검색"
            aria-label="학습 기록 검토 검색"
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedId(r.id)}
            rowClassName={(r) =>
              r.id === selected?.id ? 'bg-accent-bg/40' : ''
            }
            empty="조건에 맞는 검토 건이 없어요"
          />
          <div className="text-fg-subtle mt-3 flex items-center justify-between text-xs">
            <span>
              총 {data.pendingTotal}건 · 24h 초과 {data.over24h}건
            </span>
            <span>1 / {Math.max(1, Math.ceil(data.pendingTotal / 6))}</span>
          </div>
        </div>

        <PreviewPane
          item={selected}
          reason={reason}
          onReason={setReason}
          onDecide={decide}
        />
      </div>

      <div className="border-border bg-info-bg mt-8 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">검토 정책 · §22 완료 기준</p>
        <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-xs">
          <li>
            • 1차 검토 권한은 MANAGER 단독 (강사 §13 화면은 조회 전용 — 강사
            코멘트는 참고용 표시)
          </li>
          <li>
            • 승인 시 RecordReview.status = approved · Record.status 갱신 ·
            자격증·일부 카테고리는 마일리지 지급 후보 생성
          </li>
          <li>
            • 반려·보완 요청 시 사유 코멘트 필수 — 학생에게 알림 발송 (수강생
            보완 요청 상세에 동일 표시)
          </li>
        </ul>
      </div>
    </div>
  )
}
