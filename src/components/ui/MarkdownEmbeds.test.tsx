import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Markdown } from './Markdown'
import { bookmarkTitle, fileTitle, parseEmbedTitle } from './embedMeta'

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

  it('파일은 이름과 크기가 있는 칩으로 그려진다', () => {
    render(
      <Markdown>{`[안내문.pdf](upload:abc "${fileTitle(2048)}")`}</Markdown>,
    )

    expect(screen.getByText('안내문.pdf')).toBeInTheDocument()
    expect(screen.getByText('2KB')).toBeInTheDocument()
  })

  // 본문에는 접두사 없는 논리 참조만 담긴다 — 같은 글을 수강생과 강사가 함께 보기 때문이다.
  it('업로드 참조를 읽는 사람의 역할에 맞는 경로로 바꾼다', () => {
    const { unmount } = render(
      <Markdown uploadScope="student">![사진](upload:img-1)</Markdown>,
    )
    expect(
      screen.getByRole('img', { name: '사진' }).getAttribute('src'),
    ).toContain('/student/editor/uploads/img-1/file')
    unmount()

    render(<Markdown uploadScope="staff">![사진](upload:img-1)</Markdown>)
    expect(
      screen.getByRole('img', { name: '사진' }).getAttribute('src'),
    ).toContain('/instructor/editor/uploads/img-1/file')
  })

  it('카드가 아닌 링크는 그대로 둔다', () => {
    render(<Markdown>[문서](https://playdata.io)</Markdown>)
    const link = screen.getByRole('link', { name: '문서' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.className).not.toContain('rounded-xl')
  })
})
