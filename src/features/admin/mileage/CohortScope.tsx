import { Select } from '@/components/ui/Select'
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
    <Select
      aria-label="기수 필터"
      value={value}
      onChange={(v) => onChange(v)}
      options={[
        { value: '', label: '전체 기수' },
        ...(cohorts ?? []).map((c) => ({ value: c.cohortId, label: c.label })),
      ]}
      className="h-9"
    />
  )
}
