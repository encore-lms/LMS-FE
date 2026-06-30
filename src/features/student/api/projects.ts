import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
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
  return useQuery({
    queryKey: projectKeys.wizard(),
    queryFn: () =>
      apiClient
        .get<ProjectWizardData>('/student/projects/wizard')
        .then((r) => r.data),
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
        // 팀원(memberUserIds)은 같은 기수 후보 실 BE 후속 — 현재는 본인 OWNER만
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
