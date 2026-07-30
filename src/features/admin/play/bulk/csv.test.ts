import { describe, expect, it } from 'vitest'
import { parseTypingCsv } from './csv'

describe('parseTypingCsv', () => {
  it('정상 행을 파싱하고 라벨을 정규화한다', () => {
    const { rows, headerError } = parseTypingCsv(
      'language,level,title,content,sortOrder\n' +
        'python,easy,제목 하나,본문 하나,10\n' +
        '영문,보통,Title,"쉼표, 포함 본문",20\n',
    )
    expect(headerError).toBeUndefined()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      rowNo: 2,
      language: 'Python',
      level: '쉬움',
      order: 10,
      errors: [],
    })
    expect(rows[1].content).toBe('쉼표, 포함 본문')
    expect(rows[1].errors).toEqual([])
  })

  it('필수 열이 빠지면 파일 수준 오류를 낸다', () => {
    const { headerError, rows } = parseTypingCsv('title,content\nA,B\n')
    expect(headerError).toContain('필수 열')
    expect(rows).toHaveLength(0)
  })

  it('행 오류(빈 제목·잘못된 라벨·비정수 정렬)를 사유와 함께 표시한다', () => {
    const { rows } = parseTypingCsv(
      'language,level,title,content,sortOrder\n' +
        'Java,중간,,본문,abc\n',
    )
    expect(rows[0].errors).toEqual(
      expect.arrayContaining([
        'title 필수',
        'language는 Python·한글·영문',
        'level은 쉬움·보통·어려움',
        'sortOrder는 정수',
      ]),
    )
  })
})
