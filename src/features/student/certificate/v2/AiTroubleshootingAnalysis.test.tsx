import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiTroubleshootingAnalysis } from './AiTroubleshootingAnalysis'

describe('트러블슈팅 AI 분석', () => {
  it('인증 사례의 문제해결 성향·반복 패턴·대표 영역·확장 방향을 표시한다', () => {
    const troubleshooting = getAiAnalysis('stu-001').troubleshooting
    const primaryGroup = [...troubleshooting.groups].sort(
      (a, b) => b.certifiedCaseCount - a.certifiedCaseCount,
    )[0]
    const { container } = render(
      <AiTroubleshootingAnalysis troubleshooting={troubleshooting} />,
    )

    expect(screen.getByText('트러블슈팅 AI 분석')).toBeInTheDocument()
    expect(
      container.querySelector('#ai-troubleshooting-analysis'),
    ).toBeInTheDocument()
    expect(screen.getByText('AI가 읽은 문제해결 성향')).toBeInTheDocument()
    expect(screen.getByText(troubleshooting.summary)).toBeInTheDocument()
    expect(screen.getByText('반복해서 나타난 해결 패턴')).toBeInTheDocument()
    expect(screen.getByText('가장 선명한 해결 영역')).toBeInTheDocument()
    expect(screen.getByText(primaryGroup.label)).toBeInTheDocument()
    expect(screen.getByText(primaryGroup.solutionSummary)).toBeInTheDocument()
    expect(screen.getByText('확장되는 문제해결 범위')).toBeInTheDocument()
    expect(
      screen.getByText(troubleshooting.growth!.summary),
    ).toBeInTheDocument()
  })

  it('사례 수·독립 해결 비율·태그 목록을 분석 본문에 반복하지 않는다', () => {
    const troubleshooting = getAiAnalysis('stu-001').troubleshooting
    render(<AiTroubleshootingAnalysis troubleshooting={troubleshooting} />)

    expect(screen.queryByText('인증된 해결 근거')).not.toBeInTheDocument()
    expect(
      screen.queryByText(`독립 해결 비율 ${troubleshooting.independentRate}%`),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        `${troubleshooting.groups[0].tags[0].label} ${troubleshooting.groups[0].tags[0].count}건`,
      ),
    ).not.toBeInTheDocument()
  })

  it('분석 준비 전이면 빈 패널을 만들지 않는다', () => {
    const troubleshooting = {
      ...getAiAnalysis('stu-001').troubleshooting,
      status: 'NOT_READY' as const,
    }
    const { container } = render(
      <AiTroubleshootingAnalysis troubleshooting={troubleshooting} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
