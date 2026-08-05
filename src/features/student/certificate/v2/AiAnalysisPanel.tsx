import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function AiAnalysisPanel({
  title,
  description,
  index,
  children,
  className,
}: {
  title: string
  description?: string
  index?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-border bg-surface overflow-hidden rounded-2xl border shadow-sm',
        className,
      )}
    >
      <header className="border-border flex items-start gap-3 border-b px-5 py-4 sm:px-6 sm:py-5">
        {index && (
          <span className="bg-accent-bg text-accent-strong flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold">
            {index}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-fg text-[18px] leading-7 font-bold">{title}</h2>
          {description && (
            <p className="text-fg-muted mt-1 text-[13px] leading-5">
              {description}
            </p>
          )}
        </div>
      </header>
      <div className="flex flex-col gap-4 p-5 sm:p-6">{children}</div>
    </section>
  )
}
