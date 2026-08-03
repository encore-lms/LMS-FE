import { describe, expect, it } from 'vitest'
import { markdownToText } from './markdownText'

// 목록 카드 요약용 — 기호만 지우고 내용은 남긴다.

describe('markdownToText', () => {
  it('헤딩·강조·인라인 코드 기호를 걷어낸다', () => {
    expect(
      markdownToText('## 로그인 타임아웃\n\n- API 응답이 `30s` 를 넘음'),
    ).toBe('로그인 타임아웃 API 응답이 30s 를 넘음')
  })

  it('강조는 쌍으로 감싼 것만 — 식별자의 밑줄은 건드리지 않는다', () => {
    expect(markdownToText('**전체** user_id 조회')).toBe('전체 user_id 조회')
  })

  it('링크는 글자만 남기고 이미지는 지운다', () => {
    expect(
      markdownToText(
        '[문서](https://a.b) 참고 ![캡처](data:image/png;base64,x)',
      ),
    ).toBe('문서 참고')
  })

  it('코드 펜스는 통째로 뺀다', () => {
    expect(markdownToText('원인:\n```sql\nselect 1\n```\n해결함')).toBe(
      '원인: 해결함',
    )
  })

  it('번호 목록 마커도 줄머리에서만 지운다', () => {
    expect(markdownToText('1. 타임아웃 30s → 5s\n2. 인덱스 추가')).toBe(
      '타임아웃 30s → 5s 인덱스 추가',
    )
  })

  // 편집기가 저장할 때 `<` 를 엔티티로 바꾼다 — 요약은 렌더러를 거치지 않아 그냥 두면
  // 목록에 `&lt;script&gt;` 가 글자 그대로 보인다.
  it('HTML 엔티티를 원래 글자로 되돌린다', () => {
    expect(
      markdownToText('&lt;script&gt; 안내 &amp; 공지 &quot;중요&quot;'),
    ).toBe('<script> 안내 & 공지 "중요"')
  })

  it('이미 실체가 된 &amp; 를 한 번 더 풀지 않는다', () => {
    expect(markdownToText('&amp;lt; 는 글자')).toBe('&lt; 는 글자')
  })

  it('역슬래시로 감싼 기호를 되돌린다', () => {
    expect(markdownToText('snake\\_case 와 1\\. 항목')).toBe(
      'snake_case 와 1. 항목',
    )
  })

  it('빈 값은 빈 문자열', () => {
    expect(markdownToText(null)).toBe('')
    expect(markdownToText(undefined)).toBe('')
  })
})
