import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { projectKeys } from '../projects/queryKeys'
import type {
  ProjectKind,
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
      // 계약 확정 시 apiClient.post('/student/projects', input)로 교체.
      await Promise.resolve()
      return buildCreatedProject(input)
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.list() })
      const previous = queryClient.getQueryData<ProjectListData>(
        projectKeys.list(),
      )
      const created = buildCreatedProject(input)

      queryClient.setQueryData<ProjectListData>(projectKeys.list(), (old) =>
        old ? prependProject(old, created) : old,
      )

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.list(), context.previous)
      }
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

function buildCreatedProject(input: CreateProjectInput): ProjectSummary {
  const kind: ProjectKind = input.teamSize > 1 ? 'team' : 'personal'
  return {
    id: `draft-${input.name}-${input.start}`.replace(/\s+/g, '-'),
    kind,
    kindLabel: kind === 'team' ? '팀' : '개인',
    status: 'draft',
    statusLabel: '작성 중',
    representative: false,
    accentTone: 'accent',
    title: input.name,
    pm: '김수강 PM',
    teamLabel: kind === 'team' ? `팀 ${input.teamSize}명` : '개인 프로젝트',
    period: `${input.start} ~ ${input.end} · 작성 중`,
    tags: input.stacks,
    outcomes: [input.domain, ...input.deliverables],
    actionLabel: '워크스페이스 열기',
  }
}

function prependProject(
  data: ProjectListData,
  project: ProjectSummary,
): ProjectListData {
  return {
    ...data,
    projects: [
      project,
      ...data.projects.filter((item) => item.id !== project.id),
    ],
  }
}
