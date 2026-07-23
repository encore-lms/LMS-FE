import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AiProjects } from '../ai'
import { ProjectAnalysis } from './ProjectAnalysis'

const READY_PROJECTS: AiProjects = {
  summary:
    '인증 프로젝트의 팀 성과와 개인 수행 근거를 분리해 프로젝트 경험을 설명합니다.',
  groups: [
    {
      label: '문서 질의응답 서비스 배포·고도화',
      summary: '배포 문서와 시연 준비를 맡은 수행 기록이 확인됩니다.',
    },
  ],
  status: 'READY',
  projects: [
    {
      projectId: 'project-1',
      order: 1,
      name: '문서 질의응답 서비스 배포·고도화',
      period: { startedAt: '2024-08-19', endedAt: '2024-08-26' },
      certificationStatus: 'CERTIFIED',
      status: 'READY',
      membershipRole: 'OWNER',
      teamContext: {
        domain: 'LLM 서비스 운영·클라우드 배포',
        scope:
          '문서 질의응답 시스템을 배포하고 응답 안정성과 운영 편의성을 개선했습니다.',
        techStacks: ['Python', 'AWS', 'Docker'],
        outcomes: ['팀 결과 · 평균 응답시간: 6.4초 → 2.9초'],
      },
      personalEvidence: {
        tasks: [
          '확정 수행 범위 · 배포 문서·시연 준비 · 개인 활용기술 AWS, Docker',
        ],
        peerObservations: ['막힌 작업의 재현 조건을 먼저 정리했다'],
        troubleshootingCases: ['인증 문제 해결 · 배포 과정의 Docker·AWS 문제'],
        artifacts: [],
      },
      analysis:
        '개인 근거로 배포 문서와 시연 준비 범위가 확인되며, 재현 조건을 정리한 동료 관찰이 함께 남아 있습니다.',
      evidenceCodes: [
        'PERSONAL_CONTRIBUTION:project-1',
        'PEER_OBSERVATION:project-1:1',
      ],
      limitations: [
        '프로젝트 기술스택과 성과지표는 팀 문맥이며 개인 기술·성과로 해석하지 않음',
      ],
      generatedBy: 'FALLBACK',
    },
  ],
  overview: {
    experienceScope: '문서 검색과 클라우드 배포 범위의 인증 프로젝트 경험',
    workingStyle: '배포 문서와 시연 준비를 맡고 재현 조건을 정리하는 수행 방식',
    overall:
      '팀 성과와 개인 수행 근거를 분리하면 맡은 범위를 검증 기록으로 연결한 경험이 확인됩니다.',
  },
  limitations: [
    '완료·인증 프로젝트만 공식 분석에 포함',
    '프로젝트별 점수와 개인 기여율을 만들지 않음',
  ],
  generatedBy: 'FALLBACK',
}

const NOT_READY_PROJECTS: AiProjects = {
  summary:
    '인증 완료 프로젝트 원천과 연결되면 프로젝트 경험을 분석할 수 있습니다.',
  groups: [],
  status: 'NOT_READY',
  projects: [],
  overview: {
    experienceScope: '분석할 인증 완료 프로젝트가 없습니다.',
    workingStyle: '개인 수행 방식을 설명할 프로젝트 근거가 없습니다.',
    overall:
      '인증 완료 프로젝트 원천과 연결되면 프로젝트 경험을 분석할 수 있습니다.',
  },
  limitations: ['완료·인증 프로젝트가 없어 프로젝트 분석 준비 전'],
  generatedBy: 'FALLBACK',
}

describe('ProjectAnalysis', () => {
  it('프로젝트 전체 종합과 팀 문맥·개인 수행 근거를 분리해 표시한다', () => {
    const { container } = render(<ProjectAnalysis projects={READY_PROJECTS} />)

    expect(screen.getByText('AI 프로젝트 분석')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 근거 충분')).toBeInTheDocument()
    expect(
      screen.getByText(READY_PROJECTS.overview.overall),
    ).toBeInTheDocument()
    expect(screen.getByText('경험 범위')).toBeInTheDocument()
    expect(screen.getByText('수행 방식')).toBeInTheDocument()
    expect(
      screen.getByText('문서 질의응답 서비스 배포·고도화'),
    ).toBeInTheDocument()
    expect(screen.getByText('인증 완료')).toBeInTheDocument()
    expect(screen.getByText('팀 프로젝트 문맥')).toBeInTheDocument()
    expect(screen.getByText('개인 수행 근거')).toBeInTheDocument()
    expect(screen.getByText('평균 응답시간: 6.4초 → 2.9초')).toBeInTheDocument()
    expect(
      screen.getByText(/확정 수행 범위 · 배포 문서·시연 준비/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '프로젝트 분석 기준 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('프로젝트별 점수와 개인 기여율을 만들지 않음'),
    ).toBeInTheDocument()

    expect(container).not.toHaveTextContent('PERSONAL_CONTRIBUTION')
    expect(container).not.toHaveTextContent('FALLBACK')
    expect(container).not.toHaveTextContent('OWNER')
    expect(container.innerHTML).not.toContain('project-1')
  })

  it('완료·인증 프로젝트가 없으면 0점 대신 준비 상태를 표시한다', () => {
    render(<ProjectAnalysis projects={NOT_READY_PROJECTS} />)

    expect(screen.getByText('프로젝트 분석 준비 중')).toBeInTheDocument()
    expect(screen.getByText('완료·인증 프로젝트 준비 중')).toBeInTheDocument()
    expect(screen.getByText(NOT_READY_PROJECTS.summary)).toBeInTheDocument()
    expect(
      screen.getByText(NOT_READY_PROJECTS.overview.experienceScope),
    ).toBeInTheDocument()
    expect(screen.queryByText('경험 범위')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('0점')
  })

  it('프로젝트가 있어도 개인 근거가 없으면 팀 문맥과 일부 상태만 표시한다', () => {
    const partial: AiProjects = {
      ...READY_PROJECTS,
      status: 'PARTIAL',
      projects: [
        {
          ...READY_PROJECTS.projects[0],
          status: 'NOT_READY',
          personalEvidence: {
            tasks: [],
            peerObservations: [],
            troubleshootingCases: [],
            artifacts: [],
          },
          analysis:
            '완료·인증된 팀 프로젝트이지만 개인 수행을 설명할 직접 근거가 없어 팀 문맥까지만 제공합니다.',
        },
      ],
    }

    render(<ProjectAnalysis projects={partial} />)

    expect(screen.getByText('프로젝트 근거 일부 확인')).toBeInTheDocument()
    expect(screen.getByText('분석 준비 중')).toBeInTheDocument()
    expect(
      screen.getByText(
        '개인 수행을 설명할 직접 근거가 아직 충분하지 않습니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('팀 프로젝트 문맥')).toBeInTheDocument()
  })
})
