import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

// 공통 Checkbox — 라벨 렌더 + 토글 시 onChange(반전값) 호출.

describe('Checkbox', () => {
  it('라벨과 체크 상태를 렌더한다', () => {
    render(<Checkbox checked label="활성" onChange={() => {}} />)
    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('클릭 시 반전된 값으로 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} label="활성" onChange={onChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('활성'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
