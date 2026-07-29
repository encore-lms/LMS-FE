import { apiClient } from '@/shared/api'
import type {
  ProjectListData,
  WorkspaceData,
  WsMetric,
} from '../../projects/types'

export type LmsRepositoryProjectStatus =
  | 'MATCHED'
  | 'NOT_REGISTERED'
  | 'AMBIGUOUS'

export interface LmsRepositoryProjectData {
  repository: string
  status: LmsRepositoryProjectStatus
  projectId: string | null
  projectTitle: string | null
  role: string | null
  techStack: string[]
  metrics: WsMetric[]
  matchedProjectCount: number
}

/**
 * GitHub URL·owner/repo 표기를 비교 가능한 저장소 식별자로 변환한다.
 * 프로젝트명 유사도는 사용하지 않는다. LMS의 GITHUB 산출물 URL이 정확히 같은
 * 경우에만 성과지표를 연결해야 다른 팀 프로젝트의 성과가 섞이지 않는다.
 */
export function normalizeGithubRepository(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const sshMatch = trimmed.match(
    /^git@github\.com:([^/]+)\/([^/#?]+)(?:\.git)?$/i,
  )
  if (sshMatch?.[1] && sshMatch[2]) {
    return `${sshMatch[1]}/${sshMatch[2].replace(/\.git$/i, '')}`.toLowerCase()
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://github.com/${trimmed.replace(/^\/+/, '')}`

  try {
    const url = new URL(candidate)
    if (url.hostname.toLowerCase() !== 'github.com') return null
    const [owner, repository] = url.pathname
      .split('/')
      .filter(Boolean)
      .slice(0, 2)
    if (!owner || !repository) return null
    return `${owner}/${repository.replace(/\.git$/i, '')}`.toLowerCase()
  } catch {
    return null
  }
}

export function resolveLmsProjectMetrics(
  repository: string,
  workspaces: WorkspaceData[],
  studentId: string | null,
): LmsRepositoryProjectData {
  const repositoryKey = normalizeGithubRepository(repository)
  if (!repositoryKey) {
    throw new Error(`올바르지 않은 GitHub 저장소 식별자입니다: ${repository}`)
  }

  const matches = workspaces.filter((workspace) =>
    workspace.docs.some(
      (artifact) =>
        artifact.url != null &&
        normalizeGithubRepository(artifact.url) === repositoryKey,
    ),
  )

  if (matches.length === 0) {
    return {
      repository,
      status: 'NOT_REGISTERED',
      projectId: null,
      projectTitle: null,
      role: null,
      techStack: [],
      metrics: [],
      matchedProjectCount: 0,
    }
  }

  if (matches.length > 1) {
    return {
      repository,
      status: 'AMBIGUOUS',
      projectId: null,
      projectTitle: null,
      role: null,
      techStack: [],
      metrics: [],
      matchedProjectCount: matches.length,
    }
  }

  const project = matches[0]
  if (!project) throw new Error('LMS 프로젝트 매칭 결과가 비어 있습니다.')
  const member = studentId
    ? project.members.find((candidate) => candidate.userId === studentId)
    : null

  return {
    repository,
    status: 'MATCHED',
    projectId: project.id,
    projectTitle: project.title,
    role: member?.role ?? null,
    techStack: project.stack,
    metrics: project.metrics,
    matchedProjectCount: 1,
  }
}

export async function fetchLmsProjectMetricsByRepository(
  repository: string,
  studentId: string | null,
) {
  const list = await apiClient
    .get<ProjectListData>('/student/projects')
    .then((response) => response.data)

  // 현재 API에는 저장소 역조회가 없어 본인 프로젝트 상세을 모두 확인한다.
  // 어느 상세 조회라도 실패하면 오매칭·거짓 미등록을 피하기 위해 전체 조회를 실패시킨다.
  const workspaces = await Promise.all(
    list.projects.map((project) =>
      apiClient
        .get<WorkspaceData>(`/student/projects/${project.id}`)
        .then((response) => response.data),
    ),
  )

  return resolveLmsProjectMetrics(repository, workspaces, studentId)
}
