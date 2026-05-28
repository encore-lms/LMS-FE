import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('자식 텍스트를 렌더한다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('disabled prop을 button 요소에 전달한다', () => {
    render(<Button disabled>제출</Button>)
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled()
  })

  it('기본 type은 button (form submit 우발 방지)', () => {
    render(<Button>확인</Button>)
    expect(screen.getByRole('button', { name: '확인' })).toHaveAttribute(
      'type',
      'button',
    )
  })
})
