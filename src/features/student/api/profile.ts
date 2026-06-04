import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { profileKeys } from '../profile/queryKeys'
import type { StudentProfile, ProfileUpdatePayload } from '../profile/types'

// 수강생 전용 마이 프로필 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).

/** 마이 프로필 조회 */
export function useStudentProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () =>
      apiClient.get<StudentProfile>('/student/profile').then((r) => r.data),
  })
}

/** 프로필 저장 — 성공 시 프로필 캐시 갱신 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) =>
      apiClient
        .put<StudentProfile>('/student/profile', payload)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(), data)
    },
  })
}
