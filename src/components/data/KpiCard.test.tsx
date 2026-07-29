import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('label·value·hint를 렌더한다', () => {
    render(<KpiCard label="검토 대기" value={5} hint="담당 배정 필요" />)
    expect(screen.getByText('검토 대기')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('담당 배정 필요')).toBeInTheDocument()
  })

  it('hint가 없으면 보조 설명을 렌더하지 않는다', () => {
    const { container } = render(<KpiCard label="인증 요청" value={12} />)
    expect(screen.getByText('인증 요청')).toBeInTheDocument()
    expect(container.querySelectorAll('span')).toHaveLength(2) // label + value만
  })

  it('tone에 따라 value 색 클래스를 적용한다', () => {
    render(<KpiCard label="보완 요청" value={3} tone="warning" />)
    expect(screen.getByText('3')).toHaveClass('text-warning')
  })
})
