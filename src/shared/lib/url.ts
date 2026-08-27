// URL 형식 검증 — http/https 주소만 허용한다(BE @HttpUrl·auth normalizeOptionalUrl과 같은 규칙).
// 빈 문자열 허용 여부는 호출 측(선택 입력)에서 판단한다.
export const URL_FORMAT_MESSAGE =
  'http:// 또는 https:// 로 시작하는 주소만 입력할 수 있어요'

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return (
      (u.protocol === 'http:' || u.protocol === 'https:') &&
      u.hostname.length > 0
    )
  } catch {
    return false
  }
}
