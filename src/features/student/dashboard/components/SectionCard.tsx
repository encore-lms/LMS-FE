import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 대시보드 섹션 카드 래퍼 — 제목(+건수) · 우측 액션(더보기 등) · 본문. 대부분 영역이 이걸 쓴다.
export function SectionCard({
  title,
  count,
  action,
  children,
  className,
}: {
  title: ReactNode
  count?: ReactNode
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-fg font-bold">{title}</h2>
          {count != null && (
            <span className="text-fg-subtle text-sm">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
