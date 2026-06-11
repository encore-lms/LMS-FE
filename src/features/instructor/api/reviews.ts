import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  TsReviewData,
} from '@/shared/types'

// 강사 검토 3종 (§13~§15) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useRecordReviews() {
  return useQuery({
    queryKey: instructorKeys.recordReviews(),
    queryFn: () =>
      apiClient
        .get<InstructorRecordReviewData>('/instructor/records/review')
        .then((r) => r.data),
  })
}

export function useProjectReviews() {
  return useQuery({
    queryKey: instructorKeys.projectReviews(),
    queryFn: () =>
      apiClient
        .get<ProjectReviewData>('/instructor/projects/review')
        .then((r) => r.data),
  })
}

export function useTsReviews() {
  return useQuery({
    queryKey: instructorKeys.tsReviews(),
    queryFn: () =>
      apiClient
        .get<TsReviewData>('/instructor/troubleshooting/review')
        .then((r) => r.data),
  })
}
