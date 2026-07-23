import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiProblemAnalysis } from './AiProblemAnalysis'

describe('AI 문제해결·협업 종합 분석', () => {
  it('최신 문제해결 계약을 원본의 문제해결·협업 분리 UI에 연결한다', () => {
    const base = getAiAnalysis('stu-001').problem
    const problem = {
      ...base,
      status: 'PARTIAL' as const,
      certifiedCaseCount: 1,
      caps: [
        {
          ...base.caps[0],
          status: 'PARTIAL' as const,
          certifiedCaseCount: 1,
          evidence: ['인증 트러블슈팅 1건'],
          evidenceCodes: ['TS_CASE_1'],
        },
      ],
      collaboration: {
        ...base.collaboration,
        status: 'READY' as const,
        summary: '동료평가에서 협업과 진행 공유 행동이 확인됩니다.',
        evaluatorCount: 2,
        behaviorSignals: ['진행 공유'],
      },
      growth: {
        ...base.growth,
        summary: '인증 사례가 쌓이며 문제 범위가 확장되고 있습니다.',
      },
    }
    render(<AiProblemAnalysis problem={problem} />)

    expect(screen.getByText('AI 문제해결·협업 종합 분석')).toBeInTheDocument()
    expect(screen.getByText('인증 트러블슈팅 역량')).toBeInTheDocument()
    expect(screen.getByText('협업 스타일')).toBeInTheDocument()
    expect(screen.getByText(problem.collaboration.summary)).toBeInTheDocument()
  })

  it('근거가 준비되지 않으면 점수를 만들지 않고 산출 전 상태를 표시한다', () => {
    const problem = {
      ...getAiAnalysis('stu-001').problem,
      status: 'NOT_READY' as const,
    }
    render(<AiProblemAnalysis problem={problem} />)

    expect(screen.getByText(/종합 분석은 산출 전입니다/)).toBeInTheDocument()
  })
})
