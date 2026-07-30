import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownEditor } from './MarkdownEditor'

// 회귀: 부모가 mentionNames를 렌더마다 새 배열로 넘기고 onMentionsChange 결과를
// state로 되돌리는 실제 사용 패턴(QnA 상세)에서, 파싱 결과가 같으면 콜백을 재발행하지
// 않아야 한다 — 과거엔 이 조합이 무한 리렌더 루프가 되어 라우터 전환이 멈췄다.
function Harness({ spy }: { spy: (names: string[]) => void }) {
  const [value, setValue] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  return (
    <>
      <MarkdownEditor
        value={value}
        onChange={setValue}
        // 의도적으로 매 렌더 새 배열(무한 루프 재현 조건)
        mentionNames={['김강사', '박수진']}
        onMentionsChange={(names) => {
          spy(names)
          setMentions(names)
        }}
      />
      <output data-testid="mentions">{mentions.join(',')}</output>
    </>
  )
}

describe('MarkdownEditor 멘션 파싱', () => {
  it('파싱 결과가 그대로면 onMentionsChange를 재발행하지 않는다(무한 루프 방지)', async () => {
    const spy = vi.fn()
    render(<Harness spy={spy} />)
    // 마운트 정착 후 발행은 1회(빈 결과)여야 한다 — 루프가 있으면 수십 회 이상 쌓인다.
    await new Promise((r) => setTimeout(r, 50))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith([])
  })

  it('본문에 @이름이 등장하면 해당 이름을 발행한다', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness spy={spy} />)
    await user.type(screen.getByRole('textbox'), '@김강사 확인 부탁드려요')
    expect(screen.getByTestId('mentions').textContent).toBe('김강사')
  })

  it('제안 리스트를 ↓로 이동해 Enter로 선택할 수 있다', async () => {
    const user = userEvent.setup()
    render(<Harness spy={vi.fn()} />)
    const box = screen.getByRole('textbox')
    await user.type(box, '@')
    // 제안 리스트 노출 + 첫 항목 활성
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(
      screen.getAllByRole('option')[0].getAttribute('aria-selected'),
    ).toBe('true')
    await user.keyboard('{ArrowDown}{Enter}')
    // 두 번째 후보(박수진)가 본문에 삽입되고 리스트는 닫힌다
    expect((box as HTMLTextAreaElement).value).toBe('@박수진 ')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('Tab으로도 활성 후보를 선택할 수 있다', async () => {
    const user = userEvent.setup()
    render(<Harness spy={vi.fn()} />)
    const box = screen.getByRole('textbox')
    await user.type(box, '@김')
    await user.keyboard('{Tab}')
    expect((box as HTMLTextAreaElement).value).toBe('@김강사 ')
  })

  it('멘션된 토큰은 입력창 백드롭에 하이라이트로 표시된다', async () => {
    const user = userEvent.setup()
    render(<Harness spy={vi.fn()} />)
    await user.type(screen.getByRole('textbox'), '@김강사 진행 상황 공유해요')
    const chips = screen.getAllByTestId('mention-highlight')
    expect(chips).toHaveLength(1)
    expect(chips[0].textContent).toBe('@김강사')
  })
})
