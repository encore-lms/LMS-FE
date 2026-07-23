import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AiVerdict } from '../ai'
import { TechnicalVerdict } from './TechnicalVerdict'

const READY_VERDICT: AiVerdict = {
  strength:
    '개인에게 귀속된 문제 해결과 기술 행동이 함께 나타나 원인을 좁히고 검증하는 역량이 강점입니다.',
  gap: '현재의 문제 해결 경험을 안정적인 구현으로 연결하도록 기초 코딩 성취를 보강하는 것이 좋습니다.',
  unique:
    '기초 코딩 성취보다 인증된 문제 해결의 적용 경험이 더 넓게 나타나는 비대칭이 특징입니다.',
  details: {
    strength: {
      status: 'READY',
      evidence: [
        '인증 문제 해결 · 배포·인프라 · Docker·AWS',
        '동료 코멘트의 기술 행동 · 재현·검증, 설계·계약',
      ],
      evidenceCodes: ['CERTIFIED_TS_case-1', 'PEER_TECH_BEHAVIOR'],
    },
    gap: {
      status: 'READY',
      evidence: ['기술 절대성취 산출 완료', 'PCCE 승인 인증 · LV.1'],
      evidenceCodes: ['TECH_ABSOLUTE_ACHIEVEMENT', 'CODING_CERT_pcce'],
    },
    unique: {
      status: 'READY',
      evidence: [
        'PCCE 승인 인증 · LV.1',
        '인증 문제 해결 · 프론트엔드 · Python',
        '인증 문제 해결 · 배포·인프라 · Docker·AWS',
      ],
      evidenceCodes: [
        'CODING_CERT_pcce',
        'CERTIFIED_TS_case-1',
        'CERTIFIED_TS_case-2',
      ],
    },
  },
  confidence: 'HIGH',
  limitations: [
    '기술 상대 위치와 상호평가 기술기여 점수는 판단에 사용하지 않음',
    '팀 프로젝트 기술스택은 개인 기술 강점의 직접 근거로 사용하지 않음',
  ],
  generatedBy: 'FALLBACK',
}

const NOT_READY_VERDICT: AiVerdict = {
  strength:
    '서로 다른 원천에서 교차 확인되는 기술 강점을 아직 산출할 수 없습니다.',
  gap: '평가된 범위에서 보완 방향을 정할 직접 근거가 아직 충분하지 않습니다.',
  unique:
    '기초와 적용 사이의 차이나 반복 패턴을 설명할 근거가 아직 충분하지 않습니다.',
  details: {
    strength: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
    gap: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
    unique: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
  },
  confidence: 'LOW',
  limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
  generatedBy: 'FALLBACK',
}

describe('TechnicalVerdict', () => {
  it('강점·보완·특이형과 근거 충분도·비식별 판단 근거를 표시한다', () => {
    const { container } = render(<TechnicalVerdict verdict={READY_VERDICT} />)

    expect(screen.getByText('AI 기술 역량 종합 판단')).toBeInTheDocument()
    expect(screen.getByText('근거 충분도 높음')).toBeInTheDocument()
    expect(screen.getByText('강점')).toBeInTheDocument()
    expect(screen.getByText('보완')).toBeInTheDocument()
    expect(screen.getByText('특이형')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '강점 판단 근거 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '기술 종합 판단 기준 보기' }),
    ).toBeInTheDocument()
    expect(screen.getByText('기술 절대성취 산출 완료')).toBeInTheDocument()
    expect(
      screen.getByText(
        '팀 프로젝트 기술스택은 개인 기술 강점의 직접 근거로 사용하지 않음',
      ),
    ).toBeInTheDocument()

    const strengthTooltip = container.querySelector(
      '[data-verdict-key="strength"] [role="tooltip"]',
    )
    expect(strengthTooltip).toHaveClass('left-3')
    expect(strengthTooltip).toHaveClass('right-3')
    expect(container).not.toHaveTextContent('CERTIFIED_TS_case-1')
    expect(container).not.toHaveTextContent('FALLBACK')
    expect(container).not.toHaveTextContent('멘토 추천 수강생')
  })

  it('근거가 없는 항목은 0점 대신 분석 준비 중 상태로 표시한다', () => {
    render(<TechnicalVerdict verdict={NOT_READY_VERDICT} />)

    expect(screen.getByText('근거 충분도 낮음')).toBeInTheDocument()
    expect(screen.getAllByText('분석 준비 중')).toHaveLength(3)
    expect(
      screen.queryByRole('button', { name: '강점 판단 근거 보기' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/기술 강점을 아직 산출할 수 없습니다/),
    ).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('0점')
  })
})
