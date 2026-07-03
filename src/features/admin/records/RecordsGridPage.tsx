import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/shared/api'
import { cn } from '@/shared/lib/cn'
import type { RecordEvidenceImage } from '@/shared/types'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type {
  RecordCategory,
  RecordDecision,
  RecordGridRow,
} from '@/shared/types'
import {
  useAdminCertificates,
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
  const [category, setCategory] = useSearchParamState('category', 'blog')
  const [q, setQ] = useSearchParamState('q')
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

  const nameOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of students?.items ?? []) m.set(s.id, s.name)
    return (id: string) => m.get(id) || '(이름 미확인)'
  }, [students])

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
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-72 rounded-lg border px-3 text-sm outline-none"
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
                  ? 'text-fg bg-surface shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {category === 'certificate' ? (
        <CertList cohortId={cohortId} nameOf={nameOf} q={q} />
      ) : isPending ? (
        <div className="text-fg-muted py-16 text-center">불러오는 중…</div>
      ) : isError ? (
        <Empty
          icon={<AlertTriangle />}
          title="제출 현황을 불러오지 못했어요"
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
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
                  <td className="bg-surface sticky left-0 z-10 min-w-40 px-4 py-2.5">
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
          category={category as RecordCategory}
          recordId={reviewId}
          nameOf={nameOf}
          onClose={() => setReviewId(null)}
        />
      )}
    </div>
  )
}

// 자격증 탭 — 주차 무관, 수강생별 자격증 제출 목록 + 검토(이전 LMS CertificateReviewView).
const CERT_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: '승인', cls: 'bg-success-bg text-success' },
  pending: { label: '검토 중', cls: 'bg-warning-bg text-warning' },
  rejected: { label: '반려·보완', cls: 'bg-danger-bg text-danger' },
}
function CertList({
  cohortId,
  nameOf,
  q,
}: {
  cohortId: string
  nameOf: (id: string) => string
  q: string
}) {
  const { data, isPending, isError, refetch } = useAdminCertificates(cohortId)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const needle = q.trim()
  const items = (data ?? []).filter(
    (c) => !needle || nameOf(c.studentUserId).includes(needle),
  )

  if (isPending) {
    return <div className="text-fg-muted py-16 text-center">불러오는 중…</div>
  }
  if (isError) {
    return (
      <Empty
        icon={<AlertTriangle />}
        title="자격증 제출을 불러오지 못했어요"
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }
  if (items.length === 0) {
    return (
      <Empty
        icon={<AlertTriangle />}
        title="자격증 제출이 없어요"
        description="수강생이 자격증을 제출하면 여기에서 검토합니다."
      />
    )
  }

  return (
    <>
      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted text-fg-subtle">
              <th className="px-4 py-3 text-left font-semibold">수강생</th>
              <th className="px-4 py-3 text-left font-semibold">자격증</th>
              <th className="px-4 py-3 text-left font-semibold">취득일</th>
              <th className="px-4 py-3 text-left font-semibold">제출</th>
              <th className="px-4 py-3 text-center font-semibold">상태</th>
              <th className="px-4 py-3 text-right font-semibold">검토</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const st = CERT_STATUS[c.status] ?? CERT_STATUS.pending
              return (
                <tr key={c.recordId} className="border-border border-t">
                  <td className="text-fg px-4 py-2.5 font-medium">
                    {nameOf(c.studentUserId)}
                  </td>
                  <td className="text-fg px-4 py-2.5">{c.certificateName}</td>
                  <td className="text-fg-muted px-4 py-2.5">{c.acquiredAt}</td>
                  <td className="text-fg-muted px-4 py-2.5 text-xs">
                    {c.submittedAt}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-bold',
                        st.cls,
                      )}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setReviewId(c.recordId)}
                      className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-3 py-1 text-xs font-semibold"
                    >
                      검토
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {reviewId && (
        <ReviewModal
          category="certificate"
          recordId={reviewId}
          nameOf={nameOf}
          onClose={() => setReviewId(null)}
        />
      )}
    </>
  )
}

