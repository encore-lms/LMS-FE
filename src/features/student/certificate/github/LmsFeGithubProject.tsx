import { ExternalLink, GitBranch, RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import {
  LMS_FE_REPOSITORY,
  type LmsFeGithubProjectData,
} from './lmsFeGithubApi'
import type { LmsRepositoryProjectData } from './lmsProjectMetricsApi'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function activityCell(day: {
  count: number
  isFuture: boolean
  isBeforeRepository: boolean
}) {
  if (day.isFuture || day.isBeforeRepository) return 'bg-surface-muted/40'
  if (day.count <= 0) return 'bg-surface-muted'
  if (day.count <= 2) return 'bg-brand/30'
  if (day.count <= 4) return 'bg-brand/60'
  return 'bg-brand'
}

export function LmsFeGithubProjectCard({
  data,
  isPending,
  error,
  onRetry,
  lmsProject,
  isLmsPending,
  lmsError,
}: {
  data?: LmsFeGithubProjectData
  isPending: boolean
  error: Error | null
  onRetry: () => void
  lmsProject?: LmsRepositoryProjectData
  isLmsPending: boolean
  lmsError: Error | null
}) {
  if (isPending) {
    return (
      <section
        className={cn(card, 'border-info flex flex-col gap-3 border-t-2')}
        aria-label="PROJECT 3 GitHub 데이터 로딩 중"
      >
        <span className="text-info text-[11px] font-bold tracking-wider">
          PROJECT 3 · GITHUB API
        </span>
        <div className="bg-surface-muted h-5 w-2/3 animate-pulse rounded" />
        <span className="text-fg-subtle text-[12px]">
          LMS-FE 저장소 정보를 불러오는 중입니다.
        </span>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section
        className={cn(card, 'border-danger flex flex-col gap-3 border-t-2')}
      >
        <span className="text-danger text-[11px] font-bold tracking-wider">
          PROJECT 3 · GITHUB API
        </span>
        <span className="text-fg text-[17px] font-bold">LMS-FE</span>
        <p className="text-fg-muted text-[12px]">
          {error?.message ?? 'GitHub 저장소 정보를 불러오지 못했습니다.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="border-border text-fg-muted hover:bg-surface-muted flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
        >
          <RefreshCw className="size-3.5" aria-hidden /> 다시 시도
        </button>
        <LmsProjectMetrics
          repository={LMS_FE_REPOSITORY}
          data={lmsProject}
          isPending={isLmsPending}
          error={lmsError}
        />
      </section>
    )
  }

  return (
    <section className={cn(card, 'border-info flex flex-col gap-3 border-t-2')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-info text-[11px] font-bold tracking-wider">
            PROJECT 3
          </span>
          <span className="bg-info-bg text-info rounded px-1.5 py-0.5 text-[10px] font-bold">
            GitHub 실데이터
          </span>
        </div>
        <a
          href={data.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="text-fg-muted hover:text-info flex items-center gap-1 text-[11px] font-semibold"
        >
          저장소 보기 <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <GitBranch className="text-fg size-5" aria-hidden />
        <span className="text-fg text-[17px] font-bold">{data.fullName}</span>
      </div>
      <p className="text-fg-muted text-[12px]">{data.description}</p>

      <div className="text-fg flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
        <span>
          <span className="text-fg-subtle">기간 </span>
          {formatDate(data.createdAt)} — {formatDate(data.pushedAt)}
        </span>
        <span>
          <span className="text-fg-subtle">역할 </span>
          {lmsProject?.status === 'MATCHED'
            ? (lmsProject.role ?? 'LMS 역할 미등록')
            : 'LMS 프로젝트 미연결'}
        </span>
        <span>
          <span className="text-fg-subtle">활동 기준 </span>
          커밋 기여율 {data.commitContributionRate}%
        </span>
      </div>

      {lmsProject?.status === 'MATCHED' && lmsProject.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lmsProject.techStack.map((tag) => (
            <span
              key={tag}
              className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <LmsProjectMetrics
        repository={data.fullName}
        data={lmsProject}
        isPending={isLmsPending}
        error={lmsError}
      />
    </section>
  )
}

function LmsProjectMetrics({
  repository,
  data,
  isPending,
  error,
}: {
  repository: string
  data?: LmsRepositoryProjectData
  isPending: boolean
  error: Error | null
}) {
  return (
    <div className="bg-info-bg flex flex-col gap-1.5 rounded-[10px] p-3.5">
      <span className="text-fg text-[12px] font-bold">
        LMS 프로젝트 성과지표
      </span>
      {isPending && (
        <span className="text-fg-muted text-[12px]">
          저장소와 연결된 LMS 프로젝트를 확인하는 중입니다.
        </span>
      )}
      {error && (
        <span className="text-danger text-[12px]">
          LMS 프로젝트 성과지표를 확인하지 못했습니다.
        </span>
      )}
      {!isPending && !error && data?.status === 'MATCHED' && (
        <>
          <span className="text-fg-subtle text-[11px]">
            {data.projectTitle} · GitHub 산출물 정확히 일치
          </span>
          {data.metrics.length > 0 ? (
            data.metrics.map((metric) => (
              <span key={metric.label} className="text-fg-muted text-[12px]">
                <span className="text-info">•</span> {metric.label}:{' '}
                {metric.before} → {metric.after} ({metric.delta})
              </span>
            ))
          ) : (
            <span className="text-fg-muted text-[12px]">
              연결된 LMS 프로젝트에 등록된 성과지표가 없습니다.
            </span>
          )}
        </>
      )}
      {!isPending && !error && data?.status === 'NOT_REGISTERED' && (
        <span className="text-fg-muted text-[12px]">
          LMS 프로젝트에 {repository} 저장소가 GitHub 산출물로 아직 등록되지
          않았습니다. 성과지표를 임의로 생성하지 않습니다.
        </span>
      )}
      {!isPending && !error && data?.status === 'AMBIGUOUS' && (
        <span className="text-danger text-[12px]">
          같은 저장소가 LMS 프로젝트 {data.matchedProjectCount}개에 등록되어
          성과지표를 연결하지 않았습니다.
        </span>
      )}
    </div>
  )
}

export function LmsFeGithubActivity({
  data,
  isPending,
  error,
  onRetry,
}: {
  data?: LmsFeGithubProjectData
  isPending: boolean
  error: Error | null
  onRetry: () => void
}) {
  if (isPending) {
    return (
      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          프로젝트 3 커밋 활동
        </span>
        <div className="bg-surface-muted h-24 animate-pulse rounded-xl" />
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          프로젝트 3 커밋 활동
        </span>
        <p className="text-fg-muted text-[12px]">
          {error?.message ?? 'GitHub 커밋 활동을 불러오지 못했습니다.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="border-border text-fg-muted hover:bg-surface-muted flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
        >
          <RefreshCw className="size-3.5" aria-hidden /> 다시 시도
        </button>
      </section>
    )
  }

  const activePercentage =
    data.totalDays > 0
      ? Math.round((data.activeDays / data.totalDays) * 100)
      : 0
  const stats = [
    { label: '총 커밋', value: `${data.totalCommits}` },
    { label: '조회 기간', value: '최근 12주' },
    {
      label: '활동일',
      value: `${data.activeDays}/${data.totalDays}일`,
      sub: `${activePercentage}%`,
    },
    { label: '최장 연속', value: `${data.longestStreak}일` },
    { label: '주 평균', value: `${data.weeklyAverage}` },
    { label: '기준 브랜치', value: data.activityBranch },
  ]

  return (
    <section className={cn(card, 'flex flex-col gap-4')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-fg text-[15px] font-bold">
            프로젝트 3 커밋 활동
          </span>
          <span className="text-fg-subtle text-[11px]">
            {data.fullName} · {data.activityBranch} · 저장소 전체 커밋
          </span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold"
          aria-label="프로젝트 3 GitHub 커밋 활동 새로고침"
        >
          <RefreshCw className="size-3.5" aria-hidden /> 새로고침
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {data.grid.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day) => (
              <span
                key={day.date}
                className={cn(
                  'size-3 shrink-0 rounded-[2px]',
                  activityCell(day),
                )}
                title={`${day.date} · ${day.count} 커밋`}
                aria-label={`${day.date} ${day.count}개 커밋`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="text-fg-subtle flex items-center gap-1.5 text-[10px]">
        적음
        <span className="bg-surface-muted size-3 rounded-[2px]" />
        <span className="bg-brand/30 size-3 rounded-[2px]" />
        <span className="bg-brand/60 size-3 rounded-[2px]" />
        <span className="bg-brand size-3 rounded-[2px]" />
        많음
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-border bg-surface flex flex-col gap-0.5 rounded-xl border p-3"
          >
            <span className="text-fg-subtle text-[11px]">{stat.label}</span>
            <span className="text-fg text-[16px] font-bold">{stat.value}</span>
            {stat.sub && (
              <span className="text-brand text-[10px] font-semibold">
                {stat.sub}
              </span>
            )}
          </div>
        ))}
      </div>

      <span className="text-fg-muted text-[11px]">
        ⓘ GitHub REST API에서 조회한 공개 저장소 전체 활동입니다. 개인 기여도나
        인증 점수로 사용하지 않습니다.
        {data.truncated &&
          ' 커밋 500개 이후 내역은 이번 조회에서 생략됐습니다.'}
      </span>
    </section>
  )
}
