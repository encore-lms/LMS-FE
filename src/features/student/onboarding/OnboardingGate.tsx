import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import { isOnboarded } from './completed'

/**
 * 온보딩 게이트 — studentRoutes 상위에만 적용(공유 라우터 미터치).
 * 아직 온보딩하지 않은 수강생이 /student 영역에 진입하면 온보딩으로 보낸다.
 * 완료/건너뛰기로 플래그가 찍히면 통과시켜 원래 페이지(대시보드 등)를 렌더.
 * 온보딩 화면(/student/onboarding)은 풀스크린 라우트라 이 게이트를 거치지 않아 루프가 없다.
 */
export function OnboardingGate() {
  const { user } = useAuth()
  if (user && !isOnboarded(user.id)) {
    return <Navigate to="/student/onboarding" replace />
  }
  return <Outlet />
}
