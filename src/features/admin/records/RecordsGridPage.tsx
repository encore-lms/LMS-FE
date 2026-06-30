import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  RecordCategory,
  RecordDecision,
  RecordGridRow,
} from '@/shared/types'
import {
  useRecordReviewAction,
  useRecordSubmissionDetail,
  useRecordsGrid,
} from '../api/records'
import { useStudentAccounts } from '../api/students'

// 운영 기록실 — 수강생 × 주차 제출 현황 그리드(이전 LMS RecordsGridView).
// 블로그/스터디/자격증 탭, 셀(dot) 클릭 시 해당 제출을 검토(승인/보완/반려)한다.
// embedded=true면 과정·기수·교과목 '기록실' 탭에 임베드(헤더·패딩 생략).
const CATEGORY_TABS: { key: RecordCategory; label: string }[] = [
  { key: 'blog', label: '블로그' },
  { key: 'study', label: '스터디' },
  { key: 'certificate', label: '자격증' },
]

// 제출 상태 dot 색 — 제출(승인/검토중)=초록 계열, 반려=빨강, 미제출=회색.
const DOT: Record<string, string> = {
  approved: 'bg-success',
  pending: 'bg-success/45',
  rejected: 'bg-danger',
  none: 'bg-border',
}
const DOT_TITLE: Record<string, string> = {
  approved: '승인',
  pending: '검토 중',
  rejected: '반려·보완',
  none: '미제출',
}

