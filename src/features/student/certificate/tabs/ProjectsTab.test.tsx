import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CertProjectsTab } from '../types'
import { ProjectsTab } from './ProjectsTab'

vi.mock('../github/useLmsFeGithubProject', () => ({
  useLmsFeGithubProject: () => ({
    data: null,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('../github/useLmsProjectMetrics', () => ({
  useLmsProjectMetrics: () => ({
    data: null,
    isPending: false,
    error: null,
  }),
}))

vi.mock('../github/LmsFeGithubProject', () => ({
  LmsFeGithubProjectCard: () => null,
}))

const projects: CertProjectsTab = {
  certifiedLabel: '1 / 1',
  contribAvg: '40%',
  projects: [
    {
      id: 'project-1',
      badge: 'PROJECT 1',
      certified: true,
      title: '증명서 프로젝트',
      period: '2026.01 — 2026.03',
      role: '백엔드',
      contrib: '40%',
      tags: ['TypeScript', 'React'],
      techStackGroups: [
        { category: '백엔드', items: ['TypeScript'] },
        { category: '프론트엔드', items: ['React'] },
      ],
      outcomes: ['증명서 계산 경로 구축', '응답 시간 40% 단축'],
    },
  ],
  matrix: Array.from({ length: 12 }, () => 1),
}

describe('ProjectsTab', () => {
  it('프로젝트와 기여 활동만 표시하고 성과·공개 산출물 영역은 표시하지 않는다', () => {
    render(<ProjectsTab p={projects} />)

    expect(screen.getByText('증명서 프로젝트')).toBeInTheDocument()
    expect(screen.getByText('Contribution Matrix')).toBeInTheDocument()
    expect(screen.queryByText('Before → After 성과')).not.toBeInTheDocument()
    expect(
      screen.queryByText('공개 산출물 · 외부 검증 가능'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/외부 공개 가능 산출물/)).not.toBeInTheDocument()
  })

  it('프로젝트 경험을 하나의 요약 영역에서 프로젝트 목록보다 먼저 보여준다', () => {
    render(<ProjectsTab p={projects} />)

    const summary = screen.getByRole('region', {
      name: '프로젝트 전체 요약',
    })
    const projectTitle = screen.getByText('증명서 프로젝트')

    expect(summary.compareDocumentPosition(projectTitle)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(within(summary).getByText('프로젝트 경험 요약')).toBeInTheDocument()
    expect(
      within(summary).getByText(
        '인증된 프로젝트에서 맡은 역할과 평균 기여도, 활용 기술을 모아 보여줍니다.',
      ),
    ).toBeInTheDocument()
    expect(within(summary).getByText('프로젝트')).toBeInTheDocument()
    expect(within(summary).getByText('1건')).toBeInTheDocument()
    expect(
      within(summary).getByText('등록 프로젝트 중 1 / 1 인증 완료'),
    ).toBeInTheDocument()
    expect(within(summary).getByText('주요 역할')).toBeInTheDocument()
    expect(within(summary).getAllByText('백엔드')).toHaveLength(2)
    expect(within(summary).getByText('평균 기여도')).toBeInTheDocument()
    expect(within(summary).getByText('40%')).toBeInTheDocument()
    expect(within(summary).getByText('활용 기술')).toBeInTheDocument()
    expect(within(summary).getByText('총 2개 기술')).toBeInTheDocument()
    expect(within(summary).getByText('프론트엔드')).toBeInTheDocument()
    expect(within(summary).getByText('TypeScript')).toBeInTheDocument()
    expect(within(summary).getByText('React')).toBeInTheDocument()
    expect(within(summary).queryByText('성과')).not.toBeInTheDocument()
    expect(summary.querySelector('[data-tech-stack-groups]')).toHaveClass(
      'sm:grid-cols-2',
    )
    expect(
      within(summary).getByRole('progressbar', {
        name: '전체 프로젝트 평균 기여도',
      }),
    ).toHaveAttribute('aria-valuenow', '40')
    expect(
      [...summary.querySelectorAll('[data-project-summary-item]')].map((item) =>
        item.getAttribute('data-project-summary-item'),
      ),
    ).toEqual(['projects', 'contribution', 'role', 'tech-stack'])
  })

  it('프로젝트 역할이 두 개 이상이면 각각 태그로 표시한다', () => {
    render(
      <ProjectsTab
        p={{
          ...projects,
          projects: [
            projects.projects[0],
            {
              ...projects.projects[0],
              id: 'project-2',
              title: '두 번째 프로젝트',
              role: '프론트엔드',
            },
          ],
        }}
      />,
    )

    const roleSummary = document.querySelector(
      '[data-project-summary-item="role"]',
    )
    expect(roleSummary).not.toBeNull()
    expect(within(roleSummary as HTMLElement).getByText('백엔드')).toHaveClass(
      'bg-accent-bg',
      'rounded-md',
    )
    expect(
      within(roleSummary as HTMLElement).getByText('프론트엔드'),
    ).toHaveClass('bg-accent-bg', 'rounded-md')
    expect(
      within(roleSummary as HTMLElement).getByText(
        '프로젝트에서 담당한 역할 2개',
      ),
    ).toBeInTheDocument()
  })
})
