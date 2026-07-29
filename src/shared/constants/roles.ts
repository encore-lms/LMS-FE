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

// 역할 표시명 — 사이드바 섹션 라벨 등에 사용.
export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: '수강생',
  INSTRUCTOR: '강사',
  MANAGER: '운영',
  MENTOR: '멘토',
  ADMIN: '운영',
}
