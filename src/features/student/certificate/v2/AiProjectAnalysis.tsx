import { ChevronDown, Sparkles } from 'lucide-react'
import type { AiProjectSnapshot, AiProjects } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

function evidenceStrength(project: AiProjectSnapshot) {
  return (
    project.personalEvidence.tasks.length * 2 +
    project.personalEvidence.troubleshootingCases.length * 3 +
    project.personalEvidence.peerObservations.length +
    project.teamContext.outcomes.length
  )
}

function ProjectCard({ project }: { project: AiProjectSnapshot }) {
  const insight = project.recruiterInsight

  return (
    <article className="border-info/25 bg-surface overflow-hidden rounded-2xl border shadow-sm">
      <header className="border-info/20 bg-info-bg/60 border-b px-5 py-4 sm:px-6">
        <span className="text-info text-[12px] font-bold">
          대표 프로젝트 {String(project.order).padStart(2, '0')}
        </span>
        <h3 className="text-fg mt-1 text-[18px] leading-7 font-bold">
          {project.name}
        </h3>
      </header>

      <div className="p-5 sm:p-6">
        <section className="bg-info text-on-color rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <span className="text-on-color/80 text-[12px] font-bold">
                이 프로젝트에서 읽히는 실무 강점
              </span>
              <p className="mt-1 text-[16px] leading-7 font-bold">
                {insight.strength}
              </p>
            </div>
          </div>
        </section>

        <div className="border-border bg-surface-muted mt-4 overflow-hidden rounded-2xl border">
          <div className="divide-border grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <div className="flex flex-col gap-5 p-5">
              <section>
                <h4 className="text-fg-subtle text-[12px] font-bold">
                  개인 역할
                </h4>
                <p className="text-fg mt-1.5 text-[14px] leading-6 font-semibold">
                  {insight.role}
                </p>
              </section>
              <section className="border-border border-t pt-5">
                <h4 className="text-fg-subtle text-[12px] font-bold">
                  문제와 판단
                </h4>
                <p className="text-fg-muted mt-1.5 text-[14px] leading-6">
                  {insight.challenge ??
                    '해석할 수 있는 문제해결 맥락이 아직 충분하지 않습니다.'}
                </p>
                {insight.action && (
                  <p className="text-fg mt-2 text-[14px] leading-6 font-semibold">
                    {insight.action}
                  </p>
                )}
              </section>
            </div>

            <div className="flex flex-col gap-5 p-5">
              <section>
                <h4 className="text-fg-subtle text-[12px] font-bold">
                  검증된 결과
                </h4>
                <p className="text-fg mt-1.5 text-[14px] leading-6 font-semibold">
                  {insight.outcome ??
                    '확인 가능한 결과가 쌓이면 분석에 반영됩니다.'}
                </p>
              </section>
              <section className="border-border border-t pt-5">
                <h4 className="text-fg-subtle text-[12px] font-bold">
                  AI 종합 해석
                </h4>
                <p className="text-fg-muted mt-1.5 text-[14px] leading-6">
                  {insight.summary}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function AiProjectAnalysis({
  projects,
  className,
}: {
  projects: AiProjects
  className?: string
}) {
  if (projects.projects.length === 0) return null

  const representativeProjects = [...projects.projects]
    .sort((a, b) => evidenceStrength(b) - evidenceStrength(a))
    .slice(0, 2)
  const remainingProjects = projects.projects.filter(
    (project) =>
      !representativeProjects.some(
        (representative) => representative.projectId === project.projectId,
      ),
  )

  return (
    <AiAnalysisPanel
      id="ai-project-analysis"
      index="02"
      tone="info"
      title="프로젝트 분석"
      description="프로젝트 이력을 다시 나열하지 않고, 프로젝트마다 맡은 역할과 판단, 결과가 어떤 실무 강점으로 이어지는지 분석했습니다."
      className={className}
    >
      <section className="bg-info text-on-color rounded-2xl p-5 sm:p-6">
        <span className="text-on-color/80 text-[12px] font-bold">
          AI가 종합한 프로젝트 경쟁력
        </span>
        <h3 className="mt-1 text-[20px] leading-8 font-bold">
          {projects.recruiterSummary.headline}
        </h3>
        <p className="text-on-color/90 mt-2 max-w-4xl text-[14px] leading-6">
          {projects.recruiterSummary.summary}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {representativeProjects.map((project) => (
          <ProjectCard key={project.projectId} project={project} />
        ))}
      </div>

      {remainingProjects.length > 0 && (
        <details className="border-info/20 bg-info-bg/35 rounded-2xl border">
          <summary className="text-fg flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[14px] font-bold">
            나머지 프로젝트 분석 {remainingProjects.length}개 보기
            <ChevronDown className="text-info size-4" aria-hidden="true" />
          </summary>
          <div className="border-info/20 grid gap-3 border-t p-4 md:grid-cols-2">
            {remainingProjects.map((project) => (
              <article
                key={project.projectId}
                className="bg-surface rounded-xl p-4"
              >
                <h3 className="text-fg text-[14px] leading-5 font-bold">
                  {project.name}
                </h3>
                <p className="text-fg-muted mt-2 text-[13px] leading-5">
                  {project.recruiterInsight.summary}
                </p>
              </article>
            ))}
          </div>
        </details>
      )}
    </AiAnalysisPanel>
  )
}
