// 검토 3종(§13~§15) 공용 기수 필터 — 데이터(cohortLabel)에서 옵션을 도출해 견고하게.

// 기수 필터 기본값 — 맨 앞 '전체' (예: 전체 / DA 4기 / FE 7기)
export const COHORT_ALL = '전체'

// 행의 cohortLabel에서 유니크 기수를 순서대로 추출하고 맨 앞에 '전체'를 붙인다.
export function cohortOptions(rows: { cohortLabel: string }[]): string[] {
  const seen = new Set<string>()
  const uniq: string[] = []
  for (const r of rows) {
    if (!seen.has(r.cohortLabel)) {
      seen.add(r.cohortLabel)
      uniq.push(r.cohortLabel)
    }
  }
  return [COHORT_ALL, ...uniq]
}
