import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { apiErrorMessage } from './errorMessage'

/** 서버 응답을 흉내낸 AxiosError — status/body만 있으면 충분하다. */
function axiosError(status: number, body: unknown): AxiosError {
  const e = new AxiosError('req failed')
  e.response = {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: body,
  }
  return e
}

describe('apiErrorMessage', () => {
  // 막힌 이유를 서버만 아는 경우가 있다 — 뭉뚱그리면 무엇을 고칠지 알 수 없다.
  it('서버가 준 사유를 그대로 쓴다', () => {
    const e = axiosError(409, {
      message: '이미 확정된 멘토링과 시간이 겹칩니다 (2026-09-10(목) 14:00 ~ 16:00).',
    })

    expect(apiErrorMessage(e, '실패했어요')).toContain('시간이 겹칩니다')
  })

  it('사유가 없으면 fallback을 쓴다', () => {
    expect(apiErrorMessage(axiosError(500, {}), '실패했어요')).toBe('실패했어요')
  })

  it('네트워크 오류처럼 응답이 없어도 fallback을 쓴다', () => {
    expect(apiErrorMessage(new Error('offline'), '실패했어요')).toBe(
      '실패했어요',
    )
  })
})