// 셀 클릭 검토 — 상세 + 승인/보완/반려(BE 폐루프 재활용).
const REVIEW_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: '승인', cls: 'bg-success-bg text-success' },
  pending: { label: '검토 중', cls: 'bg-warning-bg text-warning' },
  changes_requested: { label: '보완 요청', cls: 'bg-warning-bg text-warning' },
  rejected: { label: '반려', cls: 'bg-danger-bg text-danger' },
}
function ReviewModal({
  category,
  recordId,
  nameOf,
  onClose,
}: {
  category: RecordCategory
  recordId: string
  nameOf: (id: string) => string
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

  const st = data ? (REVIEW_STATUS[data.status] ?? REVIEW_STATUS.pending) : null

  // 이전 LMS BlogReviewPanel — 우측 슬라이드 패널 + 블로그 iframe 미리보기.
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <aside
        className="bg-surface flex h-full w-[760px] max-w-[92vw] flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending || !data || !st ? (
          <div className="text-fg-muted flex flex-1 items-center justify-center">
            불러오는 중…
          </div>
        ) : (
          <>
            {/* 헤더 — 학생명·라벨·상태·새 탭·닫기 */}
            <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-fg text-base font-bold">
                    {nameOf(data.studentUserId)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-bold',
                      st.cls,
                    )}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="text-fg-subtle mt-0.5 truncate text-xs">
                  {data.submissionLabel} · {data.submittedAt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {data.category === 'blog' && data.externalUrl && (
                  <a
                    href={data.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-semibold"
                  >
                    새 탭 ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-fg-subtle hover:bg-surface-muted hover:text-fg rounded-md px-2 py-1 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* URL 바(블로그) */}
            {data.category === 'blog' && data.externalUrl && (
              <div className="border-border bg-surface-muted text-fg-subtle flex items-center gap-2 border-b px-5 py-2 text-xs">
                <span className="truncate">{data.externalUrl}</span>
              </div>
            )}

            {/* 본문 — 블로그는 iframe 미리보기, 그 외는 내용 */}
            <div className="flex-1 overflow-auto">
              {data.category === 'blog' ? (
                <div className="relative h-full min-h-[420px]">
                  <iframe
                    src={data.externalUrl}
                    title="블로그 미리보기"
                    className="h-full w-full"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                  <p className="text-fg-subtle bg-surface/90 pointer-events-none absolute right-2 bottom-2 rounded px-2 py-1 text-[11px]">
                    미리보기가 보이지 않으면 우측 상단 “새 탭 ↗”으로 확인
                  </p>
                </div>
              ) : data.category === 'study' ? (
                <div className="space-y-3 p-5">
                  <div className="text-fg-subtle text-xs">
                    활동 시간 {data.activityHours ?? 0}시간 · 연속{' '}
                    {data.streakCount ?? 0}회
                  </div>
                  <p className="text-fg text-sm whitespace-pre-wrap">
                    {data.activityNote || '활동 내용이 없습니다.'}
                  </p>
                  <EvidenceGallery images={data.evidenceImages} />
                </div>
              ) : (
                <div className="space-y-2 p-5 text-sm">
                  <p className="text-fg font-semibold">
                    {data.submissionLabel}
                  </p>
                  {data.policyNote && (
                    <p className="text-fg-muted">{data.policyNote}</p>
                  )}
                  <EvidenceGallery images={data.evidenceImages} />
                </div>
              )}
            </div>

            {/* 푸터 — 메모 + 승인/보완/반려 */}
            <div className="border-border border-t p-4">
              <label className="text-fg-muted mb-1 block text-xs font-semibold">
                검토 메모 (보완·반려 시 필수, 수강생에게 노출)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="예) URL이 비공개 상태입니다. 공개로 전환해 재제출해 주세요."
                className="border-border focus:border-brand bg-surface w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
              />
              <div className="mt-3 flex justify-end gap-2">
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
                  className="bg-success text-on-color rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
                >
                  승인
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

// 증빙 이미지 — 다운로드가 인증 필요(/admin/records/files/:id)라 blob fetch 후 objectURL로 표시.
function EvidenceImg({ url }: { url: string }) {
  const [src, setSrc] = useState('')
  const [err, setErr] = useState(false)
  useEffect(() => {
    let active = true
    let obj = ''
    apiClient
      .getBlob(url)
      .then((blob) => {
        if (!active) return
        obj = URL.createObjectURL(blob)
        setSrc(obj)
      })
      .catch(() => active && setErr(true))
    return () => {
      active = false
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [url])
  if (err)
    return (
      <div className="border-border text-fg-subtle flex h-28 items-center justify-center rounded-lg border text-xs">
        불러오기 실패
      </div>
    )
  if (!src)
    return <div className="bg-surface-muted h-28 animate-pulse rounded-lg" />
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img
        src={src}
        alt="증빙"
        className="border-border h-28 w-full rounded-lg border object-cover"
      />
    </a>
  )
}

function EvidenceGallery({ images }: { images?: RecordEvidenceImage[] }) {
  if (!images || images.length === 0) return null
  return (
    <div>
      <p className="text-fg-muted mb-2 text-xs font-semibold">
        증빙 이미지 {images.length}장
      </p>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <EvidenceImg key={img.id} url={img.url} />
        ))}
      </div>
    </div>
  )
}
