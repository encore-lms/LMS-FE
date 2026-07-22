import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { projectKeys } from '../projects/queryKeys'
import type {
  ProjectGithubConnection,
  ProjectGithubInstallStart,
  ProjectGithubSaveRequest,
} from '../projects/githubTypes'

// 프로젝트 GitHub 연결 훅 — 경로 /student/projects/{id}/github*(learning-service 라우팅).
// 조회·레포목록은 참여 멤버, 설치·저장·해제는 PM(OWNER) 전용(BE assertOwner). query key에 projectId 포함.

/** 프로젝트 GitHub 연결 조회 */
export function useProjectGithub(projectId: string) {
  return useQuery({
    queryKey: projectKeys.githubConnection(projectId),
    queryFn: () =>
      apiClient
        .get<ProjectGithubConnection>(
          `/student/projects/${projectId}/github-connection`,
        )
        .then((r) => r.data),
    enabled: !!projectId,
  })
}

/** GitHub Organization 설치 시작(PM). mock이면 즉시 연결 → 성공 시 연결·레포 재조회. */
export function useStartProjectGithubInstall(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .post<ProjectGithubInstallStart>(
          `/student/projects/${projectId}/github/install-start`,
        )
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: projectKeys.githubConnection(projectId),
      }),
  })
}

/** 레포 선택·분석 브랜치·증명서 공개 저장(PM). 성공 시 연결 캐시 갱신. */
export function useSaveProjectGithub(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ProjectGithubSaveRequest) =>
      apiClient
        .put<ProjectGithubConnection>(
          `/student/projects/${projectId}/github-connection`,
          req,
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(projectKeys.githubConnection(projectId), data)
    },
  })
}

/** 프로젝트 GitHub 연결 해제(PM). 성공 시 연결 캐시 갱신. */
export function useDisconnectProjectGithub(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .delete<ProjectGithubConnection>(
          `/student/projects/${projectId}/github-connection`,
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(projectKeys.githubConnection(projectId), data)
    },
  })
}
