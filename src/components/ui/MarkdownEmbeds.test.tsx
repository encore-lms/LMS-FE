import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Markdown } from './Markdown'
import { bookmarkTitle, fileTitle, parseEmbedTitle } from './embedMeta'
import { fetchEditorUpload } from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  fetchEditorUpload: vi.fn(),
}))

const upload = vi.mocked(fetchEditorUpload)

beforeEach(() => {
  upload.mockReset()
  upload.mockResolvedValue(new Blob(['x']))
  // jsdom 에는 없는 API — 받아 온 파일을 화면에 물리는 통로다.
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
})

// 본문은 마크다운으로 저장하고, 카드형 블록은 링크 title 에 메타를 담아 표현한다.
// 마크다운을 모르는 도구가 읽어도 평범한 링크로 보이는 게 이 방식의 장점이다.

describe('카드 메타 표기', () => {
  it('북마크 메타를 넣고 다시 읽는다', () => {
    const title = bookmarkTitle({
      description: '설명',
      image: 'https://img',
      favicon: 'https://ico',
    })
    expect(parseEmbedTitle(title)).toEqual({
      kind: 'bookmark',
      description: '설명',
      image: 'https://img',
      favicon: 'https://ico',
    })
  })

  // 구분자가 값에 섞이면 뒤 칸이 밀려 엉뚱한 값이 들어간다.
  it('설명에 구분자가 있어도 칸이 밀리지 않는다', () => {
    const parsed = parseEmbedTitle(
      bookmarkTitle({ description: 'a::b', image: 'https://img' }),
    )
    expect(parsed).toMatchObject({ kind: 'bookmark', image: 'https://img' })
  })

  it('파일 크기를 넣고 다시 읽는다', () => {
    expect(parseEmbedTitle(fileTitle(2048))).toEqual({
      kind: 'file',
      size: 2048,
    })
  })

  it('평범한 링크 title 은 카드가 아니다', () => {
    expect(parseEmbedTitle('그냥 설명')).toBeNull()
    expect(parseEmbedTitle(undefined)).toBeNull()
  })
})

describe('본문 렌더', () => {
  it('북마크는 제목·설명·주소가 있는 카드로 그려진다', () => {
    const md = `[네이버](https://www.naver.com "${bookmarkTitle({
      description: '검색 포털',
      image: 'https://img/thumb.png',
      favicon: 'https://img/ico.png',
    })}")`
    render(<Markdown>{md}</Markdown>)

    const link = screen.getByRole('link', { name: /네이버/ })
    expect(link).toHaveAttribute('href', 'https://www.naver.com')
    expect(screen.getByText('검색 포털')).toBeInTheDocument()
    expect(screen.getByText('https://www.naver.com')).toBeInTheDocument()
  })

  // 본문 이미지용 CSS(원본 크기까지 허용)가 카드 안까지 덮으면 파비콘이 부풀어 카드가 무너진다.
  it('북마크 카드 안 그림은 본문 이미지 규칙에서 빠진다', () => {
    const md = `[네이버](https://www.naver.com "${bookmarkTitle({
      description: '검색 포털',
      image: 'https://img/thumb.png',
      favicon: 'https://img/ico.png',
    })}")`
    render(<Markdown>{md}</Markdown>)

    const imgs = [...document.querySelectorAll('a img')]
    expect(imgs).toHaveLength(2)
    expect(imgs.every((i) => i.hasAttribute('data-embed'))).toBe(true)
  })

  it('카드 높이를 못으로 박아 남의 그림에 늘어나지 않는다', () => {
    const md = `[네이버](https://www.naver.com "${bookmarkTitle({ image: 'https://img/t.png' })}")`
    render(<Markdown>{md}</Markdown>)

    expect(screen.getByRole('link', { name: /네이버/ }).className).toContain(
      'h-[108px]',
    )
  })

  it('파일은 이름과 크기가 있는 칩으로 그려진다', () => {
    render(
      <Markdown>{`[안내문.pdf](upload:abc "${fileTitle(2048)}")`}</Markdown>,
    )

    expect(screen.getByText('안내문.pdf')).toBeInTheDocument()
    expect(screen.getByText('2KB')).toBeInTheDocument()
  })

  // 본문 안에 놓이는 블록이라 상자로 가두지 않는다 — 한 줄을 다 쓴다.
  it('파일 칩은 테두리 없이 한 줄을 다 쓴다', () => {
    render(
      <Markdown>{`[안내문.pdf](upload:abc "${fileTitle(2048)}")`}</Markdown>,
    )

    const chip = screen.getByRole('button', { name: '안내문.pdf 내려받기' })
    expect(chip.className).toContain('w-full')
    expect(chip.className).not.toMatch(/(^|\s)border($|\s)/)
  })

  // 주소를 그대로 걸면 401 이 난다 — 브라우저가 스스로 부르는 요청에는 토큰이 붙지 않는다.
  it('파일 칩을 누르면 받아서 내려준다', async () => {
    const user = userEvent.setup()
    // 진짜로 누르면 jsdom 이 페이지 이동을 시도한다 — 눌렀다는 사실만 본다.
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    render(
      <Markdown uploadScope="staff">
        {`[안내문.pdf](upload:abc "${fileTitle(2048)}")`}
      </Markdown>,
    )

    await user.click(
      screen.getByRole('button', { name: '안내문.pdf 내려받기' }),
    )

    await waitFor(() => expect(upload).toHaveBeenCalledWith('abc', 'staff'))
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })

  it('받지 못하면 칩 안에서 알린다', async () => {
    const user = userEvent.setup()
    upload.mockRejectedValue(new Error('403'))
    render(
      <Markdown>{`[안내문.pdf](upload:abc "${fileTitle(2048)}")`}</Markdown>,
    )

    await user.click(
      screen.getByRole('button', { name: '안내문.pdf 내려받기' }),
    )

    expect(await screen.findByText('내려받지 못했어요')).toBeInTheDocument()
  })

  // 본문에는 접두사 없는 논리 참조만 담긴다 — 같은 글을 수강생과 강사가 함께 보기 때문이다.
  it('업로드 참조를 읽는 사람의 역할로 받아 온다', async () => {
    const { unmount } = render(
      <Markdown uploadScope="student">![사진](upload:img-1)</Markdown>,
    )
    await waitFor(() => expect(upload).toHaveBeenCalledWith('img-1', 'student'))
    expect(await screen.findByRole('img', { name: '사진' })).toHaveAttribute(
      'src',
      'blob:fake',
    )
    unmount()

    render(<Markdown uploadScope="staff">![사진](upload:img-1)</Markdown>)
    await waitFor(() => expect(upload).toHaveBeenCalledWith('img-1', 'staff'))
  })

  it('불러오지 못한 이미지는 깨진 그림 대신 이름을 남긴다', async () => {
    upload.mockRejectedValue(new Error('404'))
    render(<Markdown>![사진](upload:img-1)</Markdown>)

    expect(await screen.findByText(/사진 — 불러오지 못했어요/)).toBeVisible()
  })

  it('카드가 아닌 링크는 그대로 둔다', () => {
    render(<Markdown>[문서](https://playdata.io)</Markdown>)
    const link = screen.getByRole('link', { name: '문서' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.className).not.toContain('rounded-xl')
  })
})
