import { Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiVerdict } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

type VerdictKey = keyof AiVerdict['details']

const CONFIDENCE_LABEL: Record<AiVerdict['confidence'], string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

const ITEMS: Array<{
  key: VerdictKey
  label: string
  labelClassName: string
}> = [
  { key: 'strength', label: '강점', labelClassName: 'text-success' },
  { key: 'gap', label: '보완', labelClassName: 'text-warning' },
  {
    key: 'unique',
    label: '특이형',
    labelClassName: 'text-accent-strong',
  },
]

function LimitationsTooltip({ limitations }: { limitations: string[] }) {
  if (limitations.length === 0) return null

  return (
    <span className="group relative shrink-0">
      <button
        type="button"
        className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex size-5 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        aria-label="기술 종합 판단 기준 보기"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="border-border bg-surface text-fg-muted pointer-events-none absolute top-full right-0 z-30 mt-1.5 hidden w-64 max-w-[calc(100vw-4rem)] rounded-lg border p-3 text-[11px] leading-4 font-normal [overflow-wrap:anywhere] shadow-lg group-focus-within:block group-hover:block sm:w-72"
      >
        <span className="text-fg mb-1.5 block font-bold">판단 제한</span>
        <span className="flex flex-col gap-1.5">
          {limitations.map((item) => (
            <span key={item} className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{item}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

export function TechnicalVerdict({ verdict }: { verdict: AiVerdict }) {
  return (
    <AiAnalysisPanel title="AI 기술 역량 종합 판단" className="min-w-0 flex-1">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-end gap-1.5">
          <span className="bg-surface-muted text-fg-subtle rounded px-2 py-1 text-[10px] font-semibold">
            근거 충분도 {CONFIDENCE_LABEL[verdict.confidence]}
          </span>
          <LimitationsTooltip limitations={verdict.limitations} />
        </div>

        <div className="flex flex-col gap-2">
          {ITEMS.map(({ key, label, labelClassName }) => {
            const detail = verdict.details[key]
            const isReady = detail.status === 'READY'

            return (
              <article
                key={key}
                data-verdict-key={key}
                className="border-border bg-surface relative flex min-w-0 flex-col gap-1.5 rounded-xl border p-3"
              >
                <div className="flex min-h-5 items-center justify-between gap-2">
                  <b className={cn('text-[11px]', labelClassName)}>{label}</b>
                  <div className="flex items-center gap-1.5">
                    {!isReady && (
                      <span className="bg-surface-muted text-fg-subtle rounded px-1.5 py-0.5 text-[9px] font-semibold">
                        분석 준비 중
                      </span>
                    )}
                    {isReady && detail.evidence.length > 0 && (
                      <span className="group static shrink-0">
                        <button
                          type="button"
                          className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex size-4 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                          aria-label={`${label} 판단 근거 보기`}
                        >
                          <Info className="size-3" aria-hidden="true" />
                        </button>
                        <span
                          role="tooltip"
                          className="border-border bg-surface text-fg-muted pointer-events-none absolute top-9 right-3 left-3 z-20 hidden rounded-lg border p-3 text-[11px] leading-4 font-normal [overflow-wrap:anywhere] shadow-lg group-focus-within:block group-hover:block"
                        >
                          <span className="text-fg mb-1.5 block font-bold">
                            {label} 판단 근거
                          </span>
                          <span className="flex flex-col gap-1.5">
                            {detail.evidence.map((item) => (
                              <span key={item} className="flex gap-1.5">
                                <span aria-hidden="true">·</span>
                                <span>{item}</span>
                              </span>
                            ))}
                          </span>
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    'text-[12px] leading-5',
                    isReady ? 'text-fg-muted' : 'text-fg-subtle',
                  )}
                >
                  {verdict[key]}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </AiAnalysisPanel>
  )
}
