import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownEditor } from './MarkdownEditor'
import { uploadEditorFile, type UploadScope } from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  uploadEditorFile: vi.fn(),
}))

// 회귀: 부모가 mentionNames를 렌더마다 새 배열로 넘기고 onMentionsChange 결과를
// state로 되돌리는 실제 사용 패턴(QnA 상세)에서, 파싱 결과가 같으면 콜백을 재발행하지
// 않아야 한다 — 과거엔 이 조합이 무한 리렌더 루프가 되어 라우터 전환이 멈췄다.
function Harness({ spy }: { spy: (names: string[]) => void }) {
  const [value, setValue] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  return (
    <>
      <MarkdownEditor
        uploadScope="student"
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
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe(
      'true',
    )
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

// 첨부 — 예전엔 base64 를 브라우저 메모리에만 담아 글은 저장돼도 그림이 새로고침에 사라졌다.
// 이제 서버에 올리고 본문에는 `upload:{id}` 참조만 남는다.
function AttachHarness({ scope = 'student' }: { scope?: UploadScope }) {
  const [value, setValue] = useState('')
  return (
    <>
      <MarkdownEditor value={value} onChange={setValue} uploadScope={scope} />
      <output data-testid="body">{value}</output>
    </>
  )
}

const upload = vi.mocked(uploadEditorFile)

describe('MarkdownEditor 첨부', () => {
  it('고른 이미지를 서버에 올리고 본문에 upload 참조를 넣는다', async () => {
    upload.mockResolvedValue({
      id: 'u1',
      fileName: '설계.png',
      contentType: 'image/png',
      fileSize: 2048,
      image: true,
      url: 'upload:u1',
    })
    const user = userEvent.setup()
    render(<AttachHarness />)
    const input = document.querySelector<HTMLInputElement>(
      'input[accept="image/*"]',
    )!
    await user.upload(input, new File(['x'], '설계.png', { type: 'image/png' }))
    expect(screen.getByTestId('body').textContent).toContain(
      '![설계.png](upload:u1)',
    )
  })

  it('이미지가 아닌 파일은 크기를 담은 카드 링크로 넣는다', async () => {
    upload.mockResolvedValue({
      id: 'u2',
      fileName: '회의록.pdf',
      contentType: 'application/pdf',
      fileSize: 12345,
      image: false,
      url: 'upload:u2',
    })
    const user = userEvent.setup()
    render(<AttachHarness />)
    // 파일 버튼의 입력칸은 accept 를 걸지 않는다(무엇이든 받는다).
    const input = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="file"]'),
    ).find((el) => !el.accept)!
    await user.upload(
      input,
      new File(['x'], '회의록.pdf', { type: 'application/pdf' }),
    )
    expect(screen.getByTestId('body').textContent).toContain(
      '[회의록.pdf](upload:u2 "file::12345")',
    )
  })

  it('수강생 화면이면 수강생 경로로 올린다', async () => {
    upload.mockResolvedValue({
      id: 'u3',
      fileName: 'a.png',
      contentType: 'image/png',
      fileSize: 10,
      image: true,
      url: 'upload:u3',
    })
    const user = userEvent.setup()
    render(<AttachHarness scope="student" />)
    await user.upload(
      document.querySelector<HTMLInputElement>('input[accept="image/*"]')!,
      new File(['x'], 'a.png', { type: 'image/png' }),
    )
    expect(upload).toHaveBeenLastCalledWith(expect.any(File), 'student')
  })

  it('한도를 넘는 파일은 올리지 않고 이유를 알린다', async () => {
    upload.mockClear()
    const rejected = vi.fn()
    const user = userEvent.setup()
    render(
      <MarkdownEditor
        uploadScope="student"
        value=""
        onChange={vi.fn()}
        onImageRejected={rejected}
      />,
    )
    const big = new File(['x'], '큰그림.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
    await user.upload(
      document.querySelector<HTMLInputElement>('input[accept="image/*"]')!,
      big,
    )
    expect(upload).not.toHaveBeenCalled()
    expect(rejected).toHaveBeenCalledWith(
      '이미지는 5MB 이하만 첨부할 수 있어요',
    )
  })

  it('끌어다 놓아도 첨부된다', async () => {
    upload.mockClear()
    upload.mockResolvedValue({
      id: 'u4',
      fileName: 'drop.png',
      contentType: 'image/png',
      fileSize: 10,
      image: true,
      url: 'upload:u4',
    })
    render(<AttachHarness />)
    const box = screen.getByRole('textbox')
    const file = new File(['x'], 'drop.png', { type: 'image/png' })
    const dt = {
      types: ['Files'],
      files: [file],
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
    }
    fireEvent.dragOver(box, { dataTransfer: dt })
    expect(
      await screen.findByText('여기에 놓으면 첨부돼요'),
    ).toBeInTheDocument()
    fireEvent.drop(box, { dataTransfer: dt })
    await waitFor(() =>
      expect(screen.getByTestId('body').textContent).toContain('upload:u4'),
    )
  })
})
