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
  const jobSource = analysis.jobFit.sourceData
  const jobSourceEvidence = jobSource
    ? [
        `관심 직무 ${jobSource.interestedJobs.length}개`,
        `기술 태그 ${jobSource.skillTags.length}개`,
        `프로젝트 도메인 ${jobSource.projectDomains.length}개`,
        `이론 이해도 ${jobSource.theoryCategories.length}개 카테고리`,
        `승인 자격증 ${jobSource.certifications.length}개`,
      ].join(' · ')
    : `${jobFitEvidence}${theoryEvidence ? ` · 이론 평가: ${theoryEvidence}` : ''}`
  const projectAnalysis = analysis.projects.aggregateAnalysis
  const projectContribution = projectAnalysis?.contribution
  const projectEvidence = projectAnalysis
    ? [
        projectContribution?.totalBoardTaskCount === null
          ? `보드 담당 업무 ${projectContribution.assignedTaskCount}개`
          : `보드 전체 ${projectContribution?.totalBoardTaskCount}개 중 담당 ${projectContribution?.assignedTaskCount}개 · 완료 ${projectContribution?.completedAssignedTaskCount}개`,
        `본인 작성 수행·기여 ${projectAnalysis.selfReviewStatements.length}건`,
        `프로젝트 역할 ${projectAnalysis.rolePatterns.length}종`,
        `동료평가 ${projectAnalysis.peerAxes.length}축`,
      ].join(' · ')
    : '보드 담당 업무 · 본인 작성 수행·기여 · 프로젝트 역할 · 동료평가 4축 연동 대기'
  const troubleshootingGroups = analysis.troubleshooting.groups
    .map((group) => `${group.label} ${group.certifiedCaseCount}건`)
    .join(' · ')
  const troubleshootingSource = analysis.troubleshooting.sourceData
  const troubleshootingEvidence = troubleshootingSource
    ? [
        `카테고리 ${troubleshootingSource.categories.length}개`,
        `상황·해결·결과 ${troubleshootingSource.cases.length}건`,
        `중앙 ${troubleshootingSource.medianDays}일 · 평균 ${troubleshootingSource.averageDays}일`,
        `독립 ${troubleshootingSource.independentCaseCount}건 · 협업 ${troubleshootingSource.supportedCaseCount}건`,
      ].join(' · ')
    : troubleshootingGroups || '인증 트러블슈팅 없음'

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
          data={jobSourceEvidence}
          method="고정 직무군에서 서로 다른 데이터 출처가 같은 방향을 반복해서 지지하는 후보를 우선합니다. 이론 이해도와 승인 자격증은 검증 근거, 기술 태그는 방향 신호, 관심 직무와 프로젝트 도메인은 보조 맥락으로 사용하며 미선택·미보유 항목은 감점하지 않습니다."
          result={
            primary
              ? `${primary.jobLabel} · ${primary.workType} · 적합도 ${primary.fitScore}점`
              : '분석 준비 중'
          }
        />
        <MethodCard
          index="02"
          title="프로젝트 분석"
          data={projectEvidence}
          method="전체 프로젝트에서 반복된 역할과 업무, 보드 담당·완료 범위, 본인이 작성한 수행·기여를 연결합니다. 프로젝트 스타일은 동료평가의 기술/기술기여·소통/협업/팀워크·문제해결·책임감 4축 평균만 사용하며 멘토·강사·운영 평가는 제외합니다."
          result="전체 프로젝트 수행 스타일 · 동료평가 4축 유형 · 프로젝트별 성장·확장 · 핵심 강점"
        />
        <MethodCard
          index="03"
          title="문제해결 역량 분석"
          data={troubleshootingEvidence}
          method="트러블슈팅 카테고리와 마스킹된 상황·해결·결과를 연결하고, 중앙 소요일과 독립·협업 해결 분포를 함께 비교해 반복 성향·강점 영역·확장 방향을 분석합니다."
          result={analysis.troubleshooting.summary}
        />
      </div>
    </section>
  )
}
