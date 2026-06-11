import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { DashboardTodo } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { TONE_TEXT } from './tone'

// 오늘/이번 주 할 일 — 상태점 + 카테고리(색) + 제목 + 마감 표시. 클릭 시 대상 화면으로.
// 마감 표시: today=빨강 채움칩 · week=회색칩 · soon=무지 텍스트.
function DueLabel({ todo }: { todo: DashboardTodo }) {
  if (todo.dueKind === 'today') {
    return (
      <span className="bg-danger text-on-color shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold">
        {todo.due}
      </span>
    )
  }
  if (todo.dueKind === 'week') {
    return (
      <span className="bg-surface-muted text-fg-muted shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium">
        {todo.due}
      </span>
    )
  }
  return <span className="text-fg-subtle shrink-0 text-xs">{todo.due}</span>
}

export function TodoList({ todos }: { todos: DashboardTodo[] }) {
  return (
    <SectionCard
      title="오늘·이번 주 할 일"
      subtitle={`${todos.length}건 · 마감 일정 순`}
      action={<MoreLink to="/student/course" />}
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
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      t.dueKind === 'today' ? 'bg-danger' : 'bg-fg-subtle/40',
                    )}
                  />
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold',
                      TONE_TEXT[t.categoryTone],
                    )}
                  >
                    {t.category}
                  </span>
                  <span className="text-fg truncate text-sm">{t.title}</span>
                </span>
                <DueLabel todo={t} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
