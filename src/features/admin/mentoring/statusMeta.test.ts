import { describe, expect, it } from 'vitest'
import { fieldTypeMeta } from './statusMeta'

describe('fieldTypeMeta', () => {
  it('아는 타입은 라벨과 톤을 준다', () => {
    expect(fieldTypeMeta('image')).toEqual({ label: '이미지', tone: 'warning' })
    expect(fieldTypeMeta('long_text').label).toBe('긴 텍스트')
  })

  // 서버가 아는 타입이 FE 보다 넓을 수 있다 — 맵을 바로 인덱싱하다
  // undefined.label 로 일지 템플릿 화면 전체가 죽은 적이 있다(2026-08-06).
  it('모르는 타입이어도 죽지 않고 값을 그대로 보여준다', () => {
    expect(fieldTypeMeta('text_image')).toEqual({
      label: 'text_image',
      tone: 'neutral',
    })
    expect(fieldTypeMeta('')).toEqual({ label: '', tone: 'neutral' })
  })
})
