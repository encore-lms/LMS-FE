import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/shared/store/auth'
import { certKeys } from '../queryKeys'
import { LMS_FE_REPOSITORY } from './lmsFeGithubApi'
import { fetchLmsProjectMetricsByRepository } from './lmsProjectMetricsApi'

export function useLmsProjectMetrics() {
  const { user } = useAuth()
  const studentId = user?.id ?? null

  return useQuery({
    queryKey: certKeys.lmsProjectByRepository(
      LMS_FE_REPOSITORY,
      studentId ?? 'anonymous',
    ),
    queryFn: () =>
      fetchLmsProjectMetricsByRepository(LMS_FE_REPOSITORY, studentId),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
