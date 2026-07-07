import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { Role } from '@/shared/types'

// 마이 프로필(전 역할 공용) — 본인 계정 조회(/auth/me)·비밀번호 변경(/auth/password/change).
// auth-user-service 실연동. 두 엔드포인트 모두 인증된 사용자면 역할 무관 호출 가능.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.

export const profileKeys = {
  me: ['profile', 'me'] as const,
}

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: Role
  primaryRole: Role
  status: string
  mustChangePassword: boolean
  lastLoginAt: string | null
  cohortIds: string[]
}

/** 현재 로그인 사용자 정보 조회. */
export function useCurrentUser() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () =>
      apiClient.get<{ user: CurrentUser }>('/auth/me').then((r) => r.data.user),
  })
}

/** 비밀번호 변경 — 성공 시 서버가 refresh 쿠키를 만료시키므로 재로그인이 필요하다. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      apiClient.postNoContent('/auth/password/change', body),
  })
}
