import { DataBoundary } from '@/components/ui/DataBoundary'
import { ProjectsTabSkeleton } from './TabSkeletons'
import { Link } from 'react-router-dom'
import { useIsPublicCertDoc } from '../publicDoc'
import { useCertificateProjects } from '../../api/certificate'
import type {
  CertProjectDetail,
  CertProjectGithubStatus,
  CertProjectsTab,
} from '../types'
import {
  ProjectContribution,
  type ProjectContributionActivity,
} from '../v2/ProjectContribution'
import { TabHead } from './TechTab'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

const githubStatusLabel: Record<CertProjectGithubStatus, string> = {
  CONNECTED: 'GitHub 연결됨',
  INSTALLATION_PENDING: 'GitHub 설치 대기',
  PERMISSION_REQUIRED: 'GitHub 권한 필요',
  DISCONNECTED: '연결된 GitHub 없음',
}

function formatPeriod(startDate: string, endDate: string | null) {
  return `${startDate} ~ ${endDate ?? '진행 중'}`
}

function formatSyncTime(value: string | null) {
  if (!value) return '동기화 시각 없음'
  return value.replace('T', ' ').slice(0, 16)
}

function toWeeklyGrid(project: CertProjectDetail) {
  return project.repositories.flatMap<ProjectContributionActivity>((repo) => {
    if (repo.dailyActivity.length === 0) return []

    const daily = [...repo.dailyActivity].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
    const grid = Array.from(
      { length: Math.ceil(daily.length / 7) },
      (_, weekIndex) =>
        daily
          .slice(weekIndex * 7, weekIndex * 7 + 7)
          .map((item) => item.commits),
    )

    return [
      {
        id: `${project.projectId}:${repo.githubRepositoryId}`,
        selectorLabel: `${project.title} · ${repo.fullName}`,
        name: `${project.title} — ${repo.fullName}`,
        period: formatPeriod(project.startDate, project.endDate),
        weeksLabel: `${grid.length}주`,
        certified: project.certificationStatus === 'CERTIFIED',
        grid,
        totalCommits: repo.myCommits,
        repositoryTotalCommits: repo.totalCommits,
        activeDays: repo.activeDays,
        totalDays: daily.length,
        longestStreak: repo.longestStreak,
        weeklyAvg: repo.weeklyAverage,
        contrib: `${repo.commitContributionRate}%`,
        metricLabel: '커밋 기여율',
        metricValue: `${repo.commitContributionRate}%`,
        note: `ⓘ ${repo.analysisBranch ?? '분석 브랜치 미지정'} 브랜치에서 내 커밋 ${repo.myCommits}개 ÷ 전체 ${repo.totalCommits}개로 계산한 커밋 기준 기여율입니다. 프로젝트 기간 기준 · ${formatSyncTime(repo.lastSyncedAt)}`,
      },
    ]
  })
}

