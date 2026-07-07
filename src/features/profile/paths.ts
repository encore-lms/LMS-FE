import type { Role } from '@/shared/types'

// 역할별 마이 프로필 경로 — 헤더 아바타 드롭다운(§7-X)과 임시 비밀번호 로그인 유도가 공유.
export const PROFILE_PATH: Record<Role, string> = {
  STUDENT: '/student/profile',
  INSTRUCTOR: '/instructor/profile',
  MENTOR: '/mentor/profile',
  MANAGER: '/admin/profile',
  ADMIN: '/admin/profile',
}
