import { useCourseHubHeader } from '../useCourseHubHeader'
import { NoticesPane } from '@/features/instructor/education/NoticesPane'
import { CourseTabs } from '../CourseTabs'

// 교육과정 공지 — 매니저·강사 허브와 같은 한 벌(NoticesPane)을 읽기 전용으로 소비(2026-08-05).
// 작성·삭제 UI 없음, 데이터는 수강생 미러(/student/course/notices). 상세는 별도 라우트.
export default function NoticesPage() {
  useCourseHubHeader()
  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />
      <NoticesPane
        source="student"
        detailPathOf={(id) => `/student/course/notices/${id}`}
      />
    </div>
  )
}
