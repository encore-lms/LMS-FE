import type { AiAnalysis } from '../ai'

function MethodCard({
  index,
  title,
  data,
  method,
  result,
}: {
  index: string
  title: string
  data: string
  method: string
  result: string
}) {
  return (
    <article className="border-border bg-surface rounded-xl border p-4">
      <span className="text-accent-strong text-[12px] font-bold">{index}</span>
      <h3 className="text-fg mt-1 text-[14px] font-bold">{title}</h3>
      <dl className="mt-3 flex flex-col gap-3 text-[13px] leading-5">
        <div>
          <dt className="text-fg-subtle font-semibold">사용 데이터</dt>
          <dd className="text-fg-muted mt-1">{data}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle font-semibold">분석 방식</dt>
          <dd className="text-fg-muted mt-1">{method}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle font-semibold">산출 결과</dt>
          <dd className="text-fg-muted mt-1">{result}</dd>
        </div>
      </dl>
    </article>
  )
}

export function AiAnalysisMethodology({ analysis }: { analysis: AiAnalysis }) {
  const primary = analysis.jobFit.primaryRole
  const jobFitEvidence = primary
    ? primary.evidence.join(' · ')
    : '직무 적합도 분석에 필요한 개인 수행 결과가 아직 부족합니다.'
  const theoryEvidence = primary?.theoryUnderstanding?.categories
    .map(
      (item) =>
        `${item.category} ${item.score}점 · 반영 비중 ${item.weightPercent}%`,
    )
    .join(' · ')
  const projectNames = analysis.projects.projects
    .map((project) => project.name)
    .join(' · ')
  const troubleshootingGroups = analysis.troubleshooting.groups
    .map((group) => `${group.label} ${group.certifiedCaseCount}건`)
    .join(' · ')

  return (
    <section className="border-accent/20 bg-accent-bg/30 rounded-2xl border p-5">
      <h2 className="text-fg text-[16px] font-bold">AI 분석 기준</h2>
      <p className="text-fg-muted mt-1 text-[13px] leading-5">
        본문에는 AI가 해석한 결과만 표시합니다. 아래에서 사용한 원천과 분석
        방식을 확인할 수 있습니다.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <MethodCard
          index="01"
          title="직무 적합도"
          data={`${jobFitEvidence}${theoryEvidence ? ` · 이론 평가: ${theoryEvidence}` : ''}`}
          method="직무 후보는 개인 역할 40% + 인증 문제해결 30% + 80점 이상 직무 연관 성취 20% + 교차 검증 10%로 정렬합니다. 이론 이해도는 직무별 관련 평가 전체를 가중 평균하며 미응시 영역은 제외합니다."
          result={
            primary
              ? `${primary.jobLabel} · ${primary.workType} · 적합도 ${primary.fitScore}점`
              : '분석 준비 중'
          }
        />
        <MethodCard
          index="02"
          title="프로젝트 분석"
          data={projectNames || '완료·인증 프로젝트 없음'}
          method="프로젝트별 개인 역할 → 문제와 판단 → 검증 결과 → 실무 강점을 연결"
          result={analysis.projects.recruiterSummary.headline}
        />
        <MethodCard
          index="03"
          title="문제해결 역량 분석"
          data={troubleshootingGroups || '인증 트러블슈팅 없음'}
          method="상황·해결·결과를 연결하고 반복된 해결 행동과 확장 방향을 분석"
          result={analysis.troubleshooting.summary}
        />
      </div>
    </section>
  )
}
