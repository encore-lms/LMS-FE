import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// 대시보드 섹션 카드 래퍼 — (아이콘 배지)+제목·서브타이틀 · 우측 액션(더보기 등) · 본문.
// 호버 시 그림자를 살짝 키워 카드가 살아있는 느낌을 준다(레이아웃 이동 없음).
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-border bg-surface flex flex-col gap-4 rounded-xl border p-6 transition-shadow duration-200 hover:shadow-[0px_4px_14px_0px_rgba(18,23,38,0.06)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="bg-surface-muted text-fg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-4" />
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            <h2 className="text-fg font-bold">{title}</h2>
            {subtitle != null && (
              <span className="text-fg-subtle text-xs">{subtitle}</span>
            )}
          </div>
        </div>
        {action != null && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}
