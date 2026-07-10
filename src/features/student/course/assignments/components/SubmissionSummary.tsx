import { buttonClass } from '@/components/ui/buttonClass'
import type { AssignmentDetail, AssignmentDraft } from '../types'

// 제출 완료 요약 (Figma 2236:10480) — 상세 페이지의 제출 후 휴지 상태.
// 제출본 메타(제출 시각·URL·첨부) + '제출 보기·수정'으로 폼 복귀. 검토 완료면 강사 피드백도 노출.
export function SubmissionSummary({
  detail,
  submitted,
  submittedAtLabel,
  onEdit,
}: {
  detail: AssignmentDetail
  submitted: AssignmentDraft
  submittedAtLabel: string
  onEdit: () => void
}) {
  const ex = detail.feedbackExample
  return (
    <section className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-fg text-[18px] font-bold">{detail.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-brand/10 text-brand rounded-md px-2 py-[3px] text-[11px] font-semibold">
            제출 완료
          </span>
          <span className="text-fg-muted text-[13px]">
            제출 시각 {submittedAtLabel} · 마지막 제출본이 유효합니다.
          </span>
        </div>
      </div>

      {submitted.url && (
        <div className="flex flex-col gap-1.5">
          <p className="text-fg text-[13px] font-semibold">제출 URL</p>
          <a
            href={submitted.url}
            target="_blank"
            rel="noreferrer"
            className="text-info text-[13px] break-all hover:underline"
          >
            {submitted.url}
          </a>
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-fg text-[13px] font-semibold">첨부</p>
          <p className="text-fg-muted text-[13px]">
            {submitted.assets.length > 0
              ? submitted.assets.join(' · ')
              : '첨부 없음'}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className={buttonClass({ size: 'md', className: 'shrink-0' })}
        >
          제출 보기·수정
        </button>
      </div>

      {ex && (
        <div className="border-border bg-surface-muted/40 flex flex-col gap-1.5 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="bg-info-bg text-info rounded-md px-2 py-[3px] text-[11px] font-semibold">
              {ex.statusLabel}
            </span>
            <p className="text-fg text-[13px] font-semibold">강사 피드백</p>
          </div>
          <p className="text-fg-muted text-[13px] leading-5">{ex.feedback}</p>
        </div>
      )}
    </section>
  )
}
