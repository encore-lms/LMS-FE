import { cn } from '@/shared/lib/cn'

// 작은 라벨 칩 — 할 일/퀴즈/트러블슈팅의 카테고리·태그 표시.
export function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'bg-surface-muted text-fg-muted inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  )
}
