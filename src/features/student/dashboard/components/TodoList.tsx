import { Link } from 'react-router-dom'
import type { DashboardTodo } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'

// 오늘/이번 주 할 일 — 카테고리 칩 + 제목 + 마감(오늘은 강조). 클릭 시 대상 화면으로.
export function TodoList({ todos }: { todos: DashboardTodo[] }) {
  return (
    <SectionCard
      title="오늘/이번 주 할 일"
      action={<MoreLink to="/student/course" label="강의 홈" />}
    >
      {todos.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">
          할 일이 없어요
        </p>
      ) : (
        <ul className="flex flex-col">
          {todos.map((t) => (
            <li key={t.id}>
              <Link
                to={t.to}
                className="hover:bg-surface-muted -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Chip>{t.category}</Chip>
                  <span className="text-fg truncate text-sm">{t.title}</span>
                </span>
                <span
                  className={
                    t.due === '오늘'
                      ? 'text-danger shrink-0 text-xs font-semibold'
                      : 'text-fg-subtle shrink-0 text-xs'
                  }
                >
                  {t.due}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
