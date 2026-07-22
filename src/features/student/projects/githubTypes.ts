// 프로젝트 GitHub Organization·Repository 연결(작업 2) — 기능 로컬 계약.
// installationId·access token은 담지 않는다(BE 내부 githubConnectionId + GitHub 불변 repo id만 사용).

export type ProjectGithubStatus =
  | 'CONNECTED'
  | 'INSTALLATION_PENDING'
  | 'PERMISSION_REQUIRED'
  | 'DISCONNECTED'

export interface ProjectGithubOrganization {
  githubAccountId: number | null
  login: string
  displayName: string | null
  avatarUrl: string | null
}

export interface ProjectGithubRepository {
  githubRepositoryId: number
  name: string
  fullName: string
  visibility: 'PUBLIC' | 'PRIVATE'
  defaultBranch: string | null
  analysisBranch: string | null
  isSelected: boolean
  isCertificatePublic: boolean
  permissionStatus: 'ACCESSIBLE' | 'PERMISSION_REQUIRED'
}

export interface ProjectGithubConnection {
  githubConnectionId: string | null
  organization: ProjectGithubOrganization | null
  status: ProjectGithubStatus
  repositories: ProjectGithubRepository[]
  lastSyncedAt: string | null
}

/** 설치 시작 응답 — 실 App이면 installUrl로 이동, mock이면 installed=true로 즉시 연결. */
export interface ProjectGithubInstallStart {
  installUrl: string | null
  installed: boolean
}

/** 저장 요청 — 레포별 선택·분석 브랜치·증명서 공개. */
export interface ProjectGithubSaveRequest {
  repositories: {
    githubRepositoryId: number
    analysisBranch: string
    isSelected: boolean
    isCertificatePublic: boolean
  }[]
}
