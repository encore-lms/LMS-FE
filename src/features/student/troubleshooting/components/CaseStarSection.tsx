import type { Dispatch, SetStateAction } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { card, input, STAR } from './caseFormConstants'

interface CaseStarSectionProps {
  star: Record<string, string>
  setStar: Dispatch<SetStateAction<Record<string, string>>>
}

export function CaseStarSection({ star, setStar }: CaseStarSectionProps) {
  return (
    <>
      {STAR.map((s) => (
        <section key={s.key} className={cn(card, 'flex flex-col gap-3')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
                  s.box,
                )}
              >
                <s.Icon className="size-[18px]" />
              </span>
              <div className="flex flex-col">
                <span className="text-fg text-[14px] font-bold">{s.label}</span>
                <span className="text-fg-subtle text-[11px]">{s.sub}</span>
              </div>
            </div>
            {star[s.key]?.trim() && (
              <span className="bg-success-bg text-success flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
                <Check className="size-3" /> 작성됨
              </span>
            )}
          </div>
          <textarea
            className={cn(input, 'min-h-[120px] resize-none leading-6')}
            value={star[s.key]}
            maxLength={500}
            onChange={(e) =>
              setStar((p) => ({ ...p, [s.key]: e.target.value }))
            }
          />
          <div className="flex items-center justify-between">
            <div className="text-fg-subtle flex items-center gap-3 text-[11px]">
              <span>Markdown 지원</span>
              <span className="bg-surface-muted rounded px-1.5 py-0.5 font-mono">
                ` ` 인라인 코드
              </span>
            </div>
            <span className="text-fg-subtle text-[11px]">
              {star[s.key]?.length ?? 0} / 500
            </span>
          </div>
        </section>
      ))}
    </>
  )
}
