import { cn } from '@/shared/lib/cn'
import type { AssignmentDetail } from '../types'

// 과제 상세 우측 — 제출 이력 타임라인(BE V53) + 검토 완료 예시(강사 피드백).
// 카드 박스 없이 플랫, 항목은 dot·세로선으로 잇는다(2026-08-11 참조 이미지 정본).
export function SubmissionState({ detail }: { detail: AssignmentDetail }) {
  const ex = detail.feedbackExample
  const history = detail.history ?? []
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-fg text-[16px] font-bold">제출 이력</h3>

      {history.length === 0 ? (
        <p className="text-fg-muted text-[13px]">아직 제출된 이력이 없습니다.</p>
      ) : (
        <ol className="flex flex-col">
          {history.map((h, i) => (
            <li key={`${h.dateLabel}-${h.timeLabel}-${i}`} className="relative flex gap-3 pb-5">
              {/* dot + 아래 항목으로 잇는 세로선 */}
              <span className="flex flex-col items-center">
                <span
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    h.action === 'submitted' ? 'bg-brand' : 'bg-brand/60',
                  )}
                />
                {i < history.length - 1 && (
                  <span className="bg-divider mt-1 w-px flex-1" />
                )}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-brand text-[13px] font-bold">
                    {h.actionLabel}
                  </span>
                  <span className="text-fg-subtle text-[12px]">
                    {h.timeLabel}
                  </span>
                </div>
                <p className="text-fg text-[13px] leading-5">{h.summary}</p>
                <span className="text-fg-subtle text-[12px]">{h.dateLabel}</span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {ex && (
        <>
          <div className="bg-divider h-px w-full" />
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
        </>
      )}
    </section>
  )
}
