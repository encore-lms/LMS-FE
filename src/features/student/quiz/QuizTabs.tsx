import { cn } from '@/shared/lib/cn'
import type { QuizListItem } from '@/shared/types'

export type QuizTab = 'available' | 'completed' | 'pending_manual'

const TABS: { key: QuizTab; label: string; state: QuizListItem['state'] }[] = [
  { key: 'available', label: '응시 가능', state: 'available' },
  { key: 'completed', label: '완료', state: 'completed' },
  { key: 'pending_manual', label: '채점 대기', state: 'pending_manual' },
]

interface QuizTabsProps {
  value: QuizTab
  onChange: (tab: QuizTab) => void
  items: QuizListItem[]
}

/** 퀴즈 목록 탭 — state별 카운트 표시. 분류는 BE 파생값(QuizListItem.state)으로만. */
export function QuizTabs({ value, onChange, items }: QuizTabsProps) {
  return (
    <div className="border-divider mt-4 flex gap-1 border-b">
      {TABS.map((t) => {
        const count = items.filter((it) => it.state === t.state).length
        const active = value === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              'relative px-4 py-3 text-sm font-medium transition-colors',
              active ? 'text-brand' : 'text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
            <span className="text-fg-subtle ml-1">{count}</span>
            {active && (
              <span className="bg-brand absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
