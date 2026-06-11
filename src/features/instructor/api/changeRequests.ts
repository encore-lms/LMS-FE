import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorChangeRequestsData,
  RecertificationsData,
} from '@/shared/types'

// 인증 후 통합 검토 (/instructor/change-requests · /instructor/recertifications) 데이터.
export function useChangeRequests() {
  return useQuery({
    queryKey: instructorKeys.changeRequests(),
    queryFn: () =>
      apiClient
        .get<InstructorChangeRequestsData>('/instructor/change-requests')
        .then((r) => r.data),
  })
}

export function useRecertifications() {
  return useQuery({
    queryKey: instructorKeys.recertifications(),
    queryFn: () =>
      apiClient
        .get<RecertificationsData>('/instructor/recertifications')
        .then((r) => r.data),
  })
}