export default function RecordsGridPage({
  embedded = false,
  cohortId = null,
}: {
  embedded?: boolean
  cohortId?: string | null
}) {
  usePageHeader('학습 기록', '운영 › 학습 기록 검토', !embedded)
  const [category, setCategory] = useState<RecordCategory>('blog')
  const [q, setQ] = useState('')
  const [reviewId, setReviewId] = useState<string | null>(null)

  const {
    data: grid,
    isPending,
    isError,
    refetch,
  } = useRecordsGrid(category, cohortId)
  const { data: students } = useStudentAccounts(cohortId)

  const byStudent = useMemo(() => {
    const m = new Map<string, RecordGridRow>()
    for (const r of grid?.rows ?? []) m.set(r.studentUserId, r)
    return m
  }, [grid])

  const weeks = grid?.weeks ?? []

  const rows = useMemo(() => {
    const needle = q.trim()
    return (students?.items ?? [])
      .filter((s) => !needle || s.name.includes(needle))
      .map((s) => {
        const g = byStudent.get(s.id)
        return {
          id: s.id,
          name: s.name,
          birth: s.birthDate,
          cells: g?.cells ?? {},
          recordIds: g?.recordIds ?? {},
          approved: g?.approved ?? 0,
          total: weeks.length,
        }
      })
  }, [students, byStudent, weeks, q])

  if (!cohortId) {
    return (
      <div className={embedded ? '' : 'p-8'}>
        <Empty
          icon={<AlertTriangle />}
          title="기수를 선택해 주세요"
          description="상단에서 과정·기수를 선택하면 제출 현황이 표시됩니다."
        />
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'p-8'}>
      {/* 검색 + 카테고리 탭 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름으로 검색"
          aria-label="수강생 이름 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-72 rounded-lg border bg-white px-3 text-sm outline-none"
        />
        <div className="bg-surface-muted flex gap-1 rounded-lg p-1">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setCategory(t.key)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-semibold',
                category === t.key
                  ? 'text-fg bg-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="text-fg-muted py-16 text-center">불러오는 중…</div>
      ) : isError ? (
        <Empty
          icon={<AlertTriangle />}
          title="제출 현황을 불러오지 못했어요"
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      ) : category !== 'blog' ? (
        <Empty
          icon={<AlertTriangle />}
          title={`${CATEGORY_TABS.find((t) => t.key === category)?.label} 그리드는 준비 중이에요`}
          description="블로그 주차 제출 현황을 먼저 제공합니다."
        />
      ) : rows.length === 0 ? (
        <Empty
          icon={<AlertTriangle />}
          title="이 기수에 배정된 수강생이 없어요"
          description="HRD 동기화로 수강생을 등록하면 표시됩니다."
        />
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted">
                <th className="bg-surface-muted text-fg-subtle sticky left-0 z-10 min-w-40 px-4 py-3 text-left font-semibold">
                  수강생
                </th>
                {weeks.map((w) => (
                  <th
                    key={w.no}
                    className="text-fg-subtle px-2 py-3 text-center text-xs font-medium whitespace-nowrap"
                  >
                    {w.label}
                  </th>
                ))}
                <th className="text-fg-subtle px-4 py-3 text-center font-semibold">
                  완주
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-border border-t">
                  <td className="sticky left-0 z-10 min-w-40 bg-white px-4 py-2.5">
                    <div className="text-fg font-medium">{r.name}</div>
                    {r.birth && r.birth !== '-' && (
                      <div className="text-fg-subtle text-xs">{r.birth}</div>
                    )}
                  </td>
                  {weeks.map((w) => {
                    const st = r.cells[String(w.no)] ?? 'none'
                    const rid = r.recordIds[String(w.no)]
                    return (
                      <td key={w.no} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          title={`${w.label} · ${DOT_TITLE[st]}`}
                          disabled={!rid}
                          onClick={() => rid && setReviewId(rid)}
                          className={cn(
                            'inline-block size-6 rounded-md',
                            DOT[st],
                            rid
                              ? 'hover:ring-brand/40 cursor-pointer ring-offset-1 hover:ring-2'
                              : 'cursor-default',
                          )}
                        />
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5 text-center">
                    <span className="bg-accent-bg text-accent-strong inline-block rounded-full px-2.5 py-1 text-xs font-bold">
                      {r.approved}/{r.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewId && (
        <ReviewModal
          category={category}
          recordId={reviewId}
          onClose={() => setReviewId(null)}
        />
      )}
    </div>
  )
}

// 셀 클릭 검토 — 상세 + 승인/보완/반려(BE 폐루프 재활용).
function ReviewModal({
  category,
  recordId,
  onClose,
}: {
  category: RecordCategory
  recordId: string
  onClose: () => void
}) {
  const { data, isPending } = useRecordSubmissionDetail(category, recordId)
  const action = useRecordReviewAction()
  const [reason, setReason] = useState('')
  const toast = useToast()

  const decide = (d: RecordDecision) => {
    action.mutate(
      {
        recordId,
        category,
        decision: d,
        payload: { studentVisibleComment: reason.trim() },
      },
      {
        onSuccess: () => {
          toast.success(
            d === 'approve'
              ? '승인 처리했습니다.'
              : d === 'changes'
                ? '보완 요청을 보냈습니다.'
                : '반려 처리했습니다.',
          )
          onClose()
        },
        onError: () =>
          toast.danger('처리에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }
  const reasonRequired = !reason.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending || !data ? (
          <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-fg text-lg font-bold">
                {data.submissionLabel}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-fg-subtle hover:text-fg text-sm"
              >
                닫기
              </button>
            </div>
            <p className="text-fg-subtle mb-4 text-sm">
              {data.student.cohort} · {data.submittedAt}
            </p>

            {data.category === 'blog' && (
              <a
                href={data.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand block truncate text-sm underline"
              >
                {data.externalUrl}
              </a>
            )}
            {data.category === 'study' && (
              <p className="text-fg text-sm whitespace-pre-wrap">
                {data.activityNote}
              </p>
            )}
            {data.category === 'certificate' && (
              <p className="text-fg text-sm">{data.submissionLabel}</p>
            )}

            <label className="text-fg-muted mt-5 mb-1 block text-xs font-semibold">
              검토 메모 (보완·반려 시 필수, 수강생에게 노출)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="예) URL이 비공개 상태입니다. 공개로 전환해 재제출해 주세요."
              className="border-border focus:border-brand w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={reasonRequired || action.isPending}
                onClick={() => decide('reject')}
                className="bg-danger-bg text-danger rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                반려
              </button>
              <button
                type="button"
                disabled={reasonRequired || action.isPending}
                onClick={() => decide('changes')}
                className="bg-warning-bg text-warning rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                보완 요청
              </button>
              <button
                type="button"
                disabled={action.isPending}
                onClick={() => decide('approve')}
                className="bg-success rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                승인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
