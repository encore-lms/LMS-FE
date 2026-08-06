import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiAnalysisMethodology } from './AiAnalysisMethodology'

describe('AI 분석 기준', () => {
  it('현재 화면의 세 가지 핵심 분석 기준을 제공한다', () => {
    render(<AiAnalysisMethodology analysis={getAiAnalysis('stu-001')} />)

    expect(screen.getByText('AI 분석 기준')).toBeInTheDocument()
    expect(screen.getByText('직무 적합도')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 분석')).toBeInTheDocument()
    expect(screen.getByText('문제해결 역량 분석')).toBeInTheDocument()
    expect(screen.queryByText('6축 교차분석')).not.toBeInTheDocument()
  })

  it('프로젝트 산출 근거는 보드 업무·본인 기여·역할·동료평가 4축만 사용한다', () => {
    render(<AiAnalysisMethodology analysis={getAiAnalysis('stu-001')} />)

    const projectCard = screen.getByText('프로젝트 분석').closest('article')!
    expect(projectCard).toHaveTextContent(
      '보드 전체 15개 중 담당 6개 · 완료 6개',
    )
    expect(projectCard).toHaveTextContent('본인 작성 수행·기여 2건')
    expect(projectCard).toHaveTextContent('프로젝트 역할 2종')
    expect(projectCard).toHaveTextContent('동료평가 4축')
    expect(projectCard).toHaveTextContent('멘토·강사·운영 평가는 제외합니다')
    expect(projectCard).toHaveTextContent(
      '전체 프로젝트 수행 스타일 · 동료평가 4축 유형 · 프로젝트별 성장·확장 · 핵심 강점',
    )
  })

  it('직무 적합도와 트러블슈팅의 새 기본 데이터·분석 방식을 설명한다', () => {
    render(<AiAnalysisMethodology analysis={getAiAnalysis('stu-001')} />)

    const jobCard = screen.getByText('직무 적합도').closest('article')!
    expect(jobCard).toHaveTextContent('관심 직무 2개')
    expect(jobCard).toHaveTextContent('기술 태그 6개')
    expect(jobCard).toHaveTextContent('프로젝트 도메인 2개')
    expect(jobCard).toHaveTextContent('승인 자격증 5개')
    expect(jobCard).toHaveTextContent('미선택·미보유 항목은 감점하지 않습니다')

    const troubleshootingCard = screen
      .getByText('문제해결 역량 분석')
      .closest('article')!
    expect(troubleshootingCard).toHaveTextContent('카테고리 5개')
    expect(troubleshootingCard).toHaveTextContent('상황·해결·결과 12건')
    expect(troubleshootingCard).toHaveTextContent('중앙 2일 · 평균 2.3일')
    expect(troubleshootingCard).toHaveTextContent('독립 10건 · 협업 2건')
  })
})
