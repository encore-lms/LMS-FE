import type { AssignmentDetail } from '../types'

// 과제 상세 우측(폼 모드) — 제출 이력 + 검토 완료 예시(강사 피드백). 제출 확정은 폼의 '제출 저장'이 담당.
export function SubmissionState({ detail }: { detail: AssignmentDetail }) {
  const ex = detail.feedbackExample
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-6">
      <h3 className="text-fg text-[18px] font-bold">제출 이력</h3>
      <p className="text-fg-muted text-[13px]">
        {detail.hasHistory
          ? '최근 제출본이 저장되어 있습니다.'
          : '아직 제출된 이력이 없습니다.'}
      </p>

      <div className="bg-border h-px w-full" />

      {ex && (
        <div className="flex flex-col gap-3">
          <p className="text-fg text-[14px] font-semibold">검토 완료 예시</p>
          <span className="bg-brand/10 text-brand w-fit rounded-md px-2 py-[3px] text-[11px] font-semibold">
            {ex.statusLabel}
          </span>
          <p className="text-fg text-[22px] font-bold">{ex.evaluationType}</p>
          <div className="flex flex-col gap-1.5">
            <p className="text-fg text-[13px] font-semibold">강사 피드백</p>
            <p className="text-fg-muted text-[13px] leading-5">{ex.feedback}</p>
          </div>
        </div>
      )}
    </section>
  )
}
