import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/shared/lib/date'
import type { ResumeFeedbackItem } from '@/shared/types'

/**
 * 이력서 피드백 목록(+작성) — 강사·운영 상세와 수강생 편집 화면이 함께 쓴다.
 * 작성자 이름은 BE가 auth에서 해석해 내려준다(실패 시 null → '작성자 미확인').
 * 삭제는 작성자 본인·운영자만 BE가 허용하므로, 버튼 노출도 같은 조건으로 맞춘다.
 *
 * <p>수강생은 받은 피드백을 <b>읽기만</b> 한다 — onSubmit 을 넘기지 않으면 작성 폼과 삭제 버튼이 사라진다.</p>
 */
export function ResumeFeedbackSection({
  feedbacks,
  value,
  onChange,
  onSubmit,
  submitting,
  onDelete,
  deletingId,
  canDelete,
}: {
  feedbacks: ResumeFeedbackItem[]
  value?: string
  onChange?: (v: string) => void
  /** 미지정이면 읽기 전용 — 작성 폼·삭제 버튼을 렌더하지 않는다. */
  onSubmit?: () => void
  submitting?: boolean
  onDelete?: (feedbackId: string) => void
  deletingId?: string | null
  /** 이 피드백을 지울 수 있는지 — 작성자 본인이거나 운영자 */
  canDelete?: (f: ResumeFeedbackItem) => boolean
}) {
  const readOnly = !onSubmit
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <p className="text-fg mb-3 text-sm font-semibold">
        피드백 {feedbacks.length}건
      </p>
      <div className="mb-3 flex flex-col gap-2">
        {feedbacks.length === 0 ? (
          <p className="text-fg-subtle text-xs">
            {readOnly
              ? '아직 받은 피드백이 없어요. 강사·운영이 남기면 여기에 보여요.'
              : '아직 피드백이 없어요.'}
          </p>
        ) : (
          feedbacks.map((f) => (
            <div key={f.id} className="bg-surface-muted rounded-lg px-3 py-2.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-fg text-[13px] font-semibold">
                  {f.authorName ?? '작성자 미확인'}
                </span>
                <span className="text-fg-subtle text-[11px] tabular-nums">
                  {formatDateTime(f.createdAt)}
                </span>
                {!readOnly && canDelete?.(f) && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(f.id)}
                    disabled={deletingId === f.id}
                    aria-label="피드백 삭제"
                    className="text-fg-subtle hover:text-danger ml-auto rounded p-1 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-fg text-[13px] whitespace-pre-wrap">
                {f.body}
              </p>
            </div>
          ))
        )}
      </div>
      {!readOnly && (
        <div className="flex items-start gap-2">
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="피드백을 입력하세요"
            rows={2}
            className="border-border focus:border-brand text-fg bg-surface flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          />
          <Button onClick={onSubmit} disabled={submitting}>
            <MessageSquarePlus className="h-4 w-4" /> 등록
          </Button>
        </div>
      )}
    </section>
  )
}
