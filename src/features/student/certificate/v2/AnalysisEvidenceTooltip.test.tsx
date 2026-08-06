import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnalysisEvidenceTooltip } from './AnalysisEvidenceTooltip'

function renderTooltip() {
  render(
    <AnalysisEvidenceTooltip label="직무 적합도 점수">
      <span>점수 산출 근거</span>
    </AnalysisEvidenceTooltip>,
  )

  return screen.getByRole('button', {
    name: '직무 적합도 점수 분석 근거 보기',
  })
}

describe('AnalysisEvidenceTooltip', () => {
  it('호버 중에만 임시로 근거를 표시한다', () => {
    const trigger = renderTooltip()

    fireEvent.mouseEnter(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('점수 산출 근거')

    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('클릭하면 고정하고 다시 클릭하면 해제한다', () => {
    const trigger = renderTooltip()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-pressed', 'true')

    fireEvent.mouseLeave(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('고정된 근거는 바깥 클릭이나 Esc로 닫는다', () => {
    const trigger = renderTooltip()

    fireEvent.click(trigger)
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(trigger)
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-pressed', 'false')
  })
})
