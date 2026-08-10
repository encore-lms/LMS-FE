import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { CourseTabs } from '../CourseTabs'
import { useCourseHubHeader } from '../useCourseHubHeader'
import { useDiagnosisReports } from './api'
import { ReportView } from './ReportView'
import type { WeeklyDiagnosisReport } from './types'

// 진단 리포트 — 주간 수준 진단(LLM PoV) 24주치를 주차별로 1건씩 열람하는 화면.
// 좌측 주차 목록(최신 우선) + 우측 단일 리포트. 선택은 ?week= 쿼리로 유지(딥링크·새로고침 보존).

function WeekList({
  reports,
  selected,
  onSelect,
}: {
  reports: WeeklyDiagnosisReport[]
  selected: number
  onSelect: (week: number) => void
}) {
  return (
    <nav
      aria-label="주차 선택"
      className="border-border bg-surface w-full shrink-0 self-start rounded-xl border p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:w-52 lg:overflow-y-auto"
    >
      <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
        {reports.map((r) => {
          const active = r.week === selected
          const riskCount = r.students.filter(
            (s) => s.riskSignals.length > 0,
          ).length
          return (
            <li key={r.week} className="shrink-0">
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(r.week)}
                className={cn(
                  'flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors',
                  active
                    ? 'bg-brand-deep text-white'
                    : 'text-fg-muted hover:bg-surface-muted',
                )}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap">
                  {r.week}주차
                  {riskCount > 0 && (
                    <span
                      className={cn(
                        'rounded px-1 text-[10px] font-bold',
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-warning-bg text-warning',
                      )}
                    >
                      ⚠ {riskCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[11px] whitespace-nowrap tabular-nums',
                    active ? 'text-white/70' : 'text-fg-subtle',
                  )}
                >
                  {r.baseDate}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function DiagnosisReportPage() {
  useCourseHubHeader()
  const query = useDiagnosisReports()
  const [searchParams, setSearchParams] = useSearchParams()

  const reports = query.data ?? []
  // 최신 주차 우선 정렬(목록) — 기본 선택도 최신 주차.
  const sorted = [...reports].sort((a, b) => b.week - a.week)
  const latestWeek = sorted[0]?.week
  const weekParam = Number(searchParams.get('week'))
  const selectedWeek = reports.some((r) => r.week === weekParam)
    ? weekParam
    : latestWeek
  const selected = reports.find((r) => r.week === selectedWeek)

  const selectWeek = (week: number) =>
    setSearchParams({ week: String(week) }, { replace: true })

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />
      <DataBoundary
        isPending={query.isPending}
        isError={query.isError || !query.data}
        onRetry={query.refetch}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-fg-muted text-sm">
                총 {reports.length}개 주차 리포트 · {selected.week}주차 열람 중
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selected.week <= 1}
                  onClick={() => selectWeek(selected.week - 1)}
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                  이전 주
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selected.week >= (latestWeek ?? selected.week)}
                  onClick={() => selectWeek(selected.week + 1)}
                >
                  다음 주
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <WeekList
                reports={sorted}
                selected={selected.week}
                onSelect={selectWeek}
              />
              <ReportView report={selected} />
            </div>
          </div>
        )}
      </DataBoundary>
    </div>
  )
}
