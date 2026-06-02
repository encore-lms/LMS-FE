import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import { ROLE_HOME } from '@/shared/constants'

// 루트(/) 진입 시 인증된 사용자의 역할 홈으로 분기한다. (auth store 실구현 후 동작)
export function RoleEntry() {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[role]} replace />
}
