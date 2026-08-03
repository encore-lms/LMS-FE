import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MarkdownEditor } from './MarkdownEditor'

// 슬래시 명령 — 빈 줄에서 `/` 를 치면 블록을 고르는 메뉴가 뜬다.
// 공지처럼 제목·목록으로 구조를 잡아야 하는 글에서 마크다운 문법을 외우지 않아도 되게 한다.

function Editor({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial)
  return (
    <>
      <MarkdownEditor value={v} onChange={setV} slashCommands />
      <output data-testid="value">{v}</output>
    </>
  )
}

const body = () => screen.getByRole('textbox')
const stored = () => screen.getByTestId('value').textContent

describe('슬래시 명령', () => {
  it('빈 줄에서 / 를 치면 블록 목록이 뜬다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')

    expect(screen.getByRole('listbox', { name: '블록 고르기' })).toBeVisible()
    expect(screen.getByText('제목1')).toBeInTheDocument()
    expect(screen.getByText('할 일 목록')).toBeInTheDocument()
  })

  it('고르면 / 를 지우고 마크다운을 남긴다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await user.click(screen.getByText('제목2'))

    expect(stored()).toBe('## ')
    expect(
      screen.queryByRole('listbox', { name: '블록 고르기' }),
    ).not.toBeInTheDocument()
  })

  it('이어서 친 글자로 목록을 좁힌다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/할')

    expect(screen.getByText('할 일 목록')).toBeInTheDocument()
    expect(screen.queryByText('제목1')).not.toBeInTheDocument()
  })

  it('영문 별칭으로도 찾는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/table')

    expect(screen.getByText('표')).toBeInTheDocument()
  })

  it('↑↓ 로 옮기고 Enter 로 고른다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    // 첫 항목이 '텍스트' — 한 칸 내리면 '제목1'.
    await user.keyboard('{ArrowDown}{Enter}')

    expect(stored()).toBe('# ')
  })

  it('Esc 로 닫으면 친 / 는 그대로 남는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('listbox', { name: '블록 고르기' }),
    ).not.toBeInTheDocument()
    expect(stored()).toBe('/')
  })

  // 날짜(`9/1 안내`)나 경로(`src/features`)까지 메뉴가 가로채면 글을 쓸 수 없다.
  it('글 중간의 / 는 메뉴를 열지 않는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('9/1 안내')

    expect(
      screen.queryByRole('listbox', { name: '블록 고르기' }),
    ).not.toBeInTheDocument()
  })

  it('검색어에 공백이 들어가면 닫는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/제목 ')

    expect(
      screen.queryByRole('listbox', { name: '블록 고르기' }),
    ).not.toBeInTheDocument()
  })

  it('새 줄에서도 열리고 앞 줄은 건드리지 않는다', async () => {
    const user = userEvent.setup()
    render(<Editor initial={'안내드립니다.\n'} />)

    await user.click(body())
    // 캐럿을 맨 끝(둘째 줄)으로.
    await user.keyboard('{End}')
    await user.keyboard('/')
    await user.click(screen.getByText('글머리 기호 목록'))

    expect(stored()).toBe('안내드립니다.\n- ')
  })

  it('메뉴 닫기 버튼으로도 닫는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await user.click(screen.getByRole('button', { name: '메뉴 닫기' }))

    expect(
      screen.queryByRole('listbox', { name: '블록 고르기' }),
    ).not.toBeInTheDocument()
  })

  // 켜지 않은 에디터(QnA 등)는 예전 그대로여야 한다.
  it('slashCommands 를 끄면 메뉴가 없다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MarkdownEditor value="" onChange={onChange} />)

    await user.click(screen.getByRole('textbox'))
    await user.keyboard('/')

    expect(
      screen.queryByRole('listbox', { name: '블록 고르기' }),
    ).not.toBeInTheDocument()
  })
})
