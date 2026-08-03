import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/shared/api'
import type {
  InstructorRecordCategory,
  RecordCategory,
  RecordDecision,
  RecordEvidenceImage,
} from '@/shared/types'
import { useRecordReviewAction, useRecordSubmissionDetail } from './api'

// 매니저 검토 액션 — 공용 RecordDetailPanel(강사 정본) 하단에 주입되는 승인/보완/반려 푸터.
// 증빙 이미지 갤러리는 운영 상세(/admin/records/review/:id)에서 가져와 함께 보여준다
// (그리드 상세는 단일 증빙 URL만 있어, 다중 증빙은 운영 상세가 정본).
// 구 RecordsGridPage(삭제됨)의 검토 모달 푸터·EvidenceGallery를 이식(2026-08-03).

// 그리드 카테고리(cert) → 운영 검토 카테고리(certificate) 매핑.
const CATEGORY_OF: Record<InstructorRecordCategory, RecordCategory> = {
  blog: 'blog',
  study: 'study',
  cert: 'certificate',
}

export function RecordReviewActions({
  recordId,
  kind,
  onDone,
}: {
  recordId: string
  kind: InstructorRecordCategory
  onDone: () => void
}) {
  const category = CATEGORY_OF[kind]
  const { data: detail } = useRecordSubmissionDetail(category, recordId)
  // 상세는 유형별 union — 증빙 이미지는 스터디·자격증 상세에만 있다.
  const evidenceImages =
    detail && 'evidenceImages' in detail ? detail.evidenceImages : undefined
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
          onDone()
        },
        onError: () =>
          toast.danger('처리에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }
  const reasonRequired = !reason.trim()

  return (
    <div className="border-border bg-surface-muted/40 rounded-lg border p-3">
      <EvidenceGallery images={evidenceImages} />
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
    <div className="mb-3">
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
