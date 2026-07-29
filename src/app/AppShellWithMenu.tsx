import { useMemo } from 'react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/shared/store'
import {
  filterMenuByFeatures,
  useStudentCourseFeatures,
} from '@/features/student/api/courseFeatures'
import { useMentoringAssigned } from '@/features/student/api/mentoring'
import { MENUS } from './menus'

// 역할 메뉴 + 수강생 과정 기능 토글 반영 후 AppShell에 주입.
// (AppShell/레이아웃은 features 비의존 유지 — 토글 결합은 app 레벨에서만.)
// 멘토링은 과정 토글이 아니라 매니저의 멘토 배정 여부로 노출(미배정 확정 시에만 숨김).
export function AppShellWithMenu() {
  const { role } = useAuth()
  const isStudent = role === 'STUDENT'
  const { data } = useStudentCourseFeatures(isStudent)
  const mentoringAssigned = useMentoringAssigned(isStudent).data
  const menus = useMemo(() => {
    if (!isStudent) return MENUS
    const mentoringOff = mentoringAssigned === false
    if (!data && !mentoringOff) return MENUS
    const features = {
      ...(data?.features ?? {}),
      ...(mentoringOff ? { mentoring: false } : {}),
    }
    return {
      ...MENUS,
      STUDENT: filterMenuByFeatures(MENUS.STUDENT, features),
    }
  }, [isStudent, data, mentoringAssigned])
  return <AppShell menus={menus} />
}
