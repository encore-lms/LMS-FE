import { type ReactNode } from 'react'
import { type Column } from './DataTable'

/**
 * 과정/기수 목록의 공용 컬럼 — 강사와 운영이 같은 표를 본다.
 *
 * <p>같은 기수를 두 화면이 다른 컬럼·다른 폭으로 그리면 어느 쪽 수를 믿어야 할지 알 수 없다.
 * 컬럼 정의를 여기 한 벌만 두고, 역할별로 다른 것은 세 번째 칸({@link CohortDirectoryRow.lead})
 * 하나로 좁힌다 — 강사는 본인 역할 배지, 운영은 그 기수의 담당 강사 이름.</p>
 */
export interface CohortDirectoryRow {
  id: string
  /** '과정명 32기' */
  name: string
  /** '과정명 · 32회차' */
  subtitle: string
  period: string
  dday: string
  /** 세 번째 칸 — 강사는 역할 배지, 운영은 담당 강사 이름. */
  lead: ReactNode
  students: number
  /** 위험 학생 수. 0이면 칩을 그리지 않는다. */
  riskCount?: number
  evalSummary: string
  evalPending: string
  reviewSummary: string
  reviewPending: string
}

/**
 * 6개 공용 컬럼. 역할별 액션 컬럼은 뒤에 이어 붙인다.
 *
 * @param leadHeader 세 번째 칸 헤더 — 강사 '담당 역할', 운영 '담당 강사'.
 */
export function cohortColumns<T extends CohortDirectoryRow>(
  leadHeader: string,
): Column<T>[] {
  return [
    {
      key: 'cohort',
      header: '과정/기수',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.name}</p>
          <p className="text-fg-subtle text-xs">{r.subtitle}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: '운영 기간',
      // 날짜 범위(2026.03.02 ~ 2026.08.28)가 한 줄에 들어갈 폭.
      className: 'w-48',
      cell: (r) => (
        <div>
          <p className="text-fg-muted text-sm whitespace-nowrap">{r.period}</p>
          <p className="text-accent-strong text-xs font-bold">{r.dday}</p>
        </div>
      ),
    },
    {
      key: 'lead',
      header: leadHeader,
      className: 'w-28',
      cell: (r) => r.lead,
    },
    {
      key: 'students',
      header: '수강생',
      // "24명 + 위험 N" 칩이 한 줄에 나란히 놓이는 폭.
      className: 'w-32',
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="text-fg shrink-0 text-sm font-medium whitespace-nowrap">
            {r.students}명
          </span>
          {(r.riskCount ?? 0) > 0 && (
            <span className="bg-danger-bg text-danger shrink-0 rounded px-1.5 py-px text-[10px] font-bold whitespace-nowrap">
              위험 {r.riskCount}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'eval',
      header: '평가',
      className: 'w-40',
      cell: (r) => (
        <div>
          <p className="text-fg-subtle text-xs">{r.evalSummary}</p>
          <p className="text-warning text-sm font-medium">{r.evalPending}</p>
        </div>
      ),
    },
    {
      key: 'review',
      header: '검토',
      className: 'w-44',
      cell: (r) => (
        <div>
          <p className="text-fg-subtle text-xs">{r.reviewSummary}</p>
          <p className="text-info text-sm font-medium">{r.reviewPending}</p>
        </div>
      ),
    },
  ]
}
