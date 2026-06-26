import { useMemo } from 'react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/shared/store'
import {
  filterMenuByFeatures,
  useStudentCourseFeatures,
} from '@/features/student/api/courseFeatures'
import { MENUS } from './menus'

// 역할 메뉴 + 수강생 과정 기능 토글 반영 후 AppShell에 주입.
// (AppShell/레이아웃은 features 비의존 유지 — 토글 결합은 app 레벨에서만.)
export function AppShellWithMenu() {
  const { role } = useAuth()
  const isStudent = role === 'STUDENT'
  const { data } = useStudentCourseFeatures(isStudent)
  const menus = useMemo(() => {
    if (!isStudent || !data) return MENUS
    return {
      ...MENUS,
      STUDENT: filterMenuByFeatures(MENUS.STUDENT, data.features),
    }
  }, [isStudent, data])
  return <AppShell menus={menus} />
}
