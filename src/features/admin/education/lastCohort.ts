const KEY = 'lms-admin-last-cohort'

/**
 * 과정별로 마지막에 본 기수를 기억한다.
 *
 * <p>담당 기수가 여럿일 때 어느 쪽을 주로 보는지는 사람마다 달라, 서버 데이터만으로는 정할 수 없다.
 * 한 번 고른 기수를 다음 방문에서 그대로 열어 매번 다시 고르는 수고를 없앤다.
 * 저장 실패(사파리 프라이빗 등)는 무시한다 — 기억은 편의 기능이라 없어도 화면은 동작한다.</p>
 */
export function readLastCohort(courseId: string | null): string | null {
  if (!courseId) return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? ((JSON.parse(raw) as Record<string, string>)[courseId] ?? null) : null
  } catch {
    return null
  }
}

export function writeLastCohort(courseId: string, cohortId: string) {
  try {
    const raw = localStorage.getItem(KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    if (map[courseId] === cohortId) return
    localStorage.setItem(KEY, JSON.stringify({ ...map, [courseId]: cohortId }))
  } catch {
    // 저장 못 해도 기본 선택 로직이 있어 화면은 정상 동작한다.
  }
}
