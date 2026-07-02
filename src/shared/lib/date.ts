// 날짜 표시 공용 유틸 — 화면 곳곳의 `iso.slice(...)` 수동 조립을 대체한다.
// Intl.DateTimeFormat(KST) 기반이라 타임존·로케일에 안전하다.

const KST = 'Asia/Seoul'

const dateFmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function toDate(value: string | number | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** ISO/타임스탬프 → 'YYYY-MM-DD' (KST). 파싱 실패 시 빈 문자열 */
export function formatDate(value?: string | number | Date | null): string {
  if (value == null || value === '') return ''
  const d = toDate(value)
  return d ? dateFmt.format(d) : ''
}

/** ISO/타임스탬프 → 'YYYY-MM-DD HH:mm' (KST). 파싱 실패 시 빈 문자열 */
export function formatDateTime(value?: string | number | Date | null): string {
  if (value == null || value === '') return ''
  const d = toDate(value)
  return d ? dateTimeFmt.format(d).replace(',', '') : ''
}
