import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('페이지 제목과 핵심 폼 요소를 렌더한다', () => {
    render(<LoginPage />)
    expect(
      screen.getByRole('heading', { name: '로그인', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('ai.camp22@playdata.io'),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인/ })).toBeEnabled()
  })

  it('Brand Panel의 PLAYDATA 카피를 렌더한다', () => {
    render(<LoginPage />)
    expect(screen.getByText('PLAYDATA')).toBeInTheDocument()
    expect(screen.getByText(/실력은 결과가 아니라/)).toBeInTheDocument()
  })

  it('이메일 기억하기 체크박스를 토글한다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    const checkbox = screen.getByRole('checkbox', { name: '이메일 기억하기' })
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('이메일 input에 값을 입력하면 controlled state가 갱신된다', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    const input = screen.getByPlaceholderText('ai.camp22@playdata.io')
    await user.type(input, 'test@playdata.io')
    expect(input).toHaveValue('test@playdata.io')
  })

  it('Caps Lock 상태를 OFF로 초기 표시한다', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('caps-lock-indicator')).toHaveTextContent(
      'Caps Lock OFF',
    )
  })
})
