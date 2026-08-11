import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { CourseTabs } from '../CourseTabs'
import { useCourseHubHeader } from '../useCourseHubHeader'
import { useMyDiagnosisReports } from './api'
import { MyReportView } from './MyReportView'
import { WeekBrowser } from './WeekBrowser'

// 진단 리포트(수강생) — 내 주간 수준 진단 24주치를 주차별로 1건씩 열람하는 화면.
// 그룹(전체 학생) 리포트는 매니저 기수 허브의 진단 리포트 탭(GroupReportPane)으로 이관(2026-08-10).
// 주차 선택은 ?week= 로 백업(딥링크·새로고침 보존).
export default function DiagnosisReportPage() {
  useCourseHubHeader()
  const query = useMyDiagnosisReports()
  const [weekParam, setWeekParam] = useSearchParamState('week')

  const reports = query.data ?? []
  const latestWeek = reports.reduce((max, r) => Math.max(max, r.week), 0)
  const parsed = Number(weekParam)
  const selected =
    reports.find((r) => r.week === parsed) ??
    reports.find((r) => r.week === latestWeek)

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />
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
              alertLabel: r.needsAttention ? '⚠' : undefined,
            }))}
            selected={selected.week}
            onSelect={(week) => setWeekParam(String(week))}
          >
            <MyReportView report={selected} />
          </WeekBrowser>
        )}
      </DataBoundary>
    </div>
  )
}
