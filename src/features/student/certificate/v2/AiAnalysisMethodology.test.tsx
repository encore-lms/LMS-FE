import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiAnalysisMethodology } from './AiAnalysisMethodology'

function renderMethodology() {
  const analysis = getAiAnalysis('stu-001')
  const result = render(<AiAnalysisMethodology analysis={analysis} />)
  return { analysis, ...result }
}

describe('AI 분석 기준', () => {
  it('직무·프로젝트·문제해결 기준을 탭으로 전환한다', () => {
    renderMethodology()

    expect(screen.getByText('AI 분석 기준')).toBeInTheDocument()
    const tablist = screen.getByRole('tablist', {
      name: 'AI 분석 기준 항목',
    })
    expect(within(tablist).getAllByRole('tab')).toHaveLength(3)

    const jobTab = within(tablist).getByRole('tab', { name: '직무 적합도' })
    const projectTab = within(tablist).getByRole('tab', {
      name: '프로젝트 분석',
    })
    const troubleshootingTab = within(tablist).getByRole('tab', {
      name: '문제해결 역량 분석',
    })

    expect(jobTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: '직무 적합도' })).toBeVisible()
    expect(
      screen.queryByRole('tabpanel', { name: '프로젝트 분석' }),
    ).not.toBeInTheDocument()

    fireEvent.click(projectTab)
    expect(projectTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('tabpanel', { name: '프로젝트 분석' }),
    ).toBeVisible()

    projectTab.focus()
    fireEvent.keyDown(projectTab, { key: 'ArrowRight' })
    expect(troubleshootingTab).toHaveFocus()
    expect(troubleshootingTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('tabpanel', { name: '문제해결 역량 분석' }),
    ).toBeVisible()
  })

  it('직무 TOP3의 통합 입력·점수 산정·선정 조건과 결과 라벨을 설명한다', () => {
    const { analysis, container } = renderMethodology()
    const card = container.querySelector(
      '[data-analysis-method="직무 적합도"]',
    )!

    expect(card).toHaveTextContent('프로필')
    expect(card).toHaveTextContent('관심 직무')
    expect(card).toHaveTextContent('기술 태그')
    expect(card).toHaveTextContent('인증 프로젝트 도메인')
    expect(card).toHaveTextContent('담당 역할·업무')
    expect(card).toHaveTextContent('개인 수행이 확인된 결과')
    expect(card).toHaveTextContent('성취도 평가 카테고리·점수')
    expect(card).toHaveTextContent('CS 평가 카테고리·점수')
    expect(card).toHaveTextContent('승인 완료 자격증만 사용')
    expect(card).toHaveTextContent('인증 문제해결 기록')
    expect(card).toHaveTextContent('반복 해결 영역·기술')
    expect(card).toHaveTextContent('수행 검증의 일치 정도를 0~100점으로 보정')
    expect(card).toHaveTextContent(
      '여러 출처에서 반복되고 수행 결과로 검증된 신호',
    )
    expect(card).toHaveTextContent(
      '서로 다른 출처 2종 이상과 평가·자격증 중 검증 근거 1종 이상',
    )
    expect(card).toHaveTextContent('직무 후보 TOP3')
    expect(card).toHaveTextContent('개발자 유형')
    expect(card).toHaveTextContent('핵심 강점')
    expect(card).toHaveTextContent('관련 이론 이해도')
    expect(card).toHaveTextContent(
      '같은 원천 신호를 점수에 중복 반영하지 않습니다',
    )
    expect(card).not.toHaveTextContent(analysis.jobFit.primaryRole!.jobLabel)
  })

  it('프로젝트의 기여·동료평가 집계 흐름과 여섯 산출 항목을 설명한다', () => {
    const { container } = renderMethodology()
    fireEvent.click(screen.getByRole('tab', { name: '프로젝트 분석' }))
    const card = container.querySelector(
      '[data-analysis-method="프로젝트 분석"]',
    )!

    expect(card).toHaveTextContent('전체 업무 수')
    expect(card).toHaveTextContent('본인 담당 업무')
    expect(card).toHaveTextContent('본인이 설명한 기여 내용')
    expect(card).toHaveTextContent('프로젝트별 담당 역할')
    expect(card).toHaveTextContent('기술/기술기여')
    expect(card).toHaveTextContent('소통·협업·팀워크')
    expect(card).toHaveTextContent('기존 프로젝트 기록')
    expect(card).toHaveTextContent('도메인·범위·기술 스택')
    expect(card).toHaveTextContent('기존 역할·문제·판단·결과 해석')
    expect(card).toHaveTextContent(
      '프로젝트별 유효 평가자 평균을 다시 동일 가중 평균',
    )
    ;[
      'AI 전체 요약',
      '주로 맡은 역할·업무',
      '프로젝트 기여',
      '동료평가 4축 유형',
      '프로젝트별 성장·확장',
      '핵심 강점',
    ].forEach((label) => expect(card).toHaveTextContent(label))
    expect(card).toHaveTextContent(
      '멘토·강사·운영 평가는 프로젝트 스타일 계산과 근거에서 모두 제외',
    )
    expect(card).toHaveTextContent('임의의 프로젝트 종합점수는 만들지 않습니다')
  })

  it('문제해결 기록의 본문·기간·해결 방식과 성향 라벨 규칙을 설명한다', () => {
    const { container } = renderMethodology()
    fireEvent.click(screen.getByRole('tab', { name: '문제해결 역량 분석' }))
    const card = container.querySelector(
      '[data-analysis-method="문제해결 역량 분석"]',
    )!

    expect(card).toHaveTextContent('문제해결 카테고리')
    expect(card).toHaveTextContent('문제 상황 요약')
    expect(card).toHaveTextContent('해결 과정 요약')
    expect(card).toHaveTextContent('결과 및 검증 요약')
    expect(card).toHaveTextContent('사례별 소요일')
    expect(card).toHaveTextContent('독립 해결 여부')
    expect(card).toHaveTextContent('기존 인증 분석 기록')
    expect(card).toHaveTextContent('문제 영역·기술 태그')
    expect(card).toHaveTextContent('검증 수치·성장 영역')
    expect(card).toHaveTextContent(
      '독립 해결 70% 이상은 독립 주도형, 40~69%는 균형형, 40% 미만은 협업 해결형',
    )
    expect(card).toHaveTextContent('문제 구조화·해결 적용·결과 검증')
    expect(card).toHaveTextContent('가장 선명한 해결 영역')
    expect(card).toHaveTextContent('해결 소요일 특성')
    expect(card).toHaveTextContent('확장되는 문제해결 범위')
    expect(card).toHaveTextContent(
      '문제 상황·해결 과정·결과를 이해할 수 있는 핵심 요약',
    )
  })
})
