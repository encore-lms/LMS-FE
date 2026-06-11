import { useNavigate } from 'react-router-dom'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useAttendanceOverview } from '../api/attendance'
import { AttendanceActionButton } from './components/AttendanceActionButton'
import { AttendanceSummary } from './components/AttendanceSummary'
import { HrdAttendanceCalendar } from './components/calendar/HrdAttendanceCalendar'
import { SubmissionHistory } from './components/history/SubmissionHistory'

/**
 * 출결 / 태도 (/student/attendance) — 조회 화면.
 * 화면 타이틀/설명은 공유 헤더(usePageHeader)에 주입(Figma처럼 상단 바에 노출).
 * HRD-Net 출결 현황(요약·캘린더, 단방향)과 본인 출결 폼 제출 이력을 보고, 폼 작성으로 진입.
 */
export default function AttendanceView() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAttendanceOverview()
  usePageHeader('출결 / 태도')

  if (isPending) {
    return <div className="text-fg-muted p-8">출결 현황을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="출결 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <AttendanceActionButton onClick={() => refetch()}>
              다시 시도
            </AttendanceActionButton>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <AttendanceSummary summary={data.summary} />
      <HrdAttendanceCalendar calendar={data.calendar} />
      <SubmissionHistory
        submissions={data.submissions}
        onWriteForm={() => navigate('/student/attendance/form')}
      />
    </div>
  )
}
