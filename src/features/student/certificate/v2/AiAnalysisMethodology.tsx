import type { AiAnalysis } from '../ai'

function MethodCard({
  title,
  data,
  calculation,
}: {
  title: string
  data: string
  calculation: string
}) {
  return (
    <article className="border-border bg-surface rounded-xl border p-4">
      <h3 className="text-fg text-[14px] font-bold">{title}</h3>
      <dl className="mt-3 flex flex-col gap-3 text-[13px] leading-5">
        <div>
          <dt className="text-fg-subtle font-semibold">사용 데이터</dt>
          <dd className="text-fg-muted mt-1">{data}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle font-semibold">분석 방식</dt>
          <dd className="text-fg-muted mt-1">{calculation}</dd>
        </div>
      </dl>
    </article>
  )
}

export function AiAnalysisMethodology({ analysis }: { analysis: AiAnalysis }) {
  return (
    <section className="border-brand/20 bg-brand/5 rounded-2xl border p-5">
      <h2 className="text-fg text-[16px] font-bold">AI 분석 산출 기준</h2>
      <p className="text-fg-muted mt-1 text-[13px] leading-5">
        팀 단위 정보와 개인 근거를 분리하고, 확인 가능한 결과가 있는 항목만
        분석합니다.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <MethodCard
          title="직무 적합도"
          data="프로젝트 개인 역할, 인증 트러블슈팅·독립 해결, 직무 연관 80점 이상 성취"
          calculation="개인 역할 40% + 문제해결 30% + 상위 성취 20% + 교차 검증 10%"
        />
        <MethodCard
          title="프로젝트 AI 분석"
          data={`${analysis.projects.projectCount}개 완료·인증 프로젝트의 개인 역할, 문제해결, 결과 근거`}
          calculation="개인 역할 → 문제와 판단 → 검증 결과 → 실무 강점 순서로 연결"
        />
        <MethodCard
          title="트러블슈팅 분석"
          data={`${analysis.troubleshooting.certifiedCaseCount}개 인증 사례의 상황·해결·결과와 기술 태그`}
          calculation="반복 해결 행동과 독립 해결 여부를 분리해 문제해결 강점으로 요약"
        />
      </div>
    </section>
  )
}
