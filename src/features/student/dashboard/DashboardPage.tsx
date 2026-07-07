import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useStudentDashboard } from '../api/dashboard'
import { HeroBanner } from './components/HeroBanner'
import { ProfileCard } from './components/ProfileCard'
import { KpiCards } from './components/KpiCards'
import { TodoList } from './components/TodoList'
import { DeadlineQuizzes } from './components/DeadlineQuizzes'
import { MentoringSummary } from './components/MentoringSummary'
import { AttendanceCalendar } from './components/AttendanceCalendar'
import { AttendanceSummary } from './components/AttendanceSummary'
import { WeeklyStreak } from './components/WeeklyStreak'
import { NoticeList } from './components/NoticeList'
import { NotificationList } from './components/NotificationList'
import { ProjectList } from './components/ProjectList'
import { TroubleshootingList } from './components/TroubleshootingList'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import type { DashboardAttendance } from './types'

const pad = (value: number) => String(value).padStart(2, '0')

function createEmptyAttendance(): DashboardAttendance {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const todayLabel = `${year}-${pad(month)}-${pad(today.getDate())}`

  return {
    calendar: {
      year,
      month,
      today: todayLabel,
      days: [],
    },
    summary: {
      presentDays: 0,
      totalDays: 0,
      attendanceRate: 0,
      streakDays: 0,
      lateCount: 0,
      absentCount: 0,
      earlyLeaveCount: 0,
      outingCount: 0,
    },
    trend: [],
  }
}

/**
 * 수강생 대시보드 (/student 인덱스) — 오늘 할 일·평가·출결·알림·프로젝트를 한 화면에 요약.
 * 데이터/상태만 여기서 다루고 각 영역은 components/* 가 그린다(영역별 격리).
 * §2 정책상 증명서 위젯·6축 역량·강의 진도율·채점 대기·랭킹은 노출하지 않는다.
 */
export default function DashboardPage() {
  const { data, isPending, isError, refetch } = useStudentDashboard()
  usePageHeader('대시보드')

  if (isPending) {
    return <SkeletonDashboard kpis={4} panels={4} />
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="대시보드를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const attendance = data.attendance ?? createEmptyAttendance()

  return (
    // 페이지 배경 틴트 — 보더리스 흰 카드가 떠 보이도록 은은한 서페이스 톤(대시보드 스코프).
    <div className="bg-surface-muted/45 flex min-h-full flex-col gap-6 p-8">
      <HeroBanner hero={data.hero} attendance={attendance} />

      {/* 3섹션: (사이드바) · 메인(실행 콘텐츠) · 우측 레일(개인 현황) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* 메인 — 오늘 처리할 학습 활동 */}
        <div className="flex min-w-0 flex-col gap-6">
          <KpiCards kpis={data.kpis} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TodoList todos={data.todos} />
            <DeadlineQuizzes quizzes={data.deadlineQuizzes} />
          </div>
          <MentoringSummary mentoring={data.mentoring} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ProjectList projects={data.projects} />
            <TroubleshootingList items={data.troubleshooting} />
          </div>
        </div>

        {/* 우측 레일 — 개인 현황(프로필·스트릭·출결·알림) */}
        <aside className="flex flex-col gap-6">
          <ProfileCard hero={data.hero} attendance={attendance} />
          <WeeklyStreak attendance={attendance} />
          <AttendanceCalendar attendance={attendance} />
          <AttendanceSummary attendance={attendance} />
          <NotificationList notifications={data.notifications} />
          <NoticeList notices={data.notices} />
        </aside>
      </div>
    </div>
  )
}
