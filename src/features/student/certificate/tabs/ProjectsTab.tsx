import { cn } from '@/shared/lib/cn'
import type { CertProjectCard, CertProjectsTab } from '../types'
import { TabHead } from './TechTab'
import { CERT_V2 } from '../config'
import { ProjectContribution } from '../v2/ProjectContribution'
import { LmsFeGithubProjectCard } from '../github/LmsFeGithubProject'
import { useLmsFeGithubProject } from '../github/useLmsFeGithubProject'
import { useLmsProjectMetrics } from '../github/useLmsProjectMetrics'

// 증명서 탭3 프로젝트 — 프로젝트 카드·기여 히트맵.
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
const HEAT = ['bg-surface-muted', 'bg-brand/30', 'bg-brand/60', 'bg-brand']

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function groupedTechStacks(projects: CertProjectCard[]) {
  const grouped = new Map<string, Set<string>>()

  projects.forEach((project) => {
    const groups = project.techStackGroups?.length
      ? project.techStackGroups
      : [{ category: '기타', items: project.tags }]

    groups.forEach((group) => {
      const items = grouped.get(group.category) ?? new Set<string>()
      group.items.forEach((item) => items.add(item))
      grouped.set(group.category, items)
    })
  })

  return [...grouped].map(([category, items]) => ({
    category,
    items: [...items],
  }))
}

