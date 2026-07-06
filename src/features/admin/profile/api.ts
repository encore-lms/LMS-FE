import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { Role } from '@/shared/types'

// 운영 매니저 마이 페이지 — 본인 계정 조회(/auth/me)·비밀번호 변경(/auth/password/change).
// auth-user-service 실연동. baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.

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
    queryKey: [...adminKeys.all, 'me'],
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
