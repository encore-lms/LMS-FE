import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentoringKeys } from '../mentoring/queryKeys'
import type { MentoringData } from '../mentoring/types'

// 수강생 멘토링 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useMentoring() {
  return useQuery({
    queryKey: mentoringKeys.detail(),
    queryFn: () =>
      apiClient.get<MentoringData>('/student/mentoring').then((r) => r.data),
  })
}
