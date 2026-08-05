import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type AnalysisTone = 'accent' | 'info' | 'success'

const TONE_STYLE: Record<
  AnalysisTone,
  { section: string; header: string; index: string }
> = {
  accent: {
    section: 'border-accent/30',
    header: 'border-accent/20 bg-accent-bg/55',
    index: 'bg-accent-strong text-on-color',
  },
  info: {
    section: 'border-info/30',
    header: 'border-info/20 bg-info-bg/60',
    index: 'bg-info text-on-color',
  },
  success: {
    section: 'border-success/30',
    header: 'border-success/20 bg-success-bg/65',
    index: 'bg-success text-on-color',
  },
}

export function AiAnalysisPanel({
  id,
  title,
  description,
  index,
  tone = 'accent',
  children,
  className,
}: {
  id?: string
  title: string
  description?: string
  index?: string
  tone?: AnalysisTone
  children: ReactNode
  className?: string
}) {
  const toneStyle = TONE_STYLE[tone]

  return (
    <section
      id={id}
      className={cn(
        'bg-surface overflow-hidden rounded-3xl border shadow-sm',
        toneStyle.section,
        className,
      )}
    >
      <header
        className={cn(
          'flex items-start gap-3 border-b px-5 py-5 sm:px-7 sm:py-6',
          toneStyle.header,
        )}
      >
        {index && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold shadow-sm',
              toneStyle.index,
            )}
          >
            {index}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-fg text-[20px] leading-7 font-bold">{title}</h2>
          {description && (
            <p className="text-fg-muted mt-1.5 text-[14px] leading-6">
              {description}
            </p>
          )}
        </div>
      </header>
      <div className="flex flex-col gap-5 p-5 sm:p-7">{children}</div>
    </section>
  )
}
