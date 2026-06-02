import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'

// 인증 가드 — 미인증이면 로그인으로. 인증 상태는 shared/store(Zustand)에서 읽는다.
export function AuthGuard() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
