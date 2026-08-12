import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterSelect } from './FilterSelect'

const OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'AUTO', label: 'AUTO' },
  { value: 'MANUAL', label: 'MANUAL' },
]

describe('FilterSelect', () => {
  it('라벨을 붙이고 고른 값을 돌려준다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <FilterSelect
        label="채점 모드"
        value="all"
        onChange={onChange}
        options={OPTIONS}
      />,
    )
    expect(screen.getByText('채점 모드')).toBeInTheDocument()
    await user.click(screen.getByLabelText('채점 모드 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', { name: 'AUTO' }),
    )
    expect(onChange).toHaveBeenCalledWith('AUTO')
  })

  it('값 칸을 한 번 누르면 목록이 열린다', async () => {
    // 라벨을 <label> 로 감싸면 클릭이 값 칸에 한 번 더 전달돼 열자마자 닫혔다.
    const user = userEvent.setup()
    render(
      <FilterSelect
        label="공개 상태"
        value="all"
        onChange={vi.fn()}
        options={OPTIONS}
      />,
    )
    await user.click(screen.getByLabelText('공개 상태 필터'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('아이콘을 주면 라벨 앞에 붙는다', () => {
    render(
      <FilterSelect
        icon={<span data-testid="filter-icon" />}
        label="기간"
        value="all"
        onChange={vi.fn()}
        options={OPTIONS}
      />,
    )
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
  })
})
