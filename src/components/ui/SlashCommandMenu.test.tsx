import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'

// 슬래시 명령 — 빈 문단에서 `/` 를 치면 블록을 고르는 메뉴가 뜬다.
// 고른 블록은 기호가 아니라 실제 서식으로 바뀌고, 저장은 마크다운으로 나간다.

function Editor({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial)
  return (
    <>
      <RichTextEditor value={v} onChange={setV} ariaLabel="본문" />
      <output data-testid="md">{v}</output>
    </>
  )
}

const body = () => screen.getByRole('textbox', { name: '본문' })
const markdown = () => screen.getByTestId('md').textContent ?? ''
const menu = () => screen.queryByRole('listbox', { name: '블록 고르기' })

describe('슬래시 명령', () => {
  it('빈 문단에서 / 를 치면 블록 목록이 뜬다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')

    await waitFor(() => expect(menu()).toBeVisible())
    expect(screen.getByText('제목1')).toBeInTheDocument()
    expect(screen.getByText('할 일 목록')).toBeInTheDocument()
  })

  // 핵심 — 고르면 `###` 같은 기호가 남지 않고 그 자리에서 제목이 된다.
  it('제목을 고르면 기호 없이 제목 서식이 된다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await waitFor(() => expect(menu()).toBeVisible())
    await user.click(screen.getByText('제목2'))

    await user.keyboard('안내')
    // 화면에는 진짜 제목 요소로 그려진다.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        '안내',
      ),
    )
    // 저장은 마크다운으로 — 읽는 쪽이 마크다운을 전제한다.
    expect(markdown()).toContain('## 안내')
    // 입력창에 기호가 글자로 남아 있으면 안 된다.
    expect(body().textContent).not.toContain('##')
  })

  it('글머리 기호 목록을 고르면 목록이 된다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await waitFor(() => expect(menu()).toBeVisible())
    await user.click(screen.getByText('글머리 기호 목록'))
    await user.keyboard('노트북')

    await waitFor(() => expect(screen.getByRole('list')).toBeInTheDocument())
    expect(markdown()).toContain('- 노트북')
  })

  it('이어서 친 글자로 목록을 좁힌다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/할')

    await waitFor(() =>
      expect(screen.getByText('할 일 목록')).toBeInTheDocument(),
    )
    expect(screen.queryByText('제목1')).not.toBeInTheDocument()
  })

  it('영문 별칭으로도 찾는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/table')

    await waitFor(() => expect(screen.getByText('표')).toBeInTheDocument())
  })

  it('↑↓ 로 옮기고 Enter 로 고른다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await waitFor(() => expect(menu()).toBeVisible())
    // 첫 항목이 '텍스트' — 한 칸 내리면 '제목1'.
    await user.keyboard('{ArrowDown}{Enter}')
    await user.keyboard('공지')

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
    )
  })

  it('Esc 로 닫는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await waitFor(() => expect(menu()).toBeVisible())
    await user.keyboard('{Escape}')

    await waitFor(() => expect(menu()).not.toBeInTheDocument())
  })

  // 날짜(`9/1 안내`)나 경로(`src/features`)까지 가로채면 글을 쓸 수 없다.
  it('글 중간의 / 는 메뉴를 열지 않는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('9/1 안내')

    expect(menu()).not.toBeInTheDocument()
  })

  it('메뉴 닫기 버튼으로도 닫는다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/')
    await waitFor(() => expect(menu()).toBeVisible())
    await user.click(screen.getByRole('button', { name: '메뉴 닫기' }))

    await waitFor(() => expect(menu()).not.toBeInTheDocument())
  })
})

describe('마크다운 왕복', () => {
  it('이미 쌓인 마크다운 글을 서식으로 펴서 보여준다', async () => {
    render(<Editor initial={'## 준비물\n\n- 노트북\n- 충전기'} />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        '준비물',
      ),
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    // 기호가 글자로 보이면 펴지지 않은 것이다.
    expect(body().textContent).not.toContain('##')
  })

  it('머리말 툴바는 없다', () => {
    render(<Editor />)

    expect(
      screen.queryByRole('button', { name: '작성' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '미리보기' }),
    ).not.toBeInTheDocument()
  })
})
