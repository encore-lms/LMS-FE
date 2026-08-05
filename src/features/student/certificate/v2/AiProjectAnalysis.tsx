import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
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
    <article className="border-border bg-surface overflow-hidden rounded-xl border">
      <div className="border-border bg-surface-muted border-b px-5 py-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <span className="text-accent-strong text-[12px] font-bold">
              대표 프로젝트 {project.order}
            </span>
            <h3 className="text-fg mt-1 text-[16px] leading-6 font-bold">
              {project.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="bg-accent-bg text-accent-strong rounded-lg px-2.5 py-1.5 text-[12px] font-semibold">
              역할 · {project.personalEvidence.workCategories[0] ?? '개인 수행'}
            </span>
            {project.teamContext.domain && (
              <span className="bg-surface text-fg-muted rounded-lg px-2.5 py-1.5 text-[12px]">
                프로젝트 맥락 · {project.teamContext.domain}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-border grid gap-px lg:grid-cols-2">
        <section className="bg-surface p-5">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness
              className="text-accent-strong size-4"
              aria-hidden="true"
            />
            <h4 className="text-fg text-[14px] font-bold">개인 역할</h4>
          </div>
          <p className="text-fg-muted mt-2 text-[14px] leading-6">
            {insight.role}
          </p>
        </section>

        <section className="bg-surface p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-warning size-4" aria-hidden="true" />
            <h4 className="text-fg text-[14px] font-bold">문제와 판단</h4>
          </div>
          <p className="text-fg-muted mt-2 text-[14px] leading-6">
            {insight.challenge ?? '인증된 문제해결 근거가 없는 프로젝트입니다.'}
          </p>
          {insight.action && (
            <p className="text-fg mt-2 text-[13px] leading-5 font-semibold">
              {insight.action}
            </p>
          )}
        </section>

        <section className="bg-surface p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-success size-4" aria-hidden="true" />
            <h4 className="text-fg text-[14px] font-bold">검증된 결과</h4>
          </div>
          <p className="text-fg-muted mt-2 text-[14px] leading-6">
            {insight.outcome ?? '확인 가능한 결과 근거가 아직 없습니다.'}
          </p>
        </section>

        <section className="bg-accent-bg p-5">
          <div className="flex items-center gap-2">
            <Sparkles
              className="text-accent-strong size-4"
              aria-hidden="true"
            />
            <h4 className="text-accent-strong text-[14px] font-bold">
              AI가 해석한 실무 강점
            </h4>
          </div>
          <p className="text-fg mt-2 text-[14px] leading-6 font-semibold">
            {insight.strength}
          </p>
        </section>
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

  return (
    <AiAnalysisPanel
      index="02"
      title="프로젝트 AI 분석"
      description="단순 이력 나열이 아니라 개인 역할, 문제 판단, 검증 결과를 연결해 실무 강점을 분석했습니다."
      className={className}
    >
      <section className="bg-brand text-on-color rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="bg-on-color/15 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-on-color/75 text-[12px] font-bold">
              AI가 종합한 프로젝트 경쟁력
            </span>
            <h3 className="mt-1 text-[18px] leading-7 font-bold">
              {projects.recruiterSummary.headline}
            </h3>
            <p className="text-on-color/90 mt-2 text-[14px] leading-6">
              {projects.recruiterSummary.summary}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        {representativeProjects.map((project) => (
          <ProjectCard key={project.projectId} project={project} />
        ))}
      </div>

      {projects.projects.length > representativeProjects.length && (
        <details className="border-border bg-surface rounded-xl border">
          <summary className="text-fg flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[14px] font-bold">
            나머지 인증 프로젝트{' '}
            {projects.projects.length - representativeProjects.length}개 보기
            <ChevronDown className="text-fg-muted size-4" aria-hidden="true" />
          </summary>
          <div className="border-border grid gap-3 border-t p-4 md:grid-cols-2">
            {projects.projects
              .filter(
                (project) =>
                  !representativeProjects.some(
                    (representative) =>
                      representative.projectId === project.projectId,
                  ),
              )
              .map((project) => (
                <article
                  key={project.projectId}
                  className="bg-surface-muted rounded-lg p-4"
                >
                  <span className="text-accent-strong text-[12px] font-bold">
                    {project.order}차 프로젝트
                  </span>
                  <h3 className="text-fg mt-1 text-[14px] leading-5 font-bold">
                    {project.name}
                  </h3>
                  <p className="text-fg-muted mt-2 text-[13px] leading-5">
                    {project.recruiterInsight.strength}
                  </p>
                </article>
              ))}
          </div>
        </details>
      )}
    </AiAnalysisPanel>
  )
}
