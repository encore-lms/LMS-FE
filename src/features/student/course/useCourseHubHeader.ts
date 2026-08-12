import { TERMS } from '@/shared/constants'
import { usePageHeader } from '@/shared/store'
import { useCourseHome } from '../api/course'

// 교육과정 허브 탭 공통 헤더 — 3역할 통일 형식: 제목=과정명, 설명=기간(2026-08-05 결정).
// 매니저(EducationPage)·강사(InstructorEducationPage) 허브와 같은 모양을 수강생 11탭에서도 쓴다.
// enabled=false 면 헤더도 course 쿼리도 건드리지 않는다(QnA처럼 스태프 마운트를 겸하는 화면용).
export function useCourseHubHeader(enabled = true) {
  const { data } = useCourseHome(enabled)
  const hero = data?.hero
  usePageHeader(
    hero ? `${hero.courseName} ${hero.cohortName}` : TERMS.educationCourse,
    hero ? `${hero.periodStart} ~ ${hero.periodEnd}` : undefined,
    enabled,
  )
}
