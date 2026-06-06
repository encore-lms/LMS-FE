import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { projectKeys } from '../projects/queryKeys'
import type {
  ProjectListData,
  ProjectWizardData,
  WorkspaceData,
} from '../projects/types'

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

export function useProjectWorkspace(id: string) {
  return useQuery({
    queryKey: projectKeys.workspace(id),
    queryFn: () =>
      apiClient
        .get<WorkspaceData>(`/student/projects/${id}`)
        .then((r) => r.data),
  })
}
