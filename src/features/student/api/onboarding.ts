import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  StudentOnboardingPayload,
  StudentOnboardingResponse,
} from '../onboarding/types'

export const onboardingKeys = {
  detail: () => ['student', 'onboarding'] as const,
} as const

/** 수강생 온보딩 상태와 스킬 카탈로그를 조회한다. */
export function useStudentOnboarding(enabled = true) {
  return useQuery({
    queryKey: onboardingKeys.detail(),
    queryFn: () =>
      apiClient
        .get<StudentOnboardingResponse>('/student/onboarding')
        .then((r) => r.data),
    enabled,
  })
}

/** 수강생 온보딩 입력값을 저장하고 완료 상태를 확정한다. */
export function useSaveStudentOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StudentOnboardingPayload) =>
      apiClient
        .patch<StudentOnboardingResponse>('/student/onboarding', payload)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.detail(), data)
    },
  })
}
