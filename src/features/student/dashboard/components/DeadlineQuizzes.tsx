import { Link } from 'react-router-dom'
import { AlarmClock, Coffee } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { DashboardDeadlineQuiz } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'
import { EmptyState } from './EmptyState'
import { TONE_SOFT } from './tone'

// 마감 임박 퀴즈 상위 3 — 과목 칩 + 제목/메타(시간·문항) + D-day 칩. 클릭 시 퀴즈 목록으로.
export function DeadlineQuizzes({
  quizzes,
}: {
  quizzes: DashboardDeadlineQuiz[]
}) {
  return (
    <SectionCard
      icon={AlarmClock}
      title="마감 임박 퀴즈"
      subtitle={
        quizzes.length === 0
          ? '응시 가능 기간 임박'
          : `${quizzes.length}건 · 응시 가능 기간 임박`
      }
      action={<MoreLink to="/student/quizzes" label="퀴즈 목록" />}
    >
      {quizzes.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="마감 임박 퀴즈가 없어요"
          sub="미리 준비하면 더 여유로워요"
          ctaLabel="퀴즈 목록 보기"
          ctaTo="/student/quizzes"
        />
      ) : (
        <ul className="flex flex-col">
          {quizzes.map((q) => (
            <li key={q.id}>
              <Link
                to={q.to}
                className="hover:bg-surface-muted -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Chip tone={q.categoryTone}>{q.category}</Chip>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-fg truncate text-sm font-medium">
                      {q.title}
                    </span>
                    <span className="text-fg-subtle truncate text-xs">
                      {q.meta}
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold',
                    TONE_SOFT[q.dueTone],
                  )}
                >
                  {q.due}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
