import {
  ArrowUpRight,
  CalendarRange,
  CheckCircle2,
  Info,
  Link2,
  Route,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiProfileConfidence, AiProjects } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const CONFIDENCE_LABEL: Record<AiProfileConfidence, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

function monthLabel(value: string) {
  const [year, month] = value.split('-')
  return year && month ? `${year}.${month}` : value
}

function insightMeta(key: string | undefined) {
  switch (key) {
    case 'CONTINUITY':
      return {
        icon: Link2,
        iconClassName: 'bg-accent/10 text-accent-strong',
      }
    case 'EXPANSION':
      return { icon: ArrowUpRight, iconClassName: 'bg-info/10 text-info' }
    case 'VALIDATION':
      return {
        icon: CheckCircle2,
        iconClassName: 'bg-success/10 text-success',
      }
    default:
      return { icon: Route, iconClassName: 'bg-surface-muted text-fg-muted' }
  }
}

function EvidenceInfo({
  label,
  evidence,
  limitations,
  projectNames,
  result,
  calculation,
  dataSource,
}: {
  label: string
  evidence?: string[]
  limitations?: string[]
  projectNames?: string[]
  result: string
  calculation: string
  dataSource: string
}) {
  const hasDetail = Boolean(
    evidence?.length || limitations?.length || projectNames?.length,
  )
  if (!hasDetail) return null

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
        className="border-border bg-surface text-fg-muted pointer-events-none absolute top-full right-0 z-20 mt-1.5 hidden w-72 max-w-[calc(100vw-4rem)] rounded-lg border p-3 text-[11px] leading-4 font-normal shadow-lg group-focus-within:block group-hover:block"
      >
        <span className="text-fg mb-1.5 block font-bold">
          {label} 분석 근거
        </span>
        <span className="grid gap-2">
          <span>
            <b className="text-fg">사용 데이터</b>
            <br />
            {dataSource}
          </span>
          <span>
            <b className="text-fg">판단 근거</b>
            <br />
            {projectNames && projectNames.length > 0
              ? `연결 프로젝트: ${projectNames.join(' · ')} · ${compactProjectEvidence(evidence, '유효 근거 확인')}`
              : compactProjectEvidence(evidence, '프로젝트별 유효 근거만 반영')}
          </span>
          <span>
            <b className="text-fg">계산 흐름</b>
            <br />
            {calculation}
          </span>
          <span>
            <b className="text-fg">결과</b>
            <br />
            {result}
          </span>
        </span>
        {limitations?.map((item) => (
          <span key={item} className="border-border mt-2 block border-t pt-2">
            제한: {item}
          </span>
        ))}
      </span>
    </span>
  )
}

function compactProjectEvidence(items: string[] | undefined, fallback: string) {
  if (!items?.length) return fallback
  const visible = items.slice(0, 2).join(' · ')
  return items.length > 2 ? `${visible} 외 ${items.length - 2}건` : visible
}

