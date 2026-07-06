import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  Skeleton,
  SkeletonCards,
  SkeletonKpiRow,
  SkeletonTable,
  SkeletonText,
} from './Skeleton'

// 스켈레톤 프리미티브 — 골격 개수·접근성(aria-hidden) 계약.

describe('Skeleton primitives', () => {
  it('SkeletonText는 지정한 줄 수만큼 렌더한다', () => {
    const { container } = render(<SkeletonText lines={4} />)
    // 컨테이너(aria-hidden) 안의 pulse 박스 4개
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('SkeletonKpiRow는 지정한 타일 수만큼 렌더한다', () => {
    const { container } = render(<SkeletonKpiRow count={3} />)
    // 타일당 3개 골격(라벨·값·힌트) → 9개
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(9)
  })

  it('SkeletonTable은 헤더+행 골격을 렌더한다', () => {
    const { container } = render(<SkeletonTable rows={5} columns={4} />)
    // 헤더 4 + 5행 × 4열 = 24
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(24)
  })

  it('SkeletonCards는 지정한 카드 수만큼 렌더한다', () => {
    const { container } = render(<SkeletonCards count={2} />)
    // 카드 2장 — 각 카드는 여러 골격을 포함
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      2,
    )
  })

  it('스켈레톤은 스크린리더에서 숨겨진다(aria-hidden)', () => {
    const { container } = render(<Skeleton className="h-4 w-4" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
  })
})
