import { describe, expect, it } from 'vitest'
import { splitImageAnswer } from './logs'

describe('splitImageAnswer', () => {
  const id = '1cbb2c73-1c7e-4b65-8227-851f1aa6ae0f'
  const other = '40e04744-7f02-4b29-842c-096d2776ef9d'

  it('id 만 있으면 전부 첨부로 본다', () => {
    expect(splitImageAnswer(`${id},${other}`)).toEqual({
      ids: [id, other],
      text: '',
    })
  })

  // 폐기한 'text_image' 시절 첨부 대신 적어 둔 메모가 답변에 남아 있다.
  // 전부 id 로 보고 렌더하면 깨진 이미지로 가려져 화면에서 사라진다.
  it('id 가 아닌 옛 텍스트는 갈라 낸다', () => {
    expect(splitImageAnswer('증빙자료 첨부 불가능')).toEqual({
      ids: [],
      text: '증빙자료 첨부 불가능',
    })
    expect(splitImageAnswer(` ${id} , 자료 `)).toEqual({
      ids: [id],
      text: '자료',
    })
  })

  it('빈 값·null 은 둘 다 비운다', () => {
    expect(splitImageAnswer('')).toEqual({ ids: [], text: '' })
    expect(splitImageAnswer(null)).toEqual({ ids: [], text: '' })
    expect(splitImageAnswer(' , ')).toEqual({ ids: [], text: '' })
  })
})
