import { Link } from 'react-router-dom'
import type { DashboardDeadlineQuiz } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'

// 마감 임박 퀴즈 상위 3 — 과목 칩 + 제목 + D-day. 클릭 시 퀴즈 목록으로.
export function DeadlineQuizzes({
  quizzes,
}: {
  quizzes: DashboardDeadlineQuiz[]
}) {
  return (
    <SectionCard
      title="마감 임박 퀴즈"
      action={<MoreLink to="/student/quizzes" />}
    >
      {quizzes.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">
          마감 임박 퀴즈가 없어요
        </p>
      ) : (
        <ul className="flex flex-col">
          {quizzes.map((q) => (
            <li key={q.id}>
              <Link
                to={q.to}
                className="hover:bg-surface-muted -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Chip>{q.category}</Chip>
                  <span className="text-fg truncate text-sm">{q.title}</span>
                </span>
                <span className="text-warning shrink-0 text-xs font-semibold">
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
