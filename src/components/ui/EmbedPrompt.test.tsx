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

async function pick(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(body())
  await user.keyboard('/')
  await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument())
  await user.click(screen.getByText(label))
}

beforeEach(() => {
  vi.mocked(uploadEditorFile).mockReset()
  vi.mocked(fetchLinkPreview).mockReset()
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

    await pick(user, '이미지')
    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['x'], '사진.png', { type: 'image/png' }),
    )

    await waitFor(() => expect(md()).toContain('![사진.png](upload:u1)'))
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

    await pick(user, '웹 북마크')
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

    await pick(user, '웹 북마크')
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

    await pick(user, '이미지')
    expect(screen.getByText('이미지 추가')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByText('이미지 추가')).not.toBeInTheDocument()
  })
})
