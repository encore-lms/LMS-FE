import { Button } from '@/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { QuizListItem } from '@/shared/types'

interface QuizListItemCardProps {
  item: QuizListItem
  onTake: () => void
  onResult: () => void
}

const STATE_BADGE: Record<
  QuizListItem['state'],
  { label: string; className: string }
> = {
  available: { label: '응시 가능', className: 'bg-success-bg text-success' },
  completed: { label: '완료', className: 'bg-surface-muted text-fg-muted' },
  pending_manual: {
    label: '채점 대기',
    className: 'bg-warning-bg text-warning',
  },
  closed: { label: '기간 종료', className: 'bg-surface-muted text-fg-subtle' },
}

// ISO 날짜 → YYYY-MM-DD (목록 표시용 간단 포맷)
const ymd = (iso: string) => iso.slice(0, 10)

export function QuizListItemCard({
  item,
  onTake,
  onResult,
}: QuizListItemCardProps) {
  const { quiz, state, latestSubmission } = item
  const badge = STATE_BADGE[state]

  return (
    <li className="border-border bg-surface flex items-center justify-between rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-fg font-bold">{quiz.title}</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              badge.className,
            )}
          >
            {badge.label}
          </span>
        </div>
        <p className="text-fg-muted text-sm">
          {ymd(quiz.startsAt)} ~ {ymd(quiz.endsAt)} · 제한{' '}
          {quiz.timeLimitMinutes}분 · 최대 {quiz.maxAttempts}회
        </p>
        {latestSubmission && (
          <p className="text-fg-subtle text-xs">
            {state === 'pending_manual' ? '자동 채점분 ' : '점수 '}
            {latestSubmission.totalScore}점
          </p>
        )}
      </div>
      <div className="shrink-0">
        {state === 'available' ? (
          <Button onClick={onTake}>응시 시작</Button>
        ) : state === 'closed' ? (
          <Button variant="secondary" disabled>
            기간 종료
          </Button>
        ) : (
          <Button variant="secondary" onClick={onResult}>
            결과 보기
          </Button>
        )}
      </div>
    </li>
  )
}
