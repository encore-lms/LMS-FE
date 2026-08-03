import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'
import { fetchLinkPreview, uploadEditorFile } from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  uploadEditorFile: vi.fn(),
  fetchLinkPreview: vi.fn(),
}))

// 이미지·파일·북마크는 고르는 것만으로 끝나지 않는다 — 올리거나 주소를 받아야 한다.
// 폼 아래 따로 칸을 두지 않고 본문 흐름 안에서 받는다.

function Editor({ onError }: { onError?: (m: string) => void } = {}) {
  const [v, setV] = useState('')
  return (
    <>
      <RichTextEditor
        value={v}
        onChange={setV}
        ariaLabel="본문"
        onError={onError}
      />
      <output data-testid="md">{v}</output>
    </>
  )
}

const body = () => screen.getByRole('textbox', { name: '본문' })
const md = () => screen.getByTestId('md').textContent ?? ''

// 블록을 고르면 자리만 잡히고, 그 줄을 눌러야 고르는 칸이 펼쳐진다.
const 자리 = {
  image: '이미지 업로드 또는 임베드',
  file: '파일 업로드 또는 임베드',
  bookmark: '웹 북마크 추가',
} as const

async function pick(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  kind: keyof typeof 자리 = 'file',
) {
  await user.click(body())
  await user.keyboard('/')
  await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument())
  await user.click(screen.getByText(label))
  await user.click(await screen.findByText(자리[kind]))
}

beforeEach(() => {
  vi.mocked(uploadEditorFile).mockReset()
  vi.mocked(fetchLinkPreview).mockReset()
  // jsdom 에는 없는 API — 편집기가 방금 고른 그림을 그 자리에 보여 줄 때 쓴다.
  URL.createObjectURL = vi.fn(() => 'blob:preview-1')
  URL.revokeObjectURL = vi.fn()
})

