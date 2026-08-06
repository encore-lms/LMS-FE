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
    // 중앙은 선택(기본=1위) 도메인의 비율을 크게, 전체 도메인 수는 보조 줄로(2026-08-08 개선).
    expect(container.textContent).toContain('4개 도메인')
    expect(
      container.querySelector('[data-domain-detail="데이터"]'),
    ).not.toBeNull()
  })

  it('도넛 조각을 선택하면 해당 도메인의 상세 정보를 표시한다', () => {
    const { container } = render(<DomainDonut domains={domains} />)
    const segment = container.querySelector('[data-domain-segment="커머스"]')

    expect(segment).not.toBeNull()
    fireEvent.click(segment as Element)

    // 선택 상세는 도넛 중앙에 나뉘어 표시된다(비율=total, 라벨=detail, 프로젝트 수=보조 줄).
    expect(
      container.querySelector('[data-domain-detail="커머스"]'),
    ).not.toBeNull()
    expect(container.querySelector('[data-domain-total]')).toHaveTextContent(
      '40%',
    )
    expect(container.textContent).toContain('인증 프로젝트 4개')
  })
})
