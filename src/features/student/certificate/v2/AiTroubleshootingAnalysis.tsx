import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import type { AiTroubleshooting } from '../ai'
import { AiAnalysisEvidence } from './AiAnalysisEvidence'
import { AiAnalysisPanel } from './AiAnalysisPanel'

function coreText(value: string, maxLength = 56) {
  const compact = value.replaceAll(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength).trim()}…`
}

export function AiTroubleshootingAnalysis({
  troubleshooting,
}: {
  troubleshooting: AiTroubleshooting
}) {
  if (troubleshooting.status === 'NOT_READY') return null

  const primaryGroup = [...troubleshooting.groups].sort(
    (a, b) => b.certifiedCaseCount - a.certifiedCaseCount,
  )[0]
  const sourceData = troubleshooting.sourceData
  const existingAnalysisEvidence = [
    `인증 사례 · ${troubleshooting.certifiedCaseCount}건`,
    `해결 역량 영역 · ${troubleshooting.axes
      .map((axis) => `${axis.label} ${axis.certifiedCaseCount}건`)
      .join(' · ')}`,
    `반복 해결 방식 · ${troubleshooting.groups
      .slice(0, 3)
      .map((group) => `${group.label}: ${coreText(group.solutionSummary, 28)}`)
      .join(' · ')}`,
  ]
  const tendencyEvidence = [
    ...(sourceData
      ? [
          `문제 카테고리 · ${sourceData.categories
            .map((category) => `${category.label} ${category.count}건`)
            .join(' · ')}`,
          `해결 소요일 · 중앙 ${sourceData.medianDays}일 · 평균 ${sourceData.averageDays}일`,
          `해결 방식 · 독립 ${sourceData.independentCaseCount}건 · 협업 ${sourceData.supportedCaseCount}건`,
        ]
      : []),
    ...existingAnalysisEvidence,
  ]
  const stepEvidence = (index: number) => [
    ...(sourceData?.cases.slice(0, 3).map((item) => {
      if (index === 0) return `${item.title} · ${coreText(item.situation)}`
      if (index === 1) return `${item.title} · ${coreText(item.resolution)}`
      return `${item.title} · ${coreText(item.result)}`
    }) ?? []),
  ]
  const primaryGroupEvidence = primaryGroup
    ? [
        `${primaryGroup.label} · 인증 사례 ${primaryGroup.certifiedCaseCount}건`,
        `반복 해결 방식 · ${primaryGroup.solutionSummary}`,
        `대표 사례 · ${primaryGroup.caseTitles.slice(0, 3).join(' · ')}`,
        `기술 신호 · ${primaryGroup.tags
          .map((tag) => `${tag.label} ${tag.count}건`)
          .join(' · ')}`,
        `검증 결과 · ${primaryGroup.evidence.join(' · ')}`,
      ]
    : []
  const growthEvidence = troubleshooting.growth
    ? [
        `반복 도메인 · ${troubleshooting.growth.repeatedDomains.join(' · ') || '없음'}`,
        `새 도메인 · ${troubleshooting.growth.newDomains.join(' · ') || '없음'}`,
        `반복 기술 · ${troubleshooting.growth.repeatedTechnologies.join(' · ') || '없음'}`,
        `새 기술 · ${troubleshooting.growth.newTechnologies.join(' · ') || '없음'}`,
      ]
    : []

  return (
    <AiAnalysisPanel
      id="ai-troubleshooting-analysis"
      index="03"
      tone="brown"
      title="문제해결 역량 분석"
      description="문제를 구조화하고 해결·검증하는 방식과 역량의 확장 흐름을 AI가 분석했습니다."
    >
      <section className="border-brown/25 bg-surface text-fg rounded-2xl border p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="bg-brown text-on-color flex size-10 shrink-0 items-center justify-center rounded-xl">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-brown flex items-center gap-1 text-[12px] font-bold">
              <span>AI가 읽은 문제해결 성향</span>
              <AiAnalysisEvidence
                label="문제해결 성향"
                evidence={tendencyEvidence}
                flow={[
                  '카테고리·소요일·독립/협업 해결 분포를 집계',
                  '반복된 접근 방식과 해결 성향을 함께 요약',
                ]}
              />
            </span>
            <p className="mt-2 max-w-4xl text-[17px] leading-7 font-bold whitespace-pre-line">
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
          <ol className="border-brown/20 bg-surface mt-3 grid overflow-hidden rounded-2xl border md:grid-cols-3">
            {troubleshooting.steps.slice(0, 3).map((step, index) => (
              <li
                key={step.key}
                className="border-brown/15 relative px-5 py-5 md:border-l md:first:border-l-0"
              >
                <span className="bg-brown text-on-color flex size-7 items-center justify-center rounded-lg text-[12px] font-bold">
                  {index + 1}
                </span>
                <span className="mt-3 flex items-center gap-1">
                  <h4 className="text-fg text-[14px] font-bold">
                    {step.label}
                  </h4>
                  <AiAnalysisEvidence
                    label={step.label}
                    evidence={stepEvidence(index)}
                    flow={
                      index === 0
                        ? [
                            '상황에서 재현 조건과 영향 범위를 추출',
                            '반복된 문제 구조화 방식을 요약',
                          ]
                        : index === 1
                          ? [
                              '해결 내용에서 원인별 적용 행동을 추출',
                              '반복된 해결 적용 방식을 요약',
                            ]
                          : [
                              '결과에서 수치와 재발 확인 내용을 추출',
                              '반복된 검증 방식을 요약',
                            ]
                    }
                  />
                </span>
                <p className="text-fg-muted mt-1.5 text-[14px] leading-6">
                  {step.summary}
                </p>
                {index < Math.min(troubleshooting.steps.length, 3) - 1 && (
                  <ArrowRight
                    className="text-brown/30 absolute top-1/2 -right-3 z-10 hidden size-5 md:block"
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
            <span className="text-brown flex items-center gap-1 text-[12px] font-bold">
              <span>가장 선명한 해결 영역</span>
              <AiAnalysisEvidence
                label="가장 선명한 해결 영역"
                evidence={primaryGroupEvidence}
                flow={[
                  '인증 사례를 카테고리별로 집계',
                  '가장 자주 반복되고 결과가 확인된 영역을 선정',
                ]}
              />
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
          <section className="border-brown/20 bg-surface rounded-2xl border p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="text-brown size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="text-brown text-[12px] font-bold">
                확장되는 문제해결 범위
              </span>
              <AiAnalysisEvidence
                label="확장되는 문제해결 범위"
                evidence={growthEvidence}
                flow={[
                  '초기와 최근 사례의 도메인·기술을 비교',
                  '새로 등장한 해결 범위를 확장 신호로 요약',
                ]}
              />
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
