import {
  ChevronDown,
  Info,
  ListChecks,
  Tags,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiProblemGrowthAnalysis, ProblemAi } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const OVERALL_STATUS_LABEL: Record<ProblemAi['status'], string> = {
  READY: '분석 근거 충분',
  PARTIAL: '분석 근거 일부 확인',
  NOT_READY: '분석 준비 중',
}

const COLLABORATION_AXIS_LABEL = {
  collaboration: '협업',
  communication: '소통',
  responsibility: '책임감',
  problemSolving: '문제해결',
} as const

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

function GrowthSignals({
  label,
  values,
  tone,
}: {
  label: string
  values: string[]
  tone: 'new' | 'repeat'
}) {
  if (values.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <b className="text-fg-subtle text-[9px]">{label}</b>
      <div className="flex flex-wrap gap-1">
        {values.map((value) => (
          <span
            key={value}
            className={cn(
              'rounded-full px-2 py-1 text-[9px] font-semibold',
              tone === 'new'
                ? 'bg-info-bg text-info'
                : 'bg-success-bg text-success',
            )}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}

function formatGrowthPeriod(period: AiProblemGrowthAnalysis['period']) {
  if (!period) return null
  const first = period.firstAt.slice(0, 10).replaceAll('-', '.')
  const last = period.lastAt.slice(0, 10).replaceAll('-', '.')
  return `${first} – ${last}`
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
  const growthPeriod = formatGrowthPeriod(problem.growth.period)

  return (
    <AiAnalysisPanel title="AI 문제해결·협업 종합 분석" className={className}>
      <div className="flex flex-col gap-3.5">
        <div className="text-fg-subtle flex flex-wrap items-center gap-x-1.5 text-[10px]">
          <span>인증 트러블슈팅 {problem.certifiedCaseCount}건</span>
          <span>
            · 동료평가 {problem.collaboration.evaluatorCount}명 / 완료 프로젝트{' '}
            {problem.collaboration.projectCount}건
          </span>
          <span>· {OVERALL_STATUS_LABEL[problem.status]}</span>
        </div>

        <section
          data-problem-narrative="troubleshooting"
          className="border-accent/25 bg-accent-bg/35 min-w-0 rounded-xl border p-5 sm:p-6"
        >
          <div className="border-accent/20 bg-surface/60 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <p className="text-fg-muted text-[10px] leading-4">
              세 분야는 역량 점수가 아니라 인증 문제해결 사례가 확인된
              범위입니다.
            </p>
            <EvidenceInfo
              label="문제해결 전체"
              evidence={capEvidence}
              limitations={[...capLimitations, ...problem.limitations]}
            />
          </div>

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
                  {cap.status === 'PARTIAL'
                    ? `인증 사례 ${cap.certifiedCaseCount}건의 직접 근거를 연결했습니다.`
                    : '이 분야로 분류된 인증 사례가 아직 없습니다.'}
                </p>
                <EvidenceInfo
                  label={cap.label}
                  evidence={cap.evidence}
                  limitations={cap.limitations}
                />
              </article>
            ))}
          </div>

          {problem.unmappedCaseCount > 0 && (
            <p className="text-fg-subtle mt-3 text-[10px] leading-4">
              세 분야로 명확히 분류되지 않은 인증 사례{' '}
              {problem.unmappedCaseCount}건도 분석 근거에서 보존했습니다.
            </p>
          )}

          <div className="border-border bg-surface/80 mt-4 rounded-xl border p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="text-accent-strong size-4" aria-hidden />
                <h4 className="text-fg text-[12px] font-bold">
                  문제해결 성장 흐름
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-fg-subtle text-[9px]">
                  {problem.growth.status === 'READY'
                    ? `${problem.growth.certifiedCaseCount}개 인증 사례 · ${
                        problem.growth.confidence === 'MEDIUM'
                          ? '반복 흐름'
                          : '초기 비교'
                      }`
                    : '비교 근거 준비 중'}
                </span>
                <EvidenceInfo
                  label="문제해결 성장"
                  evidence={problem.growth.evidence}
                  limitations={problem.growth.limitations}
                />
              </div>
            </div>
            <p className="text-fg-muted text-[11px] leading-5">
              {problem.growth.summary}
            </p>
            {growthPeriod && (
              <p className="text-fg-subtle mt-2 text-[9px]">
                분석 기간 {growthPeriod}
              </p>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <GrowthSignals
                label="새 분야"
                values={problem.growth.newDomains}
                tone="new"
              />
              <GrowthSignals
                label="반복 분야"
                values={problem.growth.repeatedDomains}
                tone="repeat"
              />
              <GrowthSignals
                label="새 기술"
                values={problem.growth.newTechnologies}
                tone="new"
              />
              <GrowthSignals
                label="반복 기술"
                values={problem.growth.repeatedTechnologies}
                tone="repeat"
              />
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
                <p className="text-fg-subtle mt-1 text-[9px] leading-4">
                  평가자 {problem.collaboration.evaluatorCount}명 · 완료
                  프로젝트 {problem.collaboration.projectCount}건
                </p>
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
                  {problem.collaboration.behaviorSignals.length > 0 ? (
                    problem.collaboration.behaviorSignals.map((signal) => (
                      <span
                        key={signal}
                        className="bg-info/10 text-info rounded-md px-2 py-1 text-[9px]"
                      >
                        {signal}
                      </span>
                    ))
                  ) : (
                    <span className="text-fg-subtle text-[9px]">
                      반복 확인된 행동 신호가 아직 없습니다.
                    </span>
                  )}
                </div>
              </div>

              {problem.collaboration.projectEvaluations.length > 0 && (
                <details className="group/projects border-border mt-3 border-t pt-3">
                  <summary className="text-info focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between rounded-sm text-[10px] font-bold focus-visible:ring-2 focus-visible:outline-none">
                    프로젝트별 동료평가 근거
                    <ChevronDown
                      className="size-3.5 transition-transform group-open/projects:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {problem.collaboration.projectEvaluations.map(
                      (project, index) => (
                        <article
                          key={project.projectId}
                          className="bg-surface-muted rounded-lg p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <b className="text-fg text-[10px]">
                              완료 프로젝트 {index + 1}
                            </b>
                            <span className="text-fg-subtle text-[9px]">
                              평가자 {project.evaluatorCount}명
                            </span>
                          </div>
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {Object.entries(project.axes).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between gap-2 text-[10px]"
                                >
                                  <dt className="text-fg-subtle">
                                    {
                                      COLLABORATION_AXIS_LABEL[
                                        key as keyof typeof COLLABORATION_AXIS_LABEL
                                      ]
                                    }
                                  </dt>
                                  <dd className="text-fg font-semibold">
                                    {value}
                                  </dd>
                                </div>
                              ),
                            )}
                          </dl>
                          <p className="text-fg-subtle mt-2 text-[9px]">
                            4축 평균 {project.average} · 평가 편차{' '}
                            {project.deviation}
                          </p>
                        </article>
                      ),
                    )}
                  </div>
                </details>
              )}

              {problem.collaboration.evidence.length > 0 && (
                <details className="group/evidence border-border mt-3 border-t pt-3">
                  <summary className="text-info focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between rounded-sm text-[10px] font-bold focus-visible:ring-2 focus-visible:outline-none">
                    익명화된 행동 근거
                    <ChevronDown
                      className="size-3.5 transition-transform group-open/evidence:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-[10px] leading-4">
                    {problem.collaboration.evidence.map((evidence, index) => (
                      <li key={`${evidence}-${index}`} className="flex gap-1.5">
                        <span aria-hidden>·</span>
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </section>
      </div>
    </AiAnalysisPanel>
  )
}
