import { ChevronDown, Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiProjectSnapshot, AiProjectStatus, AiProjects } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const STATUS_LABEL: Record<AiProjectStatus, string> = {
  READY: '근거 충분',
  PARTIAL: '일부 근거',
  NOT_READY: '분석 준비 중',
}

const OVERALL_STATUS_LABEL: Record<AiProjectStatus, string> = {
  READY: '프로젝트 근거 충분',
  PARTIAL: '프로젝트 근거 일부 확인',
  NOT_READY: '프로젝트 분석 준비 중',
}

const STATUS_CLASS: Record<AiProjectStatus, string> = {
  READY: 'bg-success-bg text-success',
  PARTIAL: 'bg-warning-bg text-warning',
  NOT_READY: 'bg-surface-muted text-fg-subtle',
}

function formatPeriod(period: AiProjectSnapshot['period']) {
  return `${period.startedAt.replaceAll('-', '.')} – ${period.endedAt.replaceAll('-', '.')}`
}

function LimitationsTooltip({ limitations }: { limitations: string[] }) {
  if (limitations.length === 0) return null

  return (
    <span className="group relative shrink-0">
      <button
        type="button"
        className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex size-5 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        aria-label="프로젝트 분석 기준 보기"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="border-border bg-surface text-fg-muted pointer-events-none absolute top-full right-0 z-30 mt-1.5 hidden w-64 max-w-[calc(100vw-4rem)] rounded-lg border p-3 text-[11px] leading-4 font-normal [overflow-wrap:anywhere] shadow-lg group-focus-within:block group-hover:block sm:w-72"
      >
        <span className="text-fg mb-1.5 block font-bold">분석 기준</span>
        <span className="flex flex-col gap-1.5">
          {limitations.map((item, index) => (
            <span key={`${item}-${index}`} className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{item}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <b className="text-fg text-[11px]">{title}</b>
      <ul className="text-fg-muted flex flex-col gap-1 text-[11px] leading-4">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-1.5">
            <span aria-hidden="true">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function hasPersonalEvidence(project: AiProjectSnapshot) {
  const evidence = project.personalEvidence
  return (
    evidence.tasks.length > 0 ||
    evidence.peerObservations.length > 0 ||
    evidence.troubleshootingCases.length > 0 ||
    evidence.artifacts.length > 0
  )
}

function ProjectCard({ project }: { project: AiProjectSnapshot }) {
  const hasPersonal = hasPersonalEvidence(project)

  return (
    <article className="border-border bg-surface flex min-w-0 flex-col gap-3 rounded-xl border p-3">
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-fg text-[12px] leading-5 font-bold">
            {project.name}
          </h3>
          <span className="text-fg-subtle text-[10px]">
            {formatPeriod(project.period)}
            {project.teamContext.domain
              ? ` · ${project.teamContext.domain}`
              : ''}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[9px] font-semibold">
            인증 완료
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[9px] font-semibold',
              STATUS_CLASS[project.status],
            )}
          >
            {STATUS_LABEL[project.status]}
          </span>
        </div>
      </header>

      <p
        className={cn(
          'text-[11px] leading-4',
          project.status === 'NOT_READY' ? 'text-fg-subtle' : 'text-fg-muted',
        )}
      >
        {project.analysis}
      </p>

      <details className="group/details border-divider border-t pt-2">
        <summary className="text-accent-strong focus-visible:ring-ring flex list-none items-center justify-between rounded-sm text-[11px] font-semibold focus-visible:ring-2 focus-visible:outline-none">
          프로젝트 근거 자세히 보기
          <ChevronDown
            className="size-3.5 transition-transform group-open/details:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <section className="bg-surface-muted flex min-w-0 flex-col gap-2.5 rounded-lg p-3">
            <b className="text-fg text-[11px]">팀 프로젝트 문맥</b>
            {project.teamContext.scope && (
              <p className="text-fg-muted text-[11px] leading-4">
                {project.teamContext.scope}
              </p>
            )}
            {project.teamContext.techStacks.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.teamContext.techStacks.map((stack) => (
                  <span
                    key={stack}
                    className="bg-surface text-fg-muted rounded px-1.5 py-0.5 text-[9px] font-medium"
                  >
                    {stack}
                  </span>
                ))}
              </div>
            )}
            <EvidenceList
              title="팀 결과"
              items={project.teamContext.outcomes.map((outcome) =>
                outcome.replace(/^팀 결과 ·\s*/, ''),
              )}
            />
          </section>

          <section className="border-success/30 bg-success-bg/40 flex min-w-0 flex-col gap-2.5 rounded-lg border p-3">
            <b className="text-fg text-[11px]">개인 수행 근거</b>
            {hasPersonal ? (
              <>
                <EvidenceList
                  title="수행 기록"
                  items={project.personalEvidence.tasks}
                />
                <EvidenceList
                  title="동료 관찰"
                  items={project.personalEvidence.peerObservations}
                />
                <EvidenceList
                  title="인증 문제해결"
                  items={project.personalEvidence.troubleshootingCases}
                />
                <EvidenceList
                  title="검증 산출물"
                  items={project.personalEvidence.artifacts}
                />
              </>
            ) : (
              <span className="text-fg-subtle text-[11px] leading-4">
                개인 수행을 설명할 직접 근거가 아직 충분하지 않습니다.
              </span>
            )}
          </section>
        </div>

        {project.limitations.length > 0 && (
          <div className="border-divider mt-3 flex flex-col gap-1 border-t pt-2">
            <b className="text-fg-subtle text-[10px]">해석 제한</b>
            <ul className="text-fg-subtle flex flex-col gap-1 text-[10px] leading-4">
              {project.limitations.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-1.5">
                  <span aria-hidden="true">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </article>
  )
}

export function ProjectAnalysis({ projects }: { projects: AiProjects }) {
  return (
    <AiAnalysisPanel title="AI 프로젝트 분석" className="min-w-0 flex-1">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-end gap-1.5">
          <span
            className={cn(
              'rounded px-2 py-1 text-[10px] font-semibold',
              STATUS_CLASS[projects.status],
            )}
          >
            {OVERALL_STATUS_LABEL[projects.status]}
          </span>
          <LimitationsTooltip limitations={projects.limitations} />
        </div>

        <p className="text-fg-muted text-[12px] leading-5">
          {projects.overview.overall}
        </p>

        {projects.projects.length > 0 ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="bg-surface flex flex-col gap-1 rounded-xl p-3">
                <b className="text-accent-strong text-[10px]">경험 범위</b>
                <span className="text-fg-muted text-[11px] leading-4">
                  {projects.overview.experienceScope}
                </span>
              </div>
              <div className="bg-surface flex flex-col gap-1 rounded-xl p-3">
                <b className="text-accent-strong text-[10px]">수행 방식</b>
                <span className="text-fg-muted text-[11px] leading-4">
                  {projects.overview.workingStyle}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {projects.projects.map((project) => (
                <ProjectCard key={project.projectId} project={project} />
              ))}
            </div>
          </>
        ) : (
          <div className="border-border bg-surface flex flex-col gap-1 rounded-xl border p-3">
            <b className="text-fg text-[11px]">완료·인증 프로젝트 준비 중</b>
            <span className="text-fg-subtle text-[11px] leading-4">
              {projects.overview.experienceScope}
            </span>
          </div>
        )}
      </div>
    </AiAnalysisPanel>
  )
}
