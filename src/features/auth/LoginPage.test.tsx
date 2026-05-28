import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('AuthLayout 안에서 폼 셸을 렌더한다', () => {
    render(<LoginPage />)

    expect(
      screen.getByRole('heading', { name: 'LMS 역량증명서' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('아이디')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인/ })).toBeDisabled()
  })
})
