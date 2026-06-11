import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 대시보드 섹션 카드 래퍼 — 제목·서브타이틀 · 우측 액션(더보기 등) · 본문. 대부분 영역이 이걸 쓴다.
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-border bg-surface flex flex-col gap-4 rounded-xl border p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg font-bold">{title}</h2>
          {subtitle != null && (
            <span className="text-fg-subtle text-xs">{subtitle}</span>
          )}
        </div>
        {action != null && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}
