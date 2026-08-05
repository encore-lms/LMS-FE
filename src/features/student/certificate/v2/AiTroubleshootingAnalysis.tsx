import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
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
      id="ai-troubleshooting-analysis"
      index="03"
      tone="success"
      title="트러블슈팅 AI 분석"
      description="사례 수와 태그를 다시 나열하지 않고, 반복해서 드러난 문제 접근법과 해결 패턴, 확장 방향을 분석했습니다."
    >
      <section className="bg-success text-on-color rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="bg-on-color/15 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-on-color/80 text-[12px] font-bold">
              AI가 읽은 문제해결 성향
            </span>
            <p className="mt-2 max-w-4xl text-[17px] leading-7 font-bold">
              {troubleshooting.summary}
            </p>
          </div>
        </div>
      </section>

      {troubleshooting.steps.length > 0 && (
        <section>
          <h3 className="text-fg text-[16px] font-bold">
            반복해서 나타난 해결 패턴
          </h3>
          <ol className="border-success/20 bg-success-bg/35 mt-3 grid overflow-hidden rounded-2xl border md:grid-cols-3">
            {troubleshooting.steps.slice(0, 3).map((step, index) => (
              <li
                key={step.key}
                className="border-success/15 relative px-5 py-5 md:border-l md:first:border-l-0"
              >
                <span className="bg-success text-on-color flex size-7 items-center justify-center rounded-lg text-[12px] font-bold">
                  {index + 1}
                </span>
                <h4 className="text-fg mt-3 text-[14px] font-bold">
                  {step.label}
                </h4>
                <p className="text-fg-muted mt-1.5 text-[14px] leading-6">
                  {step.summary}
                </p>
                {index < Math.min(troubleshooting.steps.length, 3) - 1 && (
                  <ArrowRight
                    className="text-success/35 absolute top-1/2 -right-3 z-10 hidden size-5 md:block"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {primaryGroup && (
          <section className="border-border bg-surface rounded-2xl border p-5">
            <span className="text-success text-[12px] font-bold">
              가장 선명한 해결 영역
            </span>
            <h3 className="text-fg mt-1.5 text-[17px] font-bold">
              {primaryGroup.label}
            </h3>
            <p className="text-fg-muted mt-2 text-[14px] leading-6">
              {primaryGroup.solutionSummary}
            </p>
          </section>
        )}

        {troubleshooting.growth?.status === 'READY' && (
          <section className="border-info/20 bg-info-bg/45 rounded-2xl border p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="text-info size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="text-info text-[12px] font-bold">
                확장되는 문제해결 범위
              </span>
            </div>
            <p className="text-fg mt-2 text-[14px] leading-6 font-semibold">
              {troubleshooting.growth.summary}
            </p>
          </section>
        )}
      </div>
    </AiAnalysisPanel>
  )
}
