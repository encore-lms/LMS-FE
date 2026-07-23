import { cn } from '@/shared/lib/cn'
import type { AiVerdict, AiVerdictItemKey } from '../ai'
import { AnalysisEvidenceTooltip } from './AnalysisEvidenceTooltip'
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
    key: 'growth',
    label: '성장 포인트',
    labelClassName: 'text-info',
    cardClassName: 'border-info/20 bg-info-bg/45',
    accentClassName: 'bg-info',
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
  if (key === 'growth') {
    return '성취도 평가 · CS 평가 · 평가 시점별 점수 추이'
  }
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
  const values: Record<AiVerdictItemKey, string> = {
    strength: verdict.strength,
    growth: verdict.growth,
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
      <div className="grid grid-cols-1 gap-3 overflow-visible md:grid-cols-2 xl:grid-cols-4">
        {VERDICT_ITEMS.map((item) => {
          const detail = verdict.details[item.key]
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
                  <AnalysisEvidenceTooltip
                    label={`${item.label} 판단 근거`}
                    ariaLabel={`${item.label} 판단 근거 보기`}
                  >
                    <span>
                      <b className="text-fg">사용 데이터</b>
                      <br />
                      {dataSourceFor(item.key)}
                    </span>
                    <span>
                      <b className="text-fg">판단 근거</b>
                      <br />
                      {detail.evidence.slice(0, 3).join(' · ') ||
                        detail.evidenceCodes.slice(0, 3).join(' · ') ||
                        '연결된 직접 근거 없음'}
                    </span>
                    {verdict.limitations.map((limitation) => (
                      <span
                        key={limitation}
                        className="border-border border-t pt-2"
                      >
                        제한: {limitation}
                      </span>
                    ))}
                  </AnalysisEvidenceTooltip>
                )}
              </div>
              <p className="text-fg-muted mt-2.5 text-[12px] leading-5">
                {values[item.key]}
              </p>
            </article>
          )
        })}
      </div>
    </AiAnalysisPanel>
  )
}