export function AiProjectAnalysis({
  projects,
  className,
}: {
  projects: AiProjects
  className?: string
}) {
  const timeline = projects.projects.map((project) => ({
    projectId: project.projectId,
    phase: `프로젝트 ${project.order}`,
    startedAt: project.period.startedAt,
    endedAt: project.period.endedAt,
    name: project.name,
    evidence: project.evidenceCodes,
    contribution: project.analysis,
    domain: project.teamContext.domain ?? '도메인 미분류',
    role: project.membershipRole === 'OWNER' ? '프로젝트 리더' : '팀원',
    themes: project.teamContext.techStacks,
    workCategories: project.personalEvidence.tasks,
    usedTechnologies: project.teamContext.techStacks,
  }))
  const groups = projects.groups.map((group, index) => ({
    ...group,
    key: ['CONTINUITY', 'EXPANSION', 'VALIDATION'][index],
    confidence: 'MEDIUM' as const,
    evidence: projects.projects.flatMap((project) => project.evidenceCodes),
    limitations: projects.limitations,
    projectNames: projects.projects.map((project) => project.name),
  }))
  const projectCount = timeline.length
  const period =
    timeline.length > 0
      ? {
          startedAt: timeline[0].startedAt,
          endedAt: timeline.at(-1)?.endedAt ?? timeline[0].endedAt,
        }
      : null
  const confidence: AiProfileConfidence =
    projects.status === 'READY'
      ? 'HIGH'
      : projects.status === 'PARTIAL'
        ? 'MEDIUM'
        : 'LOW'
  const evidence = projects.projects.flatMap((project) => project.evidenceCodes)
  const hasProject = timeline.length > 0
  const canShowJourneySummary = timeline.length >= 2
  const groupGridClassName =
    groups.length >= 3
      ? 'md:grid-cols-3'
      : groups.length === 2
        ? 'sm:grid-cols-2'
        : 'grid-cols-1'

  if (!hasProject) {
    return null
  }

  return (
    <AiAnalysisPanel title="AI 프로젝트 분석" className={className}>
      <div className="flex flex-col gap-3.5">
        {projectCount > 0 && (
          <div className="text-fg-subtle flex items-center gap-1.5 text-[10px]">
            <CalendarRange className="size-3.5" aria-hidden="true" />
            <span>개인 근거 확인 프로젝트 {projectCount}개</span>
            {period && (
              <span>
                · {monthLabel(period.startedAt)} - {monthLabel(period.endedAt)}
              </span>
            )}
          </div>
        )}

        {timeline.length > 0 && (
          <div className="overflow-x-auto pb-1">
            <ol className="flex min-w-full items-stretch">
              {timeline.map((project, index) => (
                <li
                  key={project.projectId}
                  data-project-timeline-item={project.projectId}
                  className="relative flex min-w-56 flex-1 flex-col pt-7 pr-4 last:pr-0"
                >
                  {index < timeline.length - 1 && (
                    <span className="bg-accent/25 absolute top-[9px] right-0 left-3 h-px" />
                  )}
                  <span className="border-accent-strong bg-surface absolute top-1 left-0 z-10 size-3 rounded-full border-2" />
                  <span className="text-accent-strong absolute top-0 left-5 text-[9px] font-bold">
                    {project.phase}
                  </span>

                  <article className="border-border bg-surface flex h-full min-w-0 flex-col rounded-xl border p-3.5">
                    <div className="text-fg-subtle flex flex-wrap items-center gap-x-1.5 text-[9px]">
                      <span>{monthLabel(project.startedAt)}</span>
                      <span>–</span>
                      <span>{monthLabel(project.endedAt)}</span>
                    </div>
                    <p className="text-fg text-[12px] leading-5 font-bold">
                      {project.name}
                      <EvidenceInfo
                        label={project.name}
                        evidence={project.evidence}
                        result={project.contribution}
                        dataSource="인증 프로젝트, 프로젝트 참여 정보, 본인 수행업무, 개인 활용기술, 프로젝트 상호평가, 인증 트러블슈팅"
                        calculation="본인 수행업무·개인 활용기술 분류 → 프로젝트 상호평가·인증 트러블슈팅을 같은 프로젝트 ID로 교차 확인"
                      />
                    </p>
                    <p className="text-fg-muted text-[10px] leading-4">
                      {project.domain} · {project.role}
                    </p>
                    {project.themes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.themes.map((theme) => (
                          <span
                            key={theme}
                            className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 text-[9px] font-semibold"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="border-border mt-3 flex flex-col gap-2 border-t pt-2.5">
                      <div data-project-work-categories>
                        <span className="text-fg-subtle block text-[9px] font-semibold">
                          본인 수행업무
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {project.workCategories.map((category) => (
                            <span
                              key={category}
                              className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div data-project-used-technologies>
                        <span className="text-fg-subtle block text-[9px] font-semibold">
                          개인 활용기술
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {project.usedTechnologies.map((technology) => (
                            <span
                              key={technology}
                              className="bg-info/10 text-info rounded px-1.5 py-0.5 text-[9px] font-semibold"
                            >
                              {technology}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="border-border text-fg-muted mt-3 border-t pt-2.5 text-[10px] leading-4">
                      {project.contribution}
                    </p>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        )}

        {canShowJourneySummary && (
          <section
            data-project-journey-summary
            className="border-accent/20 bg-surface overflow-hidden rounded-xl border"
          >
            <div className="border-border flex items-center gap-2 border-b px-4 py-3">
              <Route
                className="text-accent-strong size-3.5"
                aria-hidden="true"
              />
              <h3 className="text-fg text-[12px] font-bold">
                프로젝트 궤적 요약
              </h3>
            </div>

            <div
              className={
                groups.length > 0
                  ? 'grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,2.05fr)]'
                  : undefined
              }
            >
              <div className="bg-accent-bg/35 p-4 lg:min-h-full">
                <div className="mb-1.5 flex min-h-4 items-center gap-1.5">
                  <span className="text-accent-strong text-[10px] font-bold">
                    전체 궤적
                  </span>
                  <span className="text-fg-subtle text-[9px]">
                    근거 충분도 {CONFIDENCE_LABEL[confidence]}
                  </span>
                  <EvidenceInfo
                    label="전체 궤적"
                    evidence={evidence}
                    limitations={projects.limitations}
                    result={projects.summary}
                    dataSource="인증 프로젝트 전체 목록, 프로젝트 참여 정보, 본인 수행업무, 개인 활용기술, 인증 트러블슈팅"
                    calculation="프로젝트별 개인 근거 확인 → 반복 수행축·확장 범위·검증 근거를 종합"
                  />
                </div>
                <p className="text-fg text-[12px] leading-5 font-semibold">
                  {projects.summary}
                </p>
              </div>

              {groups.length > 0 && (
                <div
                  className={cn(
                    'border-border grid border-t lg:border-t-0 lg:border-l',
                    groupGridClassName,
                  )}
                >
                  {groups.map((group, index) => {
                    const meta = insightMeta(group.key)
                    const Icon = meta.icon
                    return (
                      <article
                        key={group.key ?? group.label}
                        data-project-insight={group.key ?? group.label}
                        className={cn(
                          'min-w-0 p-4',
                          index > 0 && 'border-border border-l',
                        )}
                      >
                        <div className="mb-2.5 flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              'flex size-7 shrink-0 items-center justify-center rounded-lg',
                              meta.iconClassName,
                            )}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <div className="flex items-center gap-1">
                            {group.confidence && (
                              <span className="text-fg-subtle text-[9px]">
                                근거 {CONFIDENCE_LABEL[group.confidence]}
                              </span>
                            )}
                            <EvidenceInfo
                              label={group.label}
                              evidence={group.evidence}
                              limitations={group.limitations}
                              projectNames={group.projectNames}
                              result={group.summary}
                              dataSource="인증 프로젝트, 본인 수행업무, 개인 활용기술, 프로젝트 상호평가, 인증 트러블슈팅"
                              calculation={
                                group.key === 'CONTINUITY'
                                  ? '2개 이상 프로젝트에서 반복된 본인 수행업무·개인 활용기술을 집계'
                                  : group.key === 'EXPANSION'
                                    ? '첫 프로젝트 이후 새로 등장한 수행업무·개인 활용기술을 비교'
                                    : '본인 수행업무·개인 활용기술·상호평가·트러블슈팅을 프로젝트 ID로 교차 확인'
                              }
                            />
                          </div>
                        </div>
                        <h4 className="text-fg text-[11px] font-bold">
                          {group.label}
                        </h4>
                        <p className="text-fg-muted mt-1 text-[10px] leading-4">
                          {group.summary}
                        </p>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AiAnalysisPanel>
  )
}