describe('본문 임베드', () => {
  it('이미지를 올리면 본문에 그림으로 들어간다', async () => {
    const user = userEvent.setup()
    vi.mocked(uploadEditorFile).mockResolvedValue({
      id: 'u1',
      fileName: '사진.png',
      contentType: 'image/png',
      fileSize: 100,
      image: true,
      url: 'upload:u1',
    })
    render(<Editor />)

    await pick(user, '이미지', 'image')
    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['x'], '사진.png', { type: 'image/png' }),
    )

    // 편집기에는 방금 고른 파일을 그대로 보여 주고(blob:), 저장할 값은 참조로 되돌린다 —
    // `upload:` 는 브라우저가 모르는 주소라 그 자리에 깨진 그림이 남는다.
    await waitFor(() => expect(md()).toContain('![사진.png](upload:u1)'))
    expect(body().querySelector('img')?.getAttribute('src')).toBe(
      'blob:preview-1',
    )
  })

  // 스크린샷을 '파일'로 올렸다면 그림이 아니라 받을 거리로 쓰겠다는 뜻이다.
  it('그림 파일도 파일로 올리면 이름표로 들어간다', async () => {
    const user = userEvent.setup()
    vi.mocked(uploadEditorFile).mockResolvedValue({
      id: 'u3',
      fileName: '스크린샷.png',
      contentType: 'image/png',
      fileSize: 4096,
      image: true,
      url: 'upload:u3',
    })
    render(<Editor />)

    await pick(user, '파일')
    await user.upload(
      screen.getByLabelText('첨부 파일 선택'),
      new File(['x'], '스크린샷.png', { type: 'image/png' }),
    )

    await waitFor(() =>
      expect(md()).toContain('[스크린샷.png](upload:u3 "file::4096")'),
    )
    expect(md()).not.toContain('![')
  })

  // 주소가 지워지면 저장한 글에서 받을 길이 사라진다.
  it('파일 링크의 주소가 살아 있다', async () => {
    const user = userEvent.setup()
    vi.mocked(uploadEditorFile).mockResolvedValue({
      id: 'u4',
      fileName: '자료.txt',
      contentType: 'text/plain',
      fileSize: 10,
      image: false,
      url: 'upload:u4',
    })
    render(<Editor />)

    await pick(user, '파일')
    await user.upload(
      screen.getByLabelText('첨부 파일 선택'),
      new File(['x'], '자료.txt', { type: 'text/plain' }),
    )

    await waitFor(() =>
      expect(body().querySelector('a')?.getAttribute('href')).toBe('upload:u4'),
    )
  })

  it('파일을 올리면 이름·크기를 담은 링크가 들어간다', async () => {
    const user = userEvent.setup()
    vi.mocked(uploadEditorFile).mockResolvedValue({
      id: 'u2',
      fileName: '안내문.pdf',
      contentType: 'application/pdf',
      fileSize: 2048,
      image: false,
      url: 'upload:u2',
    })
    render(<Editor />)

    await pick(user, '파일')
    await user.upload(
      screen.getByLabelText('첨부 파일 선택'),
      new File(['x'], '안내문.pdf', { type: 'application/pdf' }),
    )

    await waitFor(() =>
      expect(md()).toContain('[안내문.pdf](upload:u2 "file::2048")'),
    )
  })

  it('주소를 넣으면 북마크 메타까지 담긴다', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchLinkPreview).mockResolvedValue({
      url: 'https://www.naver.com',
      title: '네이버',
      description: '검색 포털',
      image: 'https://img/t.png',
      favicon: 'https://img/i.png',
      siteName: '네이버',
    })
    render(<Editor />)

    await pick(user, '웹 북마크', 'bookmark')
    await user.type(
      screen.getByLabelText('북마크 주소'),
      'https://www.naver.com',
    )
    await user.click(screen.getByRole('button', { name: '북마크 생성' }))

    await waitFor(() =>
      expect(md()).toContain('[네이버](https://www.naver.com'),
    )
    expect(md()).toContain('bookmark::검색 포털')
  })

  // 제목을 못 읽어 오는 사이트가 많다 — 주소라도 보이게 한다.
  it('제목을 못 읽어도 주소로 카드를 만든다', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchLinkPreview).mockResolvedValue({
      url: 'https://example.com',
      title: null,
      description: null,
      image: null,
      favicon: null,
      siteName: 'example.com',
    })
    render(<Editor />)

    await pick(user, '웹 북마크', 'bookmark')
    await user.type(screen.getByLabelText('북마크 주소'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: '북마크 생성' }))

    await waitFor(() =>
      expect(md()).toContain('[example.com](https://example.com'),
    )
  })

  it('실패하면 알리고 본문은 그대로 둔다', async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    vi.mocked(uploadEditorFile).mockRejectedValue(new Error('boom'))
    render(<Editor onError={onError} />)

    await pick(user, '파일')
    await user.upload(
      screen.getByLabelText('첨부 파일 선택'),
      new File(['x'], 'x.pdf', { type: 'application/pdf' }),
    )

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('파일을 올리지 못했어요'),
    )
    expect(md()).not.toContain('upload:')
  })

  // 일반 문구로 덮으면 왜 안 되는지 알 수 없어 같은 파일을 계속 다시 올리게 된다.
  it('서버가 말한 이유를 그대로 알린다', async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    vi.mocked(uploadEditorFile).mockRejectedValue({
      response: { data: { message: '이미지는 5MB 이하만 올릴 수 있습니다.' } },
    })
    render(<Editor onError={onError} />)

    await pick(user, '이미지')
    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['x'], '큰.png', { type: 'image/png' }),
    )

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        '이미지는 5MB 이하만 올릴 수 있습니다.',
      ),
    )
  })

  it('서버가 말이 없으면 무엇을 올리려 했는지로 알린다', async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    vi.mocked(uploadEditorFile).mockRejectedValue(new Error('네트워크'))
    render(<Editor onError={onError} />)

    await pick(user, '이미지')
    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['x'], 'a.png', { type: 'image/png' }),
    )

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('이미지를 올리지 못했어요'),
    )
  })

  it('북마크 실패도 서버 사유를 그대로 알린다', async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    vi.mocked(fetchLinkPreview).mockRejectedValue({
      response: { data: { message: '내부 주소는 미리 볼 수 없습니다.' } },
    })
    render(<Editor onError={onError} />)

    await pick(user, '웹 북마크')
    await user.type(screen.getByLabelText('북마크 주소'), 'http://127.0.0.1/')
    await user.click(screen.getByRole('button', { name: '북마크 생성' }))

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('내부 주소는 미리 볼 수 없습니다.'),
    )
  })

  // 고른 순간 `/파일` 같은 찌꺼기가 본문에 남으면 안 된다.
  it('고르면 친 슬래시 토큰은 지워진다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/파')
    await waitFor(() => expect(screen.getByText('파일')).toBeInTheDocument())
    await user.click(screen.getByText('파일'))

    expect(body().textContent).not.toContain('/파')
  })

  it('취소하면 상자가 닫힌다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await pick(user, '이미지', 'image')
    expect(
      screen.getByRole('button', { name: '파일을 선택하세요' }),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByText(자리.image)).not.toBeInTheDocument()
  })

  // 처음부터 큰 상자가 열리면 쓰던 글이 밀려 흐름이 끊긴다.
  it('블록을 고르면 자리만 잡고 고르는 칸은 접혀 있다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/파')
    await waitFor(() => expect(screen.getByText('파일')).toBeInTheDocument())
    await user.click(screen.getByText('파일'))

    // 자리만 잡힌 한 줄 — 아직 탭도 버튼도 없다.
    expect(await screen.findByText(자리.file)).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '파일을 선택하세요' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '업로드' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByText(자리.file))

    expect(
      await screen.findByRole('button', { name: '파일을 선택하세요' }),
    ).toBeVisible()
  })

  it('접힌 자리에서 Esc 를 누르면 사라진다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(body())
    await user.keyboard('/파')
    await waitFor(() => expect(screen.getByText('파일')).toBeInTheDocument())
    await user.click(screen.getByText('파일'))
    await screen.findByText(자리.file)

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByText(자리.file)).not.toBeInTheDocument(),
    )
  })
})
