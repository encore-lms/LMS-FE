import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { GradingMode, InstructorQuestion } from '@/shared/types'
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '../quizzes/meta'

interface QuestionPreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  subjectName: string
  gradingMode: GradingMode
  totalPoints: number
  questions: InstructorQuestion[]
}

// 템플릿/문항 미리보기 모달 — 학생 응시 화면(보기 전용)으로 문항을 렌더.
// 모범 답안/해설 등 강사 전용 정보는 노출하지 않는다(학생 시점). FE 전용(추가 호출 없음).
export function QuestionPreviewModal({
  open,
  onClose,
  title,
  subjectName,
  gradingMode,
  totalPoints,
  questions,
}: QuestionPreviewModalProps) {
  // Esc 로 닫기.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-border bg-surface max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border"
      >
        {/* 헤더 */}
        <div className="border-divider bg-surface sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b px-6 py-4">
          <div>
            <p className="text-fg-subtle text-xs">{title}</p>
            <p className="text-fg text-base font-bold">{subjectName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="미리보기 닫기"
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <X className="h-3.5 w-3.5" /> 닫기
          </button>
        </div>

        {/* 요약 */}
        <div className="border-divider text-fg-muted border-b px-6 py-3 text-xs">
          문항 {questions.length} · 총점 {totalPoints} · 채점 {gradingMode} ·
          학생 응시 화면 미리보기 (보기 전용)
        </div>

        {/* 문항 목록 */}
        <div className="flex flex-col gap-4 p-6">
          {questions.length === 0 ? (
            <p className="text-fg-subtle text-sm">표시할 문항이 없습니다.</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="border-border rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg text-sm font-bold">Q{q.order}</span>
                  <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-px text-[10px] font-bold">
                    {QUESTION_TYPE_LABEL[q.type]}
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    {q.points}점 · {DIFFICULTY_LABEL[q.difficulty]} ·{' '}
                    {q.category}
                  </span>
                </div>
                <p className="text-fg mt-2 text-sm whitespace-pre-wrap">
                  {q.body || '(본문 미작성)'}
                </p>

                {q.type === 'multiple_choice' &&
                  q.choices &&
                  q.choices.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {q.choices.map((c, i) => (
                        <li
                          key={`${q.id}-c${i}`}
                          className="text-fg-muted flex items-center gap-2 text-sm"
                        >
                          <span className="border-border h-4 w-4 shrink-0 rounded-full border" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}

                {(q.type === 'short_answer' || q.type === 'fill_blank') && (
                  <div className="border-border bg-surface-muted/40 mt-3 h-9 rounded-lg border" />
                )}

                {q.type === 'essay' && (
                  <div className="border-border bg-surface-muted/40 mt-3 h-20 rounded-lg border" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
