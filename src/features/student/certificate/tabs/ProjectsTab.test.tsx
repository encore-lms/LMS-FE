import { render, screen } from '@testing-library/react'
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
      tags: ['TypeScript'],
      outcomes: ['증명서 계산 경로 구축'],
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
})
