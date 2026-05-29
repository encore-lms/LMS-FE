import { Navigate, Outlet } from 'react-router-dom'

// 인증 상태 store(Zustand)는 다음 PR — 현재는 항상 미인증으로 처리.
function useAuthStub() {
  return { isAuthenticated: false }
}

export function AuthGuard() {
  const { isAuthenticated } = useAuthStub()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
