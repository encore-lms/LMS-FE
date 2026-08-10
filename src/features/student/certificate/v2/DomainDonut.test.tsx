import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CertDomain } from '../types'
import { DomainDonut } from './DomainDonut'

const domains: CertDomain[] = [
  { label: 'Beta', pct: 10, projectCount: 1, tone: 'accent' },
  { label: '커머스', pct: 40, projectCount: 4, tone: 'success' },
  { label: 'Alpha', pct: 10, projectCount: 1, tone: 'warning' },
  { label: '데이터', pct: 40, projectCount: 4, tone: 'info' },
]

describe('DomainDonut', () => {
  it('비율 내림차순과 이름 오름차순으로 나열하고 전체 도메인 수를 표시한다', () => {
    const { container } = render(<DomainDonut domains={domains} />)

    expect(
      [...container.querySelectorAll('[data-domain-list-item]')].map((item) =>
        item.getAttribute('data-domain-list-item'),
      ),
    ).toEqual(['데이터', '커머스', 'Alpha', 'Beta'])
    // 초기 선택 = 1위 도메인이 중앙에 표시된다.
    expect(
      container.querySelector('[data-domain-detail="데이터"]'),
    ).not.toBeNull()
  })

  it('선택이 바뀌어도 조각 두께는 변하지 않는다', () => {
    const { container } = render(<DomainDonut domains={domains} />)
    const widths = () =>
      [...container.querySelectorAll('[data-domain-segment]')].map((el) =>
        el.getAttribute('stroke-width'),
      )
    const before = widths()
    fireEvent.click(
      container.querySelector('[data-domain-segment="커머스"]') as Element,
    )
    expect(widths()).toEqual(before)
    expect(new Set(widths()).size).toBe(1)
  })

  it('도넛 조각을 선택하면 해당 도메인의 상세 정보를 표시한다', () => {
    const { container } = render(<DomainDonut domains={domains} />)
    const segment = container.querySelector('[data-domain-segment="커머스"]')

    expect(segment).not.toBeNull()
    fireEvent.click(segment as Element)

    const detail = container.querySelector('[data-domain-detail="커머스"]')
    expect(detail).toHaveTextContent('40%')
    expect(detail).toHaveTextContent('인증 프로젝트 4개')
  })
})
