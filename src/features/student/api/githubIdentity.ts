import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { profileKeys } from '../profile/queryKeys'
import type {
  GithubConnectionStart,
  StudentGithubIdentity,
} from '../profile/githubTypes'

// 수강생 개인 GitHub 계정 연결 훅 — 엔드포인트가 /student/me/* · /github/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
// 콜백 검증·토큰 교환·GET /user·githubUserId 저장은 전부 BE 책임. FE는 상태만 조회/시작/해제한다.

/** 내 GitHub 연결 상태 조회 */
export function useGithubIdentity() {
  return useQuery({
    queryKey: profileKeys.githubIdentity(),
    queryFn: () =>
      apiClient
        .get<StudentGithubIdentity>('/student/me/github-identity')
        .then((r) => r.data),
  })
}

/**
 * GitHub 인증 시작 — 인증 URL + 일회성 state를 받는다(토큰 아님).
 * 성공 시 호출부가 window.location으로 authorizeUrl로 이동하고, 콜백 후 BE가 프로필로 복귀시킨다.
 */
export function useStartGithubConnection() {
  return useMutation({
    mutationFn: () =>
      apiClient
        .post<GithubConnectionStart>('/github/user-connections/start')
        .then((r) => r.data),
  })
}

/** GitHub 연결 해제 — 앞으로의 기여도 최신화만 중단. 기존 증명서 스냅샷은 건드리지 않는다(BE 정책). */
export function useDisconnectGithub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .delete<StudentGithubIdentity>('/student/me/github-identity')
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.githubIdentity(), data)
    },
  })
}
