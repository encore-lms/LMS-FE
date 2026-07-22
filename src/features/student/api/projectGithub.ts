import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { projectKeys } from '../projects/queryKeys'
import type {
  ProjectGithubBranchesRequest,
  ProjectGithubConnection,
  ProjectGithubInstallStart,
  ProjectGithubVisibilityRequest,
} from '../projects/githubTypes'

// 프로젝트 GitHub 연결 훅(작업 2 재설계) — 경로 /student/projects/{id}/github*(learning-service).
// 연결·설치·브랜치는 참여 멤버 누구나, 증명서 공개는 개인별. query key에 projectId 포함.

/** 프로젝트 GitHub 연결 조회(요청자 개인 공개 상태 포함) */
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

/** GitHub Organization 설치 시작(누구나). mock이면 즉시 연결 → 연결 재조회. */
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

/** 팀 공통 — 레포별 분석 브랜치·사용 여부 저장(누구나). */
export function useSaveProjectGithubBranches(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ProjectGithubBranchesRequest) =>
      apiClient
        .put<ProjectGithubConnection>(
          `/student/projects/${projectId}/github/branches`,
          req,
        )
        .then((r) => r.data),
    onSuccess: (data) =>
      qc.setQueryData(projectKeys.githubConnection(projectId), data),
  })
}

/** 개인 — 내 증명서 공개 레포 저장(본인). */
export function useSaveMyGithubVisibility(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ProjectGithubVisibilityRequest) =>
      apiClient
        .put<ProjectGithubConnection>(
          `/student/projects/${projectId}/github/my-visibility`,
          req,
        )
        .then((r) => r.data),
    onSuccess: (data) =>
      qc.setQueryData(projectKeys.githubConnection(projectId), data),
  })
}

/** 프로젝트 GitHub 연결 해제(누구나). */
export function useDisconnectProjectGithub(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .delete<ProjectGithubConnection>(
          `/student/projects/${projectId}/github-connection`,
        )
        .then((r) => r.data),
    onSuccess: (data) =>
      qc.setQueryData(projectKeys.githubConnection(projectId), data),
  })
}
