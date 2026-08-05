import axios from 'axios'

/**
 * 서버가 준 사유를 그대로 쓴다 — 없을 때만 fallback.
 *
 * <p>막힌 이유를 서버만 알고 있는 경우가 있다(예: 어떤 예약과 겹쳤는지).
 * 화면이 '실패했어요'로 뭉뚱그리면 사용자는 무엇을 고쳐야 할지 알 수 없다.</p>
 */
export function apiErrorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
  }
  return fallback
}
