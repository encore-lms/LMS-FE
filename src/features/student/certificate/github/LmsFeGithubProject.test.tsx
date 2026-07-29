import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LmsFeGithubProjectData } from './lmsFeGithubApi'
import { LmsFeGithubProjectCard } from './LmsFeGithubProject'

const githubData: LmsFeGithubProjectData = {
  fullName: 'encore-lms/LMS-FE',
  repositoryUrl: 'https://github.com/encore-lms/LMS-FE',
  description: 'LMS-FE',
  createdAt: '2026-05-07T10:38:05Z',
  pushedAt: '2026-07-21T02:18:06Z',
  language: 'TypeScript',
  defaultBranch: 'main',
  activityBranch: 'develop',
  authorLogin: 'junseok-dev',
  grid: [],
  totalCommits: 10,
  activeDays: 5,
  totalDays: 84,
  longestStreak: 2,
  weeklyAverage: 0.8,
  projectCommitCount: 100,
  authorCommitCount: 20,
  commitContributionRate: 20,
  windowStart: '2026-05-03',
  windowEnd: '2026-07-21',
  truncated: false,
}

describe('LMS-FE GitHub 프로젝트 카드', () => {
  it('README 대신 정확히 매칭된 LMS 프로젝트의 역할과 성과지표를 표시한다', () => {
    render(
      <LmsFeGithubProjectCard
        data={githubData}
        isPending={false}
        error={null}
        onRetry={() => undefined}
        isLmsPending={false}
        lmsError={null}
        lmsProject={{
          repository: 'encore-lms/LMS-FE',
          status: 'MATCHED',
          projectId: 'project-3',
          projectTitle: 'LMS 프론트엔드',
          role: '프론트엔드 · 팀원',
          techStack: ['React 19', 'Tailwind CSS'],
          metrics: [
            {
              label: '렌더링 시간',
              before: '1.2초',
              after: '0.4초',
              delta: '-67%',
              good: true,
            },
          ],
          matchedProjectCount: 1,
        }}
      />,
    )

    expect(screen.getByText('프론트엔드 · 팀원')).toBeInTheDocument()
    expect(screen.getByText('React 19')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument()
    expect(screen.queryByText('branch: develop')).not.toBeInTheDocument()
    expect(screen.queryByText('public')).not.toBeInTheDocument()
    expect(screen.getByText('LMS 프로젝트 성과지표')).toBeInTheDocument()
    expect(screen.getByText(/렌더링 시간: 1.2초 → 0.4초/)).toBeInTheDocument()
    expect(screen.queryByText(/README/)).not.toBeInTheDocument()
  })

  it('LMS 프로젝트가 없으면 성과를 만들지 않았음을 표시한다', () => {
    render(
      <LmsFeGithubProjectCard
        data={githubData}
        isPending={false}
        error={null}
        onRetry={() => undefined}
        isLmsPending={false}
        lmsError={null}
        lmsProject={{
          repository: 'encore-lms/LMS-FE',
          status: 'NOT_REGISTERED',
          projectId: null,
          projectTitle: null,
          role: null,
          techStack: [],
          metrics: [],
          matchedProjectCount: 0,
        }}
      />,
    )

    expect(
      screen.getByText(/성과지표를 임의로 생성하지 않습니다/),
    ).toBeInTheDocument()
  })
})
