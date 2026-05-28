import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('label과 input을 htmlFor로 연결한다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
  })

  it('required 시 aria-required + 빨강 * 표시', () => {
    render(<Input label="비밀번호" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호/)).toHaveAttribute(
      'aria-required',
      'true',
    )
  })

  it('labelAction을 라벨 우측에 렌더한다', () => {
    render(
      <Input label="비밀번호" labelAction={<a href="#">비밀번호 찾기</a>} />,
    )
    expect(
      screen.getByRole('link', { name: '비밀번호 찾기' }),
    ).toBeInTheDocument()
  })
})
