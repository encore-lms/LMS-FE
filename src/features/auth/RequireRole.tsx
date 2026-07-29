import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import { ROLE_HOME } from '@/shared/constants'
import type { Role } from '@/shared/types'

// 역할 가드 — AuthGuard(인증) 다음 단계의 권한 체크.
// 허용 역할이 아니면 자기 역할 홈(미인증이면 로그인)으로 보낸다.
export function RequireRole({ allow }: { allow: Role[] }) {
  const { role } = useAuth()
  if (role && allow.includes(role)) return <Outlet />
  return <Navigate to={role ? ROLE_HOME[role] : '/login'} replace />
}
