import { useMileageCohorts } from './cohortsApi'

// 마일리지 기수 선택 드롭다운 — '전체 기수'(빈 값) + 실제 기수 목록.
// value=''는 전체 스코프(cohortId 미전달). BE가 계정 기수 스냅샷 기준으로 필터한다.
export function CohortScopeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (cohortId: string) => void
}) {
  const { data: cohorts } = useMileageCohorts()
  return (
    <select
      aria-label="기수 필터"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-border text-fg focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
    >
      <option value="">전체 기수</option>
      {(cohorts ?? []).map((c) => (
        <option key={c.cohortId} value={c.cohortId}>
          {c.label}
        </option>
      ))}
    </select>
  )
}
