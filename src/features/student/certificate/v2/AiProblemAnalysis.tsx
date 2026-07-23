import { ListChecks, Tags, Trophy, UsersRound, Wrench } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type {
  AiProfileConfidence,
  CollaborationEvidenceStat,
  ProblemAi,
} from '../ai'
import { AnalysisEvidenceTooltip } from './AnalysisEvidenceTooltip'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const CONFIDENCE_LABEL: Record<AiProfileConfidence, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

function compactText(items: string[], fallback: string) {
  if (items.length === 0) return fallback
  const summary = items.slice(0, 2).join(' · ')
  const suffix = items.length > 2 ? ` 외 ${items.length - 2}건` : ''
  return `${summary}${suffix}`
}

function EvidenceInfo({
  label,
  evidence,
  limitations,
}: {
  label: string
  evidence?: string[]
  limitations?: string[]
}) {
  if (!evidence?.length && !limitations?.length) return null

  const evidenceSummary = label.includes('트러블슈팅 역량')
    ? '인증 트러블슈팅 본문·문제 유형·해결 결과'
    : compactText(evidence ?? [], '근거 없음')
  const calculation = label.includes('협업')
    ? '태그·코멘트 반복 확인'
    : label.includes('문제 근거')
      ? '인증 사례 수로 묶음'
      : '인증 본문 패턴 확인'

  return (
    <AnalysisEvidenceTooltip label={label} triggerClassName="size-4">
      <span>
        <b className="text-fg">사용 데이터</b>
        <span className="ml-1">{evidenceSummary}</span>
      </span>
      <span>
        <b className="text-fg">판단 근거</b>
        <span className="ml-1">
          {limitations?.[0] ? `제한: ${limitations[0]}` : '유효 근거만 반영'}
        </span>
      </span>
      <span>
        <b className="text-fg">계산 흐름</b>
        <span className="ml-1">{calculation}</span>
      </span>
      <span>
        <b className="text-fg">결과</b>
        <span className="ml-1">해당 항목 근거 확인</span>
      </span>
    </AnalysisEvidenceTooltip>
  )
}

function Confidence({ value }: { value: AiProfileConfidence }) {
  return (
    <span className="text-fg-subtle text-[9px]">
      근거 충분도 {CONFIDENCE_LABEL[value]}
    </span>
  )
}

function describeStats(stats: CollaborationEvidenceStat[], emptyText: string) {
  if (stats.length === 0) return emptyText
  return stats
    .slice(0, 5)
    .map(
      (stat) =>
        `${stat.label} ${stat.count}회(${stat.evaluationSharePercent}%)`,
    )
    .join(' · ')
}

