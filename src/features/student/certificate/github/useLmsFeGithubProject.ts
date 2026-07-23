import { useQuery } from '@tanstack/react-query'
import { certKeys } from '../queryKeys'
import { fetchLmsFeGithubProject, LMS_FE_REPOSITORY } from './lmsFeGithubApi'

export function useLmsFeGithubProject() {
  return useQuery({
    queryKey: certKeys.githubProject(
      LMS_FE_REPOSITORY,
      'develop',
      'junseok-dev',
    ),
    queryFn: ({ signal }) => fetchLmsFeGithubProject(signal),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
