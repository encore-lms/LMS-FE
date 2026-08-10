import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CertProjectsTab } from '../types'
import { ProjectsTab } from './ProjectsTab'

const refetch = vi.fn()

const projects: CertProjectsTab = {
  summary: {
    totalProjectCount: 2,
    completedProjectCount: 1,
    certifiedProjectCount: 1,
    responsibilities: ['백엔드 리드', '시스템 설계'],
    techStackGroups: [
      { category: '백엔드', items: ['Spring Boot'] },
      { category: '인프라', items: ['Docker'] },
    ],
  },
  projects: [
    {
      projectId: 'project-1',
      title: '증명서 프로젝트',
      startDate: '2026-01-05',
      endDate: '2026-03-27',
      domain: '교육 플랫폼',
      projectStatus: 'COMPLETED',
      certificationStatus: 'CERTIFIED',
      certifiedAt: '2026-03-30T10:00:00+09:00',
      membershipRole: 'OWNER',
      responsibility: '백엔드 리드',
      teamSize: 4,
      techStackGroups: [
        { category: '백엔드', items: ['Spring Boot'] },
        { category: '인프라', items: ['Docker'] },
      ],
      outcomes: ['응답 시간 40% 단축'],
      githubStatus: 'CONNECTED',
      repositories: [
        {
          githubRepositoryId: 101,
          fullName: 'team/certificate-project',
          visibility: 'PRIVATE',
          analysisBranch: 'main',
          isPublicForMe: true,
          myCommits: 40,
          totalCommits: 100,
          commitContributionRate: 40,
          activeDays: 8,
          longestStreak: 3,
          weeklyAverage: 20,
          dailyActivity: Array.from({ length: 14 }, (_, index) => ({
            date: `2026-01-${String(index + 5).padStart(2, '0')}`,
            commits: index % 3,
          })),
          lastSyncedAt: '2026-08-10T09:00:00+09:00',
        },
      ],
    },
    {
      projectId: 'project-2',
      title: '진행 중 프로젝트',
      startDate: '2026-04-01',
      endDate: null,
      domain: '추천 시스템',
      projectStatus: 'IN_PROGRESS',
      certificationStatus: 'NONE',
      certifiedAt: null,
      membershipRole: 'MEMBER',
      responsibility: '시스템 설계',
      teamSize: 5,
      techStackGroups: [],
      outcomes: [],
      githubStatus: 'DISCONNECTED',
      repositories: [],
    },
  ],
}

let queryState: {
  data: CertProjectsTab | undefined
  isPending: boolean
  isError: boolean
  refetch: typeof refetch
}

vi.mock('../../api/certificate', () => ({
  useCertificateProjects: () => queryState,
}))

function renderProjectsTab() {
  return render(
    <MemoryRouter>
      <ProjectsTab />
    </MemoryRouter>,
  )
}

describe('ProjectsTab', () => {
  beforeEach(() => {
    refetch.mockReset()
    queryState = {
      data: projects,
      isPending: false,
      isError: false,
      refetch,
    }
  })

  it('워크스페이스의 프로젝트 수·역할·기술을 요약하고 평균 기여도는 표시하지 않는다', () => {
    renderProjectsTab()

    const summary = screen.getByRole('region', {
      name: '프로젝트 전체 요약',
    })
    expect(within(summary).getByText('2건')).toBeInTheDocument()
    expect(within(summary).getByText('완료 1건 · 인증 1건')).toBeInTheDocument()
    expect(within(summary).getByText('백엔드 리드')).toBeInTheDocument()
    expect(within(summary).getByText('시스템 설계')).toBeInTheDocument()
    expect(within(summary).getByText('Spring Boot')).toBeInTheDocument()
    expect(within(summary).getByText('Docker')).toBeInTheDocument()
    expect(screen.queryByText('평균 기여도')).not.toBeInTheDocument()
    expect(screen.queryByText('Contribution Matrix')).not.toBeInTheDocument()
  })

  it('프로젝트 기간·역할·성과는 워크스페이스 값으로 표시한다', () => {
    renderProjectsTab()

    const project = screen.getByRole('link', {
      name: '증명서 프로젝트 프로젝트 워크스페이스로 이동',
    })
    expect(project).not.toBeNull()
    expect(project).toHaveAttribute('href', '/student/projects/project-1')
    expect(project).toHaveTextContent('2026-01-05 ~ 2026-03-27')
    expect(project).toHaveTextContent('역할 백엔드 리드')
    expect(project).toHaveTextContent('팀 4명 · OWNER')
    expect(project).toHaveTextContent('도메인 교육 플랫폼')
    expect(project).toHaveTextContent('응답 시간 40% 단축')
    expect(project).toHaveTextContent('✓ 강사 인증')
  })

  it('프로젝트별 GitHub 동기화에서 내·전체 커밋과 커밋 기여율을 표시한다', () => {
    renderProjectsTab()

    expect(
      screen.getByText('team/certificate-project · main · 공개 허용'),
    ).toBeInTheDocument()
    expect(screen.getByText('내 커밋')).toBeInTheDocument()
    expect(screen.getByText('전체 커밋')).toBeInTheDocument()
    expect(screen.getByText('커밋 기여율')).toBeInTheDocument()
    expect(screen.getAllByText('40')).toHaveLength(1)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
    expect(
      screen.getByText(/main 브랜치에서 내 커밋 40개 ÷ 전체 100개/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/encore-lms|junseok-dev/)).not.toBeInTheDocument()
  })

  it('GitHub가 연결되지 않아도 프로젝트 정보는 유지한다', () => {
    renderProjectsTab()

    const project = screen.getByRole('link', {
      name: '진행 중 프로젝트 프로젝트 워크스페이스로 이동',
    })
    expect(project).not.toBeNull()
    expect(project).toHaveAttribute('href', '/student/projects/project-2')
    expect(project).toHaveTextContent('연결된 GitHub 없음')
    expect(project).toHaveTextContent(
      '프로젝트 정보는 유지되며 GitHub 활동만 표시하지 않습니다.',
    )
  })

  it('프로젝트 전용 API 로딩 상태를 탭 내부에 표시한다', () => {
    queryState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch,
    }

    renderProjectsTab()

    expect(
      screen.getByText('프로젝트 증명 데이터를 불러오는 중…'),
    ).toBeInTheDocument()
  })
})