export function AiProblemAnalysis({
  problem,
  className,
}: {
  problem: ProblemAi
  className?: string
}) {
  const status = problem.status ?? 'READY'
  const troubleshooting = problem.troubleshooting
  const collaboration = problem.collaboration
  const frequentProblemGroups = troubleshooting.problemGroups.filter(
    (group) => group.certifiedCaseCount >= 2,
  )
  const maxGroupCount = Math.max(
    0,
    ...frequentProblemGroups.map((group) => group.certifiedCaseCount),
  )

  if (status === 'NOT_READY') {
    return (
      <AiAnalysisPanel title="AI 문제해결·협업 종합 분석" className={className}>
        <p className="text-fg-muted text-[12px] leading-5">
          인증된 트러블슈팅 본문과 완료 프로젝트 동료평가 근거가 부족해 종합
          분석은 산출 전입니다.
        </p>
      </AiAnalysisPanel>
    )
  }

  return (
    <AiAnalysisPanel title="AI 문제해결·협업 종합 분석" className={className}>
      <div className="flex flex-col gap-3.5">
        <div className="text-fg-subtle flex flex-wrap items-center gap-x-1.5 text-[10px]">
          <span>인증 트러블슈팅 {problem.certifiedCaseCount}건</span>
          <span>· 동료평가 {problem.peerEvaluationCount}건</span>
          {status === 'PARTIAL' && <span>· 일부 근거만 반영</span>}
        </div>

        <div className="flex flex-col gap-4">
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
                    트러블슈팅 역량 · {troubleshooting.label}
                  </h3>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Confidence value={troubleshooting.confidence} />
                <EvidenceInfo
                  label="트러블슈팅 역량"
                  evidence={troubleshooting.evidence}
                  limitations={troubleshooting.limitations}
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="border-border bg-surface/80 rounded-xl border p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks
                    className="text-accent-strong size-4"
                    aria-hidden="true"
                  />
                  <h4 className="text-fg text-[12px] font-bold">
                    문제를 해결해 나가는 방식
                  </h4>
                </div>
                <p className="text-fg-muted text-[11px] leading-5">
                  {troubleshooting.problemSolvingSummary}
                </p>
                {troubleshooting.problemSolvingSteps.length > 0 && (
                  <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                    {troubleshooting.problemSolvingSteps.map((step, index) => (
                      <div
                        key={step.key}
                        className="border-border bg-surface-muted/45 rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-accent-bg text-accent-strong flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                            {index + 1}
                          </span>
                          <h5 className="text-fg text-[11px] font-bold">
                            {step.label}
                          </h5>
                        </div>
                        <p className="text-fg-muted mt-2 text-[10px] leading-4">
                          {step.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-border mt-5 border-t pt-4">
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                <Tags
                  className="text-accent-strong size-4"
                  aria-hidden="true"
                />
                <h4 className="text-fg text-[12px] font-bold">
                  많이 다룬 문제와 근거 태그
                </h4>
                <span className="text-fg-subtle text-[10px]">
                  문제 유형별 태그·인증 사례 연결
                </span>
              </div>
              {frequentProblemGroups.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {frequentProblemGroups.map((group) => {
                    const isTop = group.certifiedCaseCount === maxGroupCount
                    return (
                      <div
                        key={group.label}
                        className={cn(
                          'border-border bg-surface rounded-xl border p-3.5',
                          isTop && 'border-accent/30 bg-accent-bg/60',
                        )}
                      >
                        <div className="flex items-center gap-2 text-[11px]">
                          {isTop && (
                            <Trophy
                              className="text-accent-strong size-3 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="text-fg min-w-0 flex-1 font-bold">
                            {group.label}
                          </span>
                          <span className="text-fg-muted shrink-0">
                            {group.certifiedCaseCount}건
                          </span>
                          <EvidenceInfo
                            label={`${group.label} 문제 근거`}
                            evidence={group.evidence}
                          />
                        </div>
                        <div className="mt-3">
                          <span className="text-fg-subtle block text-[9px] font-bold">
                            이 문제를 해결한 방식
                          </span>
                          <p className="text-fg-muted mt-1 text-[10px] leading-4">
                            {group.solutionSummary}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {group.tags.map((tag) => (
                            <span
                              key={tag.label}
                              className="bg-surface-muted text-fg-muted rounded-md px-2 py-1 text-[9px]"
                            >
                              #{tag.label}
                              {tag.count > 1 ? ` · ${tag.count}건` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-fg-subtle text-[11px] leading-5">
                  2건 이상 반복해 다룬 문제 유형과 근거 태그가 없습니다.
                </p>
              )}
            </div>
          </section>

          <section
            data-problem-narrative="collaboration"
            className="border-info/20 bg-info-bg/25 min-w-0 rounded-xl border p-4 sm:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2.3fr)] lg:items-start">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="bg-info/10 text-info flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <UsersRound className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-fg-subtle block text-[9px] font-semibold">
                      협업 스타일
                    </span>
                    <h3 className="text-fg text-[14px] font-bold">
                      {collaboration.label}
                    </h3>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Confidence value={collaboration.confidence} />
                  <EvidenceInfo
                    label="협업 스타일"
                    evidence={collaboration.evidence}
                    limitations={collaboration.limitations}
                  />
                </div>
              </div>

              <div className="border-border min-w-0 border-t pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
                <p className="text-fg-muted text-[11px] leading-5">
                  {collaboration.summary}
                </p>
                <div className="border-border mt-3 flex flex-col gap-1.5 border-t pt-3 text-[10px] leading-4">
                  <p className="text-fg-muted">
                    <span className="text-fg mr-1.5 font-bold">태그 근거</span>
                    {describeStats(
                      collaboration.tagStats,
                      '집계할 동료평가 태그가 없습니다.',
                    )}
                  </p>
                  <p className="text-fg-muted">
                    <span className="text-fg mr-1.5 font-bold">
                      코멘트 근거
                    </span>
                    {describeStats(
                      collaboration.behaviorStats,
                      '정량화할 반복 코멘트 행동이 없습니다.',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AiAnalysisPanel>
  )
}