function ProjectCard({
  project,
  index,
}: {
  project: CertProjectDetail
  index: number
}) {
  const certified = project.certificationStatus === 'CERTIFIED'
  // 공개 문서에서는 워크스페이스로 이동하지 않는다 — 외부 검증자는 LMS 계정이 없다.
  const isPublic = useIsPublicCertDoc()
  const cardClass = `${card} border-brand focus-visible:ring-brand flex flex-col gap-3 border-t-2 transition-transform focus-visible:ring-2 focus-visible:outline-none`

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-brand text-[11px] font-bold tracking-wider">
          PROJECT {index + 1}
        </span>
        {certified && (
          <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
            ✓ 강사 인증
          </span>
        )}
        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-semibold">
          {project.projectStatus}
        </span>
      </div>

      <span className="text-fg text-[17px] font-bold">{project.title}</span>

      <div className="text-fg flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
        <span className="whitespace-nowrap">
          <span className="text-fg-subtle">기간 </span>
          {formatPeriod(project.startDate, project.endDate)}
        </span>
        <span className="whitespace-nowrap">
          <span className="text-fg-subtle">역할 </span>
          {project.responsibility ?? '등록 전'}
        </span>
        <span className="whitespace-nowrap">
          <span className="text-fg-subtle">팀 </span>
          {project.teamSize}명 · {project.membershipRole}
        </span>
        {project.domain && (
          <span className="whitespace-nowrap">
            <span className="text-fg-subtle">도메인 </span>
            {project.domain}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.techStackGroups.flatMap((group) =>
          group.items.map((item) => (
            <span
              key={`${group.category}:${item}`}
              className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
            >
              {item}
            </span>
          )),
        )}
      </div>

      {project.outcomes.length > 0 && (
        <div className="bg-brand/5 flex flex-col gap-1.5 rounded-[10px] p-3.5">
          <span className="text-fg text-[12px] font-bold">핵심 성과</span>
          {project.outcomes.map((outcome) => (
            <span
              key={outcome}
              className="text-fg-muted flex gap-1.5 text-[12px]"
            >
              <span className="text-brand">•</span>
              {outcome}
            </span>
          ))}
        </div>
      )}

      <div className="border-divider flex flex-col gap-2 border-t pt-3">
        <span className="text-fg-muted text-[11px] font-semibold">
          {githubStatusLabel[project.githubStatus]}
        </span>
        {project.repositories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {project.repositories.map((repo) => (
              <span
                key={repo.githubRepositoryId}
                className="border-border text-fg-muted rounded-md border px-2 py-1 text-[10px] font-medium"
              >
                {repo.fullName} · {repo.analysisBranch ?? '브랜치 미지정'} ·{' '}
                {repo.isPublicForMe ? '공개 허용' : '비공개'}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-fg-subtle text-[10px]">
            프로젝트 정보는 유지되며 GitHub 활동만 표시하지 않습니다.
          </span>
        )}
      </div>
    </>
  )

  if (isPublic) {
    return <div className={cardClass}>{body}</div>
  }

  return (
    <Link
      to={`/student/projects/${project.projectId}`}
      aria-label={`${project.title} 프로젝트 워크스페이스로 이동`}
      className={`${cardClass} hover:-translate-y-0.5`}
    >
      {body}
    </Link>
  )
}

function ProjectsContent({ data }: { data: CertProjectsTab }) {
  const activities = data.projects.flatMap(toWeeklyGrid)

  return (
    <>
      <section
        aria-label="프로젝트 전체 요약"
        data-project-summary
        className="border-border bg-surface overflow-hidden rounded-2xl border"
      >
        <div className="border-divider border-b px-5 py-4 sm:px-6">
          <h3 className="text-fg text-sm font-bold">프로젝트 경험 요약</h3>
          <p className="text-fg-muted mt-1 text-[11px] leading-4">
            프로젝트 워크스페이스에 저장된 역할과 활용 기술을 기준으로
            보여줍니다.
          </p>
        </div>

        <div className="divide-divider grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <article
            data-project-summary-item="projects"
            className="flex min-w-0 flex-col gap-2 px-5 py-5 sm:px-6"
          >
            <span className="text-fg-muted text-[11px] font-semibold">
              프로젝트
            </span>
            <strong className="text-fg text-[24px] leading-none tabular-nums">
              {data.summary.totalProjectCount}건
            </strong>
            <span className="text-fg-subtle text-[11px] leading-4">
              완료 {data.summary.completedProjectCount}건 · 인증{' '}
              {data.summary.certifiedProjectCount}건
            </span>
          </article>

          <article
            data-project-summary-item="role"
            className="flex min-w-0 flex-col gap-2 px-5 py-5 sm:px-6"
          >
            <span className="text-fg-muted text-[11px] font-semibold">
              주요 역할
            </span>
            {data.summary.responsibilities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.summary.responsibilities.map((role) => (
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
              워크스페이스에 등록된 수행 역할
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
              총{' '}
              {
                new Set(
                  data.summary.techStackGroups.flatMap((group) => group.items),
                ).size
              }
              개 기술
            </span>
          </div>

          {data.summary.techStackGroups.length > 0 ? (
            <div
              data-tech-stack-groups
              className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {data.summary.techStackGroups.map((group) => (
                <div key={group.category} className="flex flex-col gap-1.5">
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

      {data.projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.projects.map((project, index) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              index={index}
            />
          ))}
        </div>
      ) : (
        <section className={`${card} text-fg-muted text-sm`}>
          등록된 프로젝트가 없습니다.
        </section>
      )}

      {activities.length > 0 && <ProjectContribution activities={activities} />}
    </>
  )
}

export function ProjectsTab({ p }: { p?: CertProjectsTab }) {
  const projects = useCertificateProjects(!p)
  const data = p ?? projects.data

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={3}
        title="프로젝트"
        sub="워크스페이스 역할·기술·성과와 연결된 GitHub 활동을 확인"
      >
        {data && (
          <span className="text-fg-muted text-[11px] font-semibold">
            ● 인증 {data.summary.certifiedProjectCount} /{' '}
            {data.summary.totalProjectCount}
          </span>
        )}
      </TabHead>

      <DataBoundary
        isPending={!p && projects.isPending}
        isError={!p && (projects.isError || !projects.data)}
        onRetry={() => void projects.refetch()}
        skeleton={<ProjectsTabSkeleton />}
        errorTitle="프로젝트 증명 데이터를 불러오지 못했어요"
        errorDescription="프로젝트 워크스페이스와 GitHub 동기화 상태를 확인한 뒤 다시 시도해 주세요."
      >
        {data && <ProjectsContent data={data} />}
      </DataBoundary>
    </div>
  )
}
