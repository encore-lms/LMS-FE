import { cn } from '@/shared/lib/cn'
import type { CertProjectsTab } from '../types'
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

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={3}
        title="프로젝트"
        sub="대표 프로젝트 2건 인증 완료 · 기여도 평균 36%"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 인증 {p.certifiedLabel}
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 기여도 평균 {p.contribAvg}
        </span>
      </TabHead>

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
