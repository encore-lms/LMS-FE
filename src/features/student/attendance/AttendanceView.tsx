import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import { useAttendanceOverview } from '../api/attendance'
import { HrdAttendanceCalendar } from './components/calendar/HrdAttendanceCalendar'
import { SubmissionHistory } from './components/history/SubmissionHistory'

/**
 * 출결 / 태도 (/student/attendance) — 조회 화면.
 * 화면 타이틀/설명은 공유 헤더(usePageHeader)에 주입(Figma처럼 상단 바에 노출).
 * HRD-Net 출결 현황(요약·캘린더, 단방향)과 본인 출결 폼 제출 이력을 보고, 폼 작성으로 진입.
 */
export default function AttendanceView() {
  const navigate = useNavigate()
  const [view, setView] = useState<{ year: number; month: number } | null>(null)
  const { data, isPending, isError, refetch } = useAttendanceOverview(
    view?.year,
    view?.month,
  )
  usePageHeader('출결 / 태도')

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={() => refetch()}
      loadingText="출결 현황을 불러오는 중…"
      errorTitle="출결 현황을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-6 p-8">
          <HrdAttendanceCalendar
            calendar={data.calendar}
            onMove={(year, month) => setView({ year, month })}
            // 폼은 HRD 출결과 별개 데이터라, 낸 날짜를 캘린더에 겹쳐 보여 준다.
            formDates={new Set(data.submissions.map((s) => s.targetDate))}
          />
          <SubmissionHistory
            submissions={data.submissions}
            onWriteForm={() => navigate('/student/attendance/form')}
          />
        </div>
      )}
    </DataBoundary>
  )
}
