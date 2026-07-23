import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiProjectAnalysis } from './AiProjectAnalysis'

describe('AI 프로젝트 분석', () => {
  it('최신 프로젝트 계약을 원본 타임라인 UI에 연결한다', () => {
    const projects = {
      ...getAiAnalysis('stu-001').projects,
      status: 'READY' as const,
      summary: '프로젝트 경험이 기술 적용과 검증으로 확장되었습니다.',
      projects: [
        {
          projectId: 'project-1',
          order: 1,
          name: '수강역량 증명서',
          period: { startedAt: '2026-06-01', endedAt: '2026-07-23' },
          certificationStatus: 'CERTIFIED' as const,
          status: 'READY' as const,
          membershipRole: 'MEMBER' as const,
          teamContext: {
            domain: '교육',
            scope: '증명서 분석 화면',
            techStacks: ['React', 'TypeScript'],
            outcomes: ['분석 화면 구현'],
          },
          personalEvidence: {
            tasks: ['AI 분석 탭 구현'],
            peerObservations: [],
            troubleshootingCases: [],
            artifacts: [],
          },
          analysis: '개인 수행업무와 활용기술을 근거로 화면을 구현했습니다.',
          evidenceCodes: ['PROJECT_TASK_1'],
          limitations: [],
          generatedBy: 'FALLBACK' as const,
        },
      ],
      groups: [
        {
          label: '기술 적용',
          summary: '프로젝트에서 기술을 직접 적용했습니다.',
        },
      ],
    }
    projects.projects.push({
      ...projects.projects[0],
      projectId: 'project-2',
      order: 2,
      name: '후속 프로젝트',
      period: { startedAt: '2026-07-01', endedAt: '2026-07-23' },
    })
    render(<AiProjectAnalysis projects={projects} />)

    expect(screen.getByText('AI 프로젝트 분석')).toBeInTheDocument()
    expect(screen.getByText(projects.projects[0].name)).toBeInTheDocument()
    expect(screen.getByText('프로젝트 궤적 요약')).toBeInTheDocument()
    expect(screen.getAllByText(projects.summary).length).toBeGreaterThan(0)
  })

  it('프로젝트 근거가 없으면 빈 분석 패널을 만들지 않는다', () => {
    const projects = {
      ...getAiAnalysis('stu-001').projects,
      status: 'NOT_READY' as const,
      projects: [],
    }
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(container).toBeEmptyDOMElement()
  })
})
