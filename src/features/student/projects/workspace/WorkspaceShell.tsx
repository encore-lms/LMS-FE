import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import type { WsTab } from '../types'

// 프로젝트 워크스페이스 공통 셸 — 제목·메타 + 10탭 바. Figma 342:1032 외.
const TABS: { key: WsTab; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'board', label: '보드·작업' },
  { key: 'calendar', label: '캘린더' },
  { key: 'meetings', label: '회의록' },
  { key: 'docs', label: '문서·파일·위키' },
  { key: 'issues', label: '이슈' },
  { key: 'team', label: '팀 관리' },
  { key: 'outcomes', label: '성과·기술스택' },
  { key: 'peer-evaluation', label: '상호평가' },
  { key: 'certification', label: '인증 요청' },
]

export function WorkspaceShell({
  title,
  meta,
  active,
  onTab,
  children,
}: {
  title: string
  meta: string
  active: WsTab
  onTab: (t: WsTab) => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">{title}</h1>
        <p className="text-fg-muted text-[12px]">{meta}</p>
      </div>

      <nav className="border-border bg-surface flex gap-1 overflow-x-auto rounded-[14px] border p-1.5">
        {TABS.map((t) => {
          const on = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTab(t.key)}
              className={cn(
                'shrink-0 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand/10 text-brand'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
