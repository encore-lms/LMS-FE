import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import { useStudentOnboarding } from '../api/onboarding'

/**
 * 온보딩 게이트 — studentRoutes 상위에만 적용(공유 라우터 미터치).
 * 아직 온보딩하지 않은 수강생이 /student 영역에 진입하면 온보딩으로 보낸다.
 * 완료/건너뛰기로 플래그가 찍히면 통과시켜 원래 페이지(대시보드 등)를 렌더.
 * 온보딩 화면(/student/onboarding)은 풀스크린 라우트라 이 게이트를 거치지 않아 루프가 없다.
 */
export function OnboardingGate() {
  const { user } = useAuth()
  const shouldCheck = user?.role === 'STUDENT'
  const onboarding = useStudentOnboarding(shouldCheck)

  if (!shouldCheck) {
    return <Outlet />
  }

  if (onboarding.isLoading) {
    return (
      <div className="text-fg-muted flex min-h-[320px] items-center justify-center text-sm">
        온보딩 상태를 확인하는 중입니다.
      </div>
    )
  }

  if (onboarding.isError) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm">
        <p className="text-danger">온보딩 상태를 확인하지 못했습니다.</p>
        <button
          type="button"
          onClick={() => void onboarding.refetch()}
          className="border-border text-fg hover:bg-surface-muted rounded-[8px] border px-4 py-2 text-[13px] font-semibold"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!onboarding.data?.completed) {
    return <Navigate to="/student/onboarding" replace />
  }
  return <Outlet />
}
