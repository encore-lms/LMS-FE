import type { AttendanceSummary as AttendanceSummaryData } from '../types'
import { SummaryCard } from './SummaryCard'

// 상단 KPI 5카드 — 출석률(강조) + 지각·조퇴·외출·결석 누적. AttendanceSummary 데이터를 카드로 매핑.
export function AttendanceSummary({
  summary,
}: {
  summary: AttendanceSummaryData
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <SummaryCard
        label="출석률"
        value={`${summary.attendanceRate}%`}
        sub={`${summary.presentDays} / ${summary.totalDays}일 출석`}
        accent
      />
      <SummaryCard label="지각" value={`${summary.lateCount}회`} sub="누적" />
      <SummaryCard
        label="조퇴"
        value={`${summary.earlyLeaveCount}회`}
        sub="누적"
      />
      <SummaryCard label="외출" value={`${summary.outingCount}회`} sub="누적" />
      <SummaryCard label="결석" value={`${summary.absentCount}회`} sub="누적" />
    </div>
  )
}
