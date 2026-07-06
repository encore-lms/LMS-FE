import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useStudentDashboard } from '../api/dashboard'
import { HeroBanner } from './components/HeroBanner'
import { KpiCards } from './components/KpiCards'
import { TodoList } from './components/TodoList'
import { DeadlineQuizzes } from './components/DeadlineQuizzes'
import { MentoringSummary } from './components/MentoringSummary'
import { AttendanceCalendar } from './components/AttendanceCalendar'
import { AttendanceSummary } from './components/AttendanceSummary'
import { NoticeList } from './components/NoticeList'
import { NotificationList } from './components/NotificationList'
import { ProjectList } from './components/ProjectList'
import { TroubleshootingList } from './components/TroubleshootingList'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

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

  return (
    <div className="flex flex-col gap-6 p-8">
      <HeroBanner hero={data.hero} />
      <KpiCards kpis={data.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TodoList todos={data.todos} />
        <DeadlineQuizzes quizzes={data.deadlineQuizzes} />
      </div>
      <MentoringSummary mentoring={data.mentoring} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendanceCalendar attendance={data.attendance} />
        <AttendanceSummary attendance={data.attendance} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NoticeList notices={data.notices} />
        <NotificationList notifications={data.notifications} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProjectList projects={data.projects} />
        <TroubleshootingList items={data.troubleshooting} />
      </div>
    </div>
  )
}
