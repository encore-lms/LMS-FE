import type { Role } from '@/shared/types'

export const ROLES: readonly Role[] = [
  'STUDENT',
  'INSTRUCTOR',
  'MANAGER',
  'MENTOR',
  'ADMIN',
]

// 역할 → 진입 shell 경로. MANAGER/ADMIN은 운영 콘솔(/admin)을 공유한다.
export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student',
  INSTRUCTOR: '/instructor',
  MANAGER: '/admin',
  MENTOR: '/mentor',
  ADMIN: '/admin',
}
