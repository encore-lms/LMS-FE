import { Info, ListChecks, Tags, UsersRound, Wrench } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { ProblemAi } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

function EvidenceInfo({
  label,
  evidence,
  limitations,
}: {
  label: string
  evidence: string[]
  limitations: string[]
}) {
  if (evidence.length === 0 && limitations.length === 0) return null

  return (
    <span className="group relative shrink-0">
      <button
        type="button"
        className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex size-4 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`${label} 분석 근거 보기`}
      >
        <Info className="size-3" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="border-border bg-surface text-fg-muted pointer-events-none absolute top-full right-0 z-20 mt-1.5 hidden w-72 max-w-[calc(100vw-4rem)] rounded-lg border p-3 text-[10px] leading-4 shadow-lg group-focus-within:block group-hover:block"
      >
        <b className="text-fg block">사용 근거</b>
        <span className="mt-1 block">
          {evidence.slice(0, 3).join(' · ') || '연결된 근거 없음'}
        </span>
        {limitations[0] && (
          <span className="border-border mt-2 block border-t pt-2">
            제한: {limitations[0]}
          </span>
        )}
      </span>
    </span>
  )
}

function statusLabel(status: 'READY' | 'PARTIAL' | 'NOT_READY') {
  if (status === 'READY') return '근거 확인'
  if (status === 'PARTIAL') return '일부 근거'
  return '산정 대기'
}

export function AiProblemAnalysis({
  problem,
  className,
}: {
  problem: ProblemAi
  className?: string
}) {
  if (problem.status === 'NOT_READY') {
    return (
      <AiAnalysisPanel title="AI 문제해결·협업 종합 분석" className={className}>
        <p className="text-fg-muted text-[12px] leading-5">
          인증된 트러블슈팅과 완료 프로젝트 동료평가 근거가 부족해 종합 분석은
          산출 전입니다.
        </p>
      </AiAnalysisPanel>
    )
  }

  const capEvidence = problem.caps.flatMap((cap) => cap.evidence)
  const capLimitations = problem.caps.flatMap((cap) => cap.limitations)

  return (
    <AiAnalysisPanel title="AI 문제해결·협업 종합 분석" className={className}>
      <div className="flex flex-col gap-3.5">
        <div className="text-fg-subtle flex flex-wrap items-center gap-x-1.5 text-[10px]">
          <span>인증 트러블슈팅 {problem.certifiedCaseCount}건</span>
          <span>· 동료평가 {problem.collaboration.evaluatorCount}명</span>
          {problem.status === 'PARTIAL' && <span>· 일부 근거만 반영</span>}
        </div>

        <section
          data-problem-narrative="troubleshooting"
          className="border-accent/25 bg-accent-bg/35 min-w-0 rounded-xl border p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="bg-accent/10 text-accent-strong flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Wrench className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <span className="text-accent-strong block text-[10px] font-bold">
                  핵심 문제해결 능력
                </span>
                <h3 className="text-fg mt-0.5 text-[18px] leading-6 font-bold">
                  인증 트러블슈팅 역량
                </h3>
              </div>
            </div>
            <EvidenceInfo
              label="트러블슈팅 역량"
              evidence={capEvidence}
              limitations={capLimitations}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {problem.caps.map((cap) => (
              <article
                key={cap.key}
                className={cn(
                  'border-border bg-surface rounded-xl border p-4',
                  cap.status === 'PARTIAL' && 'border-accent/30',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-fg text-[12px] font-bold">{cap.label}</h4>
                  <span className="text-fg-subtle text-[9px]">
                    {statusLabel(cap.status)}
                  </span>
                </div>
                <p className="text-fg-muted mt-2 text-[10px] leading-4">
                  인증 사례 {cap.certifiedCaseCount}건의 직접 근거를
                  연결했습니다.
                </p>
                <EvidenceInfo
                  label={cap.label}
                  evidence={cap.evidence}
                  limitations={cap.limitations}
                />
              </article>
            ))}
          </div>

          <div className="border-border bg-surface/80 mt-4 rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2">
              <ListChecks className="text-accent-strong size-4" aria-hidden />
              <h4 className="text-fg text-[12px] font-bold">
                문제해결 성장 흐름
              </h4>
            </div>
            <p className="text-fg-muted text-[11px] leading-5">
              {problem.growth.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                ...problem.growth.newDomains,
                ...problem.growth.repeatedDomains,
                ...problem.growth.newTechnologies,
              ].map((item) => (
                <span
                  key={item}
                  className="bg-surface-muted text-fg-muted rounded-md px-2 py-1 text-[9px]"
                >
                  #{item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          data-problem-narrative="collaboration"
          className="border-info/20 bg-info-bg/25 min-w-0 rounded-xl border p-4 sm:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2.3fr)]">
            <div className="flex items-start gap-2.5">
              <span className="bg-info/10 text-info flex size-8 shrink-0 items-center justify-center rounded-lg">
                <UsersRound className="size-4" aria-hidden="true" />
              </span>
              <div>
                <span className="text-fg-subtle block text-[9px] font-semibold">
                  협업 스타일
                </span>
                <h3 className="text-fg text-[14px] font-bold">
                  {statusLabel(problem.collaboration.status)}
                </h3>
              </div>
            </div>

            <div className="border-border min-w-0 border-t pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-fg-muted text-[11px] leading-5">
                  {problem.collaboration.summary}
                </p>
                <EvidenceInfo
                  label="협업 스타일"
                  evidence={problem.collaboration.evidence}
                  limitations={problem.collaboration.limitations}
                />
              </div>
              <div className="border-border mt-3 border-t pt-3">
                <div className="mb-2 flex items-center gap-2">
                  <Tags className="text-info size-3.5" aria-hidden />
                  <b className="text-fg text-[10px]">반복 행동 신호</b>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {problem.collaboration.behaviorSignals.map((signal) => (
                    <span
                      key={signal}
                      className="bg-info/10 text-info rounded-md px-2 py-1 text-[9px]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AiAnalysisPanel>
  )
}
