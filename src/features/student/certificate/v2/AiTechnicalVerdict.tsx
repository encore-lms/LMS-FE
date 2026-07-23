import { useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiVerdict, AiVerdictItemKey } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const CONFIDENCE_LABEL = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
} as const

const VERDICT_ITEMS: {
  key: AiVerdictItemKey
  label: string
  labelClassName: string
  cardClassName: string
  accentClassName: string
}[] = [
  {
    key: 'strength',
    label: '핵심 강점',
    labelClassName: 'text-success',
    cardClassName: 'border-success/20 bg-success-bg/45',
    accentClassName: 'bg-success',
  },
  {
    key: 'gap',
    label: '보완',
    labelClassName: 'text-warning',
    cardClassName: 'border-warning/20 bg-warning-bg/45',
    accentClassName: 'bg-warning',
  },
  {
    key: 'unique',
    label: '특이형',
    labelClassName: 'text-accent-strong',
    cardClassName: 'border-accent/20 bg-accent-bg/55',
    accentClassName: 'bg-accent-strong',
  },
]

function dataSourceFor(key: AiVerdictItemKey) {
  if (key === 'gap') {
    return '기술 역량 판단과 부족 근거 제한사항'
  }
  if (key === 'unique') {
    return '본인 수행업무·개인 활용기술·인증 트러블슈팅'
  }
  return '성취도·CS 평가, 외부 인증시험, 본인 수행업무, 인증 트러블슈팅'
}

export function AiTechnicalVerdict({
  verdict,
  className,
}: {
  verdict: AiVerdict
  className?: string
}) {
  const [openKey, setOpenKey] = useState<AiVerdictItemKey | null>(null)
  const values: Record<AiVerdictItemKey, string> = {
    strength: verdict.strength,
    gap: verdict.gap,
    unique: verdict.unique,
  }

  return (
    <AiAnalysisPanel title="AI 기술 역량 종합 판단" className={className}>
      <div className="mb-3 flex items-center justify-end">
        <span className="text-fg-subtle text-[10px]">
          전체 근거 충분도 {CONFIDENCE_LABEL[verdict.confidence]}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 overflow-visible md:grid-cols-3">
        {VERDICT_ITEMS.map((item) => {
          const detail = verdict.details[item.key]
          const active = openKey === item.key
          const hasDetail =
            detail.evidence.length > 0 ||
            detail.evidenceCodes.length > 0 ||
            verdict.limitations.length > 0

          return (
            <article
              key={item.key}
              data-technical-verdict={item.key}
              className={cn(
                'relative min-w-0 rounded-xl border p-4',
                item.cardClassName,
                active && 'ring-brand/40 ring-2',
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-4 left-0 w-0.5 rounded-full',
                  item.accentClassName,
                )}
              />
              <div className="flex min-h-5 items-center justify-between gap-2">
                <b className={cn('text-[12px]', item.labelClassName)}>
                  {item.label}
                </b>
                {hasDetail && (
                  <button
                    type="button"
                    aria-expanded={active}
                    aria-controls={`technical-verdict-detail-${item.key}`}
                    onClick={() =>
                      setOpenKey((current) =>
                        current === item.key ? null : item.key,
                      )
                    }
                    className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex size-5 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={`${item.label} 판단 근거 보기`}
                  >
                    <Info className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
              <p className="text-fg-muted mt-2.5 text-[12px] leading-5">
                {values[item.key]}
              </p>
              {active && (
                <div
                  id={`technical-verdict-detail-${item.key}`}
                  role="tooltip"
                  className="border-border bg-surface absolute top-11 right-3 left-3 z-30 rounded-xl border p-3 text-[10px] leading-4 shadow-xl"
                >
                  <b className="text-fg block">사용 데이터</b>
                  <p className="text-fg-muted mt-0.5">
                    {dataSourceFor(item.key)}
                  </p>
                  <b className="text-fg mt-2 block">판단 근거</b>
                  <p className="text-fg-muted mt-0.5">
                    {detail.evidence.slice(0, 3).join(' · ') ||
                      detail.evidenceCodes.slice(0, 3).join(' · ') ||
                      '연결된 직접 근거 없음'}
                  </p>
                  {verdict.limitations[0] && (
                    <p className="border-border text-fg-muted mt-2 border-t pt-2">
                      제한: {verdict.limitations[0]}
                    </p>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </AiAnalysisPanel>
  )
}
