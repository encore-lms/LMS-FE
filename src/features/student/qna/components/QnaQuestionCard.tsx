import { MessageSquare, Eye } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { QnaQuestion, Tone } from '../types'
import { TONE_SOLID } from '@/shared/lib/tone'

const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}

const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

interface Props {
  q: QnaQuestion
  onOpen: (q: QnaQuestion) => void
}

// QnA 목록 질문 카드 — 클릭 시 상세로. 트러블슈팅 TsCaseCard 패턴 차용.
export function QnaQuestionCard({ q, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(q)}
      className={cn(
        card,
        'flex w-full flex-col gap-3 text-left transition-shadow hover:shadow-[0px_4px_14px_0px_rgba(18,23,38,0.08)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-bold',
              CHIP[q.categoryTone],
            )}
          >
            {q.category}
          </span>
          <span
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-semibold',
              q.status === 'resolved'
                ? 'text-success'
                : q.status === 'answered'
                  ? 'text-info'
                  : 'text-warning',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                TONE_SOLID[
                  q.status === 'resolved'
                    ? 'success'
                    : q.status === 'answered'
                      ? 'info'
                      : 'warning'
                ],
              )}
            />
            {q.statusLabel}
          </span>
        </div>
        <span className="text-fg-subtle shrink-0 text-[11px]">
          {q.createdAt}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-fg text-[15px] font-bold">{q.title}</span>
        <span className="text-fg-muted line-clamp-2 text-[12px] leading-5">
          {q.excerpt}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {q.tags.map((t) => (
            <span key={t} className="text-fg-subtle text-[11px]">
              {t}
            </span>
          ))}
        </div>
        <div className="text-fg-subtle flex shrink-0 items-center gap-3 text-[11px]">
          <span className="text-fg-muted">{q.authorName}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {q.answerCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {q.viewCount}
          </span>
        </div>
      </div>
    </button>
  )
}