export function ProjectsTab({ p }: { p: CertProjectsTab }) {
  const githubProject = useLmsFeGithubProject()
  const lmsProject = useLmsProjectMetrics()
  const githubActivity = githubProject.data
    ? {
        id: 'github-lms-fe-junseok-dev',
        name: 'LMS-FE — 수강역량증명서 프론트엔드',
        period: `${githubProject.data.createdAt.slice(0, 10)} ~ ${githubProject.data.pushedAt.slice(0, 10)}`,
        weeksLabel: '12주',
        certified: false,
        grid: githubProject.data.grid.map((week) =>
          week.map((day) => day.count),
        ),
        totalCommits: githubProject.data.authorCommitCount,
        activeDays: githubProject.data.activeDays,
        totalDays: githubProject.data.totalDays,
        longestStreak: githubProject.data.longestStreak,
        weeklyAvg: githubProject.data.weeklyAverage,
        contrib: `${githubProject.data.commitContributionRate}%`,
        metricLabel: '커밋 기여율',
        metricValue: `${githubProject.data.commitContributionRate}%`,
        note: `ⓘ @${githubProject.data.authorLogin} 커밋 ${githubProject.data.authorCommitCount}개 ÷ develop 전체 ${githubProject.data.projectCommitCount}개로 계산한 커밋 기준 기여율입니다. 잔디·활동일·주 평균은 최근 12주 기준입니다.`,
      }
    : null
  const contributionActivities = [
    ...(p.commitActivity ?? []),
    ...(githubActivity ? [githubActivity] : []),
  ]
  const roles = unique(p.projects.map((project) => project.role))
  const techStackGroups = groupedTechStacks(p.projects)
  const techStackCount = unique(
    techStackGroups.flatMap((group) => group.items),
  ).length
  const contributionRate = Math.min(
    100,
    Math.max(0, Number.parseFloat(p.contribAvg) || 0),
  )

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={3}
        title="프로젝트"
        sub="전체 프로젝트·역할·기여도·기술 스택을 한눈에 확인"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 인증 {p.certifiedLabel}
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 기여도 평균 {p.contribAvg}
        </span>
      </TabHead>

      <section
        aria-label="프로젝트 전체 요약"
        data-project-summary
        className="border-border bg-surface overflow-hidden rounded-2xl border"
      >
        <div className="border-divider border-b px-5 py-4 sm:px-6">
          <h3 className="text-fg text-sm font-bold">프로젝트 경험 요약</h3>
          <p className="text-fg-muted mt-1 text-[11px] leading-4">
            인증된 프로젝트에서 맡은 역할과 평균 기여도, 활용 기술을 모아
            보여줍니다.
          </p>
        </div>

        <div className="divide-divider grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <article
            data-project-summary-item="projects"
            className="flex min-w-0 flex-col gap-2 px-5 py-5 sm:px-6"
          >
            <span className="text-fg-muted text-[11px] font-semibold">
              프로젝트
            </span>
            <strong className="text-fg text-[24px] leading-none tabular-nums">
              {p.projects.length}건
            </strong>
            <span className="text-fg-subtle text-[11px] leading-4">
              등록 프로젝트 중 {p.certifiedLabel} 인증 완료
            </span>
          </article>

          <article
            data-project-summary-item="contribution"
            className="flex min-w-0 flex-col gap-2 px-5 py-5 sm:px-6"
          >
            <span className="text-fg-muted text-[11px] font-semibold">
              평균 기여도
            </span>
            <strong className="text-fg text-[24px] leading-none tabular-nums">
              {p.contribAvg}
            </strong>
            <div className="flex flex-col gap-1.5">
              <span
                role="progressbar"
                aria-label="전체 프로젝트 평균 기여도"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={contributionRate}
                className="bg-surface-muted h-1.5 overflow-hidden rounded-full"
              >
                <span
                  className="bg-brand block h-full rounded-full"
                  style={{ width: `${contributionRate}%` }}
                />
              </span>
              <span className="text-fg-subtle text-[11px] leading-4">
                등록된 프로젝트 기여도의 평균
              </span>
            </div>
          </article>

          <article
            data-project-summary-item="role"
            className="flex min-w-0 flex-col gap-2 px-5 py-5 sm:px-6"
          >
            <span className="text-fg-muted text-[11px] font-semibold">
              주요 역할
            </span>
            {roles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="bg-accent-bg text-accent-strong rounded-md px-2 py-1 text-[11px] font-semibold"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <strong className="text-fg text-[18px] leading-snug">
                등록 전
              </strong>
            )}
            <span className="text-fg-subtle text-[11px] leading-4">
              프로젝트에서 담당한 역할 {roles.length}개
            </span>
          </article>
        </div>

        <article
          data-project-summary-item="tech-stack"
          className="border-divider border-t px-5 py-5 sm:px-6"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <h4 className="text-fg text-xs font-bold">활용 기술</h4>
              <p className="text-fg-muted mt-1 text-[11px] leading-4">
                프로젝트에서 사용한 기술을 분야별로 정리했습니다.
              </p>
            </div>
            <span className="text-fg-subtle text-[11px] font-semibold">
              총 {techStackCount}개 기술
            </span>
          </div>

          {techStackGroups.length > 0 ? (
            <div
              data-tech-stack-groups
              className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {techStackGroups.map((group) => (
                <div
                  key={group.category}
                  className="flex min-w-0 flex-col gap-1.5"
                >
                  <span className="text-fg-subtle text-[10px] font-semibold">
                    {group.category}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="bg-success-bg text-success rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-fg-subtle mt-4 block text-[11px]">
              등록된 기술 스택이 없습니다.
            </span>
          )}
        </article>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {p.projects.map((pj) => (
          <section
            key={pj.id}
            className={cn(card, 'border-brand flex flex-col gap-3 border-t-2')}
          >
            <div className="flex items-center gap-2">
              <span className="text-brand text-[11px] font-bold tracking-wider">
                {pj.badge}
              </span>
              {pj.certified && (
                <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
                  ✓ 감사 인증
                </span>
              )}
            </div>
            <span className="text-fg text-[17px] font-bold">{pj.title}</span>
            {/* 라벨+값 사이 공백에서 끊기지 않게 항목 단위로만 줄바꿈시킨다 */}
            <div className="text-fg flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
              <span className="whitespace-nowrap">
                <span className="text-fg-subtle">시간 </span>
                {pj.period}
              </span>
              <span className="whitespace-nowrap">
                <span className="text-fg-subtle">역할 </span>
                {pj.role}
              </span>
              <span className="whitespace-nowrap">
                <span className="text-fg-subtle">기여도 </span>
                <b>{pj.contrib}</b>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pj.tags.map((tg) => (
                <span
                  key={tg}
                  className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
                >
                  {tg}
                </span>
              ))}
            </div>
            <div className="bg-brand/5 flex flex-col gap-1.5 rounded-[10px] p-3.5">
              <span className="text-fg text-[12px] font-bold">핵심 성과</span>
              {pj.outcomes.map((o, i) => (
                <span
                  key={i}
                  className="text-fg-muted flex gap-1.5 text-[12px]"
                >
                  <span className="text-brand">•</span>
                  {o}
                </span>
              ))}
            </div>
          </section>
        ))}
        <LmsFeGithubProjectCard
          data={githubProject.data}
          isPending={githubProject.isPending}
          error={githubProject.error}
          onRetry={() => void githubProject.refetch()}
          lmsProject={lmsProject.data}
          isLmsPending={lmsProject.isPending}
          lmsError={lmsProject.error}
        />
      </div>

      {/* v2: 프로젝트별 커밋 잔디밭(선택형) — 켜지면 아래 집계 매트릭스 대신 노출 */}
      {CERT_V2 && contributionActivities.length > 0 && (
        <ProjectContribution activities={contributionActivities} />
      )}

      {!(CERT_V2 && p.commitActivity) && (
        <section className={cn(card, 'flex flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            Contribution Matrix
          </span>
          <span className="text-fg-subtle text-[11px]">
            최근 12주 · 일별 커밋 활동
          </span>
          <div className="grid grid-cols-12 gap-1">
            {p.matrix.map((v, i) => (
              <span
                key={i}
                className={cn(
                  'aspect-square rounded-[3px]',
                  HEAT[v] ?? HEAT[0],
                )}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
