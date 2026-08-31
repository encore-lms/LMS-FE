import { useMemo } from 'react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/shared/store'
import {
  filterMenuByFeatures,
  useStudentCourseFeatures,
} from '@/features/student/api/courseFeatures'
import { useCertificateAnalysis } from '@/features/student/certificate/analysis'
import {
  filterCertificateMenu,
  isCertificateReady,
} from '@/features/student/certificate/readiness'
import { CERTIFICATE_DEMO_MODE } from '@/features/student/certificate/config'
import { MENUS } from './menus'

// 역할 메뉴 + 수강생 과정 기능 토글 반영 후 AppShell에 주입.
// (AppShell/레이아웃은 features 비의존 유지 — 토글 결합은 app 레벨에서만.)
// 멘토링은 과정 토글이 아니라 매니저의 멘토 배정 여부로 노출(미배정 확정 시에만 숨김).
export function AppShellWithMenu() {
  const { role } = useAuth()
  const isStudent = role === 'STUDENT'
  const { data } = useStudentCourseFeatures(isStudent)
  const certificateAnalysis = useCertificateAnalysis(
    { scope: 'student' },
    isStudent && !CERTIFICATE_DEMO_MODE,
  )
  // 멘토링은 사이드바에서 빠지고 교육과정 허브 탭으로 옮겨(2026-08-05) featureKey 가 없다 —
  // 여기서 mentoring:false 를 주입해도 걸러낼 항목이 없었다. 탭 노출은 CourseTabs 가 판단한다.
  const menus = useMemo(() => {
    if (!isStudent) return MENUS
    const featureFiltered = data
      ? filterMenuByFeatures(MENUS.STUDENT, data.features ?? {})
      : MENUS.STUDENT
    // 조회 중·실패도 준비 완료로 추측하지 않는다. 잘못 노출된 메뉴는 발급 완료로 오해되기 쉽다.
    const certificateReady =
      CERTIFICATE_DEMO_MODE || isCertificateReady(certificateAnalysis.data)
    return {
      ...MENUS,
      STUDENT: filterCertificateMenu(featureFiltered, certificateReady),
    }
  }, [isStudent, data, certificateAnalysis.data])
  return <AppShell menus={menus} />
}
