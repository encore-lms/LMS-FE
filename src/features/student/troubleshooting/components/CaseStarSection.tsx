import type { Dispatch, SetStateAction } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { card, STAR } from './caseFormConstants'

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
          {/* 'Markdown 지원'이라고 안내만 하고 실제로는 평문 textarea 였다 —
              작성·미리보기 탭과 툴바가 있는 공용 편집기로 바꾼다. */}
          <MarkdownEditor
            value={star[s.key] ?? ''}
            onChange={(v) => setStar((p) => ({ ...p, [s.key]: v }))}
            minHeight={120}
            maxLength={500}
            placeholder={s.sub}
          />
        </section>
      ))}
    </>
  )
}
