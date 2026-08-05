import { ArrowRight, CheckCircle2, ShieldCheck, Tags } from 'lucide-react'
import type { AiTroubleshooting } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

export function AiTroubleshootingAnalysis({
  troubleshooting,
}: {
  troubleshooting: AiTroubleshooting
}) {
  if (troubleshooting.status === 'NOT_READY') return null

  const primaryGroup = [...troubleshooting.groups].sort(
    (a, b) => b.certifiedCaseCount - a.certifiedCaseCount,
  )[0]

  return (
    <AiAnalysisPanel
      index="03"
      title="문제해결에서 드러난 강점"
      description="인증된 트러블슈팅에서 반복된 해결 방식과 결과 검증 흐름만 추렸습니다."
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
        <section className="border-success/25 bg-success-bg rounded-xl border p-5">
          <div className="flex items-start gap-3">
            <span className="bg-success text-on-color flex size-10 shrink-0 items-center justify-center rounded-xl">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <span className="text-success text-[12px] font-bold">
                AI가 확인한 대표 문제해결 방식
              </span>
              <p className="text-fg mt-2 text-[15px] leading-6 font-semibold">
                {troubleshooting.summary}
              </p>
            </div>
          </div>
        </section>

        <section className="border-border bg-surface-muted rounded-xl border p-5">
          <span className="text-fg-subtle text-[12px] font-semibold">
            인증된 해결 근거
          </span>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-fg text-[28px] leading-none font-extrabold">
              {troubleshooting.certifiedCaseCount}건
            </strong>
            <span className="text-fg-muted text-[13px]">
              중 독립 해결 {troubleshooting.independentCaseCount}건
            </span>
          </div>
          {troubleshooting.independentRate != null && (
            <p className="text-success mt-3 text-[13px] font-semibold">
              독립 해결 비율 {troubleshooting.independentRate}%
            </p>
          )}
        </section>
      </div>

      {troubleshooting.steps.length > 0 && (
        <ol className="grid gap-3 md:grid-cols-3">
          {troubleshooting.steps.slice(0, 3).map((step, index) => (
            <li
              key={step.key}
              className="border-border bg-surface relative rounded-xl border p-4"
            >
              <span className="text-accent-strong text-[12px] font-bold">
                {index + 1}. {step.label}
              </span>
              <p className="text-fg-muted mt-2 text-[14px] leading-6">
                {step.summary}
              </p>
              {index < Math.min(troubleshooting.steps.length, 3) - 1 && (
                <ArrowRight
                  className="text-border absolute top-1/2 -right-3 z-10 hidden size-5 md:block"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      )}

      {primaryGroup && (
        <section className="border-border bg-surface rounded-xl border p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Tags
                  className="text-accent-strong size-4"
                  aria-hidden="true"
                />
                <h3 className="text-fg text-[15px] font-bold">
                  가장 많이 해결한 문제 · {primaryGroup.label}
                </h3>
              </div>
              <p className="text-fg-muted mt-2 text-[14px] leading-6">
                {primaryGroup.solutionSummary}
              </p>
            </div>
            <strong className="text-accent-strong shrink-0 text-[20px]">
              {primaryGroup.certifiedCaseCount}건
            </strong>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {primaryGroup.tags.map((tag) => (
              <span
                key={tag.label}
                className="bg-accent-bg text-accent-strong rounded-lg px-3 py-1.5 text-[13px] font-semibold"
              >
                {tag.label} {tag.count}건
              </span>
            ))}
          </div>
        </section>
      )}

      {troubleshooting.growth?.status === 'READY' && (
        <div className="border-info/25 bg-info-bg flex items-start gap-3 rounded-xl border px-4 py-3.5">
          <CheckCircle2
            className="text-info mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-info text-[13px] font-bold">
              확장된 해결 범위
            </h3>
            <p className="text-fg-muted mt-1 text-[13px] leading-5">
              {troubleshooting.growth.summary}
            </p>
          </div>
        </div>
      )}
    </AiAnalysisPanel>
  )
}
