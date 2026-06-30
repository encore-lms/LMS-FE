import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { useAuth } from '@/shared/store/auth'
import { projectKeys } from '../projects/queryKeys'
import type {
  ProjectListData,
  ProjectSummary,
  ProjectWizardData,
  WorkspaceData,
} from '../projects/types'

export interface CreateProjectInput {
  name: string
  desc: string
  start: string
  end: string
  teamSize: number
  stacks: string[]
  domain: string
  deliverables: string[]
  memberUserIds?: string[]
}

// 프로젝트 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () =>
      apiClient.get<ProjectListData>('/student/projects').then((r) => r.data),
  })
}

export function useProjectWizard() {
  const { user } = useAuth()
  return useQuery({
    queryKey: projectKeys.wizard(),
    queryFn: async () => {
      // 같은 기수 동료(/users/peers)를 팀원 후보로, 본인을 PM으로 합성(실 BE join).
      const res = await apiClient.get<{
        items: { userId: string; name: string }[]
      }>('/users/peers')
      const candidates = (res.data.items ?? []).map((p, i) => ({
        id: p.userId,
        name: p.name,
        meta: '같은 기수 동료',
        avatarTone: (
          ['brand', 'info', 'warning', 'danger', 'accent', 'success'] as const
        )[i % 6],
      }))
      return {
        cohortLabel: '같은 기수',
        pmName: user?.name ?? '나',
        pmMeta: 'PM · 본인',
        candidates,
      } satisfies ProjectWizardData
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // BE(/student/projects, §42/§48/§45) 계약으로 변환 — name→title, 기간·스택 저장.
      const body = {
        title: input.name,
        kind: input.teamSize > 1 ? 'team' : 'personal',
        teamSize: input.teamSize,
        start: input.start,
        end: input.end,
        stacks: input.stacks,
        memberUserIds: input.memberUserIds ?? [],
      }
      const res = await apiClient.post<ProjectSummary>(
        '/student/projects',
        body,
      )
      return res.data
    },
    // 생성 후 목록을 다시 불러와 새 프로젝트를 반영.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useProjectWorkspace(id: string) {
  return useQuery({
    queryKey: projectKeys.workspace(id),
    queryFn: () =>
      apiClient
        .get<WorkspaceData>(`/student/projects/${id}`)
        .then((r) => r.data),
  })
}

// 프로젝트 삭제 — 모든 프로젝트(기본·신규 공통) 대상. 성공 시 목록 갱신.
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<{ id: string }>(`/student/projects/${id}`)
      return id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

// ── 워크스페이스 쓰기(BE #75) — 성공 시 워크스페이스 캐시 무효화 ──
function useWsMutation<TVars>(
  fn: (id: string, vars: TVars) => Promise<unknown>,
  projectId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: TVars) => fn(projectId, vars),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: projectKeys.workspace(projectId) }),
  })
}

export function useAddTask(projectId: string) {
  return useWsMutation<{
    title: string
    description?: string
    status?: string
    startAt?: string
    dueAt?: string
  }>((id, v) => apiClient.post(`/student/projects/${id}/tasks`, v), projectId)
}
export function useUpdateTaskStatus(projectId: string) {
  return useWsMutation<{ taskId: string; status: string }>(
    (id, v) =>
      apiClient.put(`/student/projects/${id}/tasks/${v.taskId}/status`, {
        status: v.status,
      }),
    projectId,
  )
}
export function useAddMeeting(projectId: string) {
  return useWsMutation<{ title: string; body?: string; heldAt?: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/meetings`, v),
    projectId,
  )
}
export function useAddArtifact(projectId: string) {
  return useWsMutation<{ artifactType: string; title: string; url?: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/artifacts`, v),
    projectId,
  )
}
export function useAddIssue(projectId: string) {
  return useWsMutation<{ title: string; description?: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/issues`, v),
    projectId,
  )
}
export function useUpdateIssueStatus(projectId: string) {
  return useWsMutation<{ issueId: string; status: string }>(
    (id, v) =>
      apiClient.put(`/student/projects/${id}/issues/${v.issueId}/status`, {
        status: v.status,
      }),
    projectId,
  )
}
export function useSubmitPeerEval(projectId: string) {
  return useWsMutation<{
    targetMemberId: string
    collaboration: number
    communication: number
    responsibility: number
    problemSolving: number
    technicalContribution: number
    comment?: string
  }>(
    (id, v) => apiClient.post(`/student/projects/${id}/peer-evaluations`, v),
    projectId,
  )
}
export function useRequestCertification(projectId: string) {
  return useWsMutation<void>(
    (id) => apiClient.post(`/student/projects/${id}/certification`),
    projectId,
  )
}

// 산출물 파일 업로드(multipart, BE #78) — 성공 시 워크스페이스 무효화
export function useUploadArtifactFile(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title?: string; file: File }) => {
      const fd = new FormData()
      if (input.title) fd.append('title', input.title)
      fd.append('file', input.file)
      return apiClient.postForm(
        `/student/projects/${projectId}/artifacts/file`,
        fd,
      )
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: projectKeys.workspace(projectId) }),
  })
}
