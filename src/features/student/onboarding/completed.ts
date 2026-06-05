// 온보딩 완료 여부 — 사용자별 localStorage 플래그(백엔드 플래그 없음, MVP).
// 완료/건너뛰기 시 markOnboarded → 다음 로그인부터 게이트가 통과시켜 대시보드로 바로.
const key = (userId: string) => `lms-onboarded:${userId}`

export function isOnboarded(userId: string): boolean {
  try {
    return localStorage.getItem(key(userId)) === '1'
  } catch {
    return false
  }
}

export function markOnboarded(userId: string): void {
  try {
    localStorage.setItem(key(userId), '1')
  } catch {
    /* localStorage 비가용 환경 무시 */
  }
}
