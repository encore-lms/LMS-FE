import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useDiagnosisReports } from './api'
import { ReportView } from './ReportView'
import { WeekBrowser } from './WeekBrowser'

// 그룹 진단 리포트 패널 — 매니저 기수 허브(진단 리포트 탭)에 임베드된다.
// 주차 선택은 ?week= 로 백업(useSearchParamState — 허브의 ?tab= 등 다른 파라미터 보존).
export function GroupReportPane() {
  const query = useDiagnosisReports()
  const [weekParam, setWeekParam] = useSearchParamState('week')

  const reports = query.data ?? []
  const latestWeek = reports.reduce((max, r) => Math.max(max, r.week), 0)
  const parsed = Number(weekParam)
  const selected =
    reports.find((r) => r.week === parsed) ??
    reports.find((r) => r.week === latestWeek)

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
    >
      {selected && (
        <WeekBrowser
          items={reports.map((r) => ({
            week: r.week,
            baseDate: r.baseDate,
            alertLabel: (() => {
              const count = r.students.filter(
                (s) => s.riskSignals.length > 0,
              ).length
              return count > 0 ? `⚠ ${count}` : undefined
            })(),
          }))}
          selected={selected.week}
          onSelect={(week) => setWeekParam(String(week))}
        >
          <ReportView report={selected} />
        </WeekBrowser>
      )}
    </DataBoundary>
  )
}
