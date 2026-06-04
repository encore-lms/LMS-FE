import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('라벨을 렌더하고 tone 클래스를 적용한다', () => {
    render(<StatusBadge label="검토 중" tone="info" />)
    const el = screen.getByText('검토 중')
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass('bg-info-bg')
  })

  it('tone 기본값은 neutral이다', () => {
    render(<StatusBadge label="미배정" />)
    expect(screen.getByText('미배정')).toHaveClass('bg-surface-muted')
  })
})
