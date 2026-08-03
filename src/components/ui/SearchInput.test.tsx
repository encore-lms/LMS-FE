import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'

// 목록 위 검색 칸 — 화면마다 인라인으로 복제돼 있던 것을 한 벌로 모았다.
// 자리마다 폭·높이가 달라 호출부가 className 으로 정하는데, 기본값이 그걸 덮으면 안 된다.

const wrapperOf = (name: string) =>
  screen.getByRole('textbox', { name }).parentElement!

describe('SearchInput', () => {
  it('입력하면 값만 올려 보낸다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} ariaLabel="자료 검색" />)

    await user.type(screen.getByRole('textbox', { name: '자료 검색' }), '가')

    expect(onChange).toHaveBeenCalledWith('가')
  })

  it('크기를 주지 않으면 기본 h-9 w-56', () => {
    render(<SearchInput value="" onChange={vi.fn()} ariaLabel="자료 검색" />)
    expect(wrapperOf('자료 검색').className).toContain('w-56')
    expect(wrapperOf('자료 검색').className).toContain('h-9')
  })

  // cn 은 단순 join 이라 기본값이 남아 있으면 Tailwind 출력 순서에 따라 그쪽이 이긴다.
  // 실제로 w-52 를 넘겼는데 기본 w-56 이 이겨 폭이 무시된 적이 있다.
  it('폭을 주면 기본 폭을 빼서 그대로 적용한다', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        ariaLabel="수강생 검색"
        className="w-52"
      />,
    )
    const cls = wrapperOf('수강생 검색').className
    expect(cls).toContain('w-52')
    expect(cls).not.toContain('w-56')
    // 높이는 안 줬으니 기본이 남는다.
    expect(cls).toContain('h-9')
  })

  it('높이를 주면 기본 높이를 뺀다', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        ariaLabel="상품 검색"
        className="h-8 w-52"
      />,
    )
    const cls = wrapperOf('상품 검색').className
    expect(cls).toContain('h-8')
    expect(cls).not.toContain('h-9')
  })

  it('flex-1·min-w-0 로 늘리는 자리도 기본 폭을 빼야 한다', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        ariaLabel="팀 검색"
        className="min-w-0 flex-1"
      />,
    )
    expect(wrapperOf('팀 검색').className).not.toContain('w-56')
  })

  it('임의값 크기도 기본값을 밀어낸다', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        ariaLabel="퀴즈 검색"
        className="h-[38px] w-[260px]"
      />,
    )
    const cls = wrapperOf('퀴즈 검색').className
    expect(cls).not.toContain('w-56')
    expect(cls).not.toContain('h-9')
  })
})
