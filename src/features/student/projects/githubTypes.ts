// 프로젝트 GitHub Organization·Repository 연결(작업 2 재설계) — 기능 로컬 계약.
// 팀 공통(Org·레포·분석 브랜치)과 개인(증명서 공개·내 기여도)을 함께 담는다.
// installationId·access token은 담지 않는다.

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
  /** 선택 가능한 브랜치 목록(실 App 연동 전 mock) — select 드롭다운 */
  availableBranches: string[]
  isSelected: boolean
  permissionStatus: 'ACCESSIBLE' | 'PERMISSION_REQUIRED'
  // ── 요청자 개인 ──
  isPublicForMe: boolean
  myCommits: number
  myContribPercent: number
  /** 분석 브랜치 총 커밋(0=미집계) */
  totalCommits: number
  /** 레포별 전체 기여자(커밋 내림차순) */
  contributors: ProjectGithubContributor[]
}

/** 레포 기여자 — LMS 매칭이면 name·avatarUrl이 LMS 것(isLmsUser), 아니면 GitHub login·avatar. */
export interface ProjectGithubContributor {
  name: string
  avatarUrl: string | null
  isLmsUser: boolean
  githubLogin: string
  commits: number
  contribPercent: number
}

export interface ProjectGithubConnection {
  githubConnectionId: string | null
  organization: ProjectGithubOrganization | null
  status: ProjectGithubStatus
  repositories: ProjectGithubRepository[]
  lastSyncedAt: string | null
}

export interface ProjectGithubInstallStart {
  installUrl: string | null
  installed: boolean
}

/** 팀 공통 저장 — 레포별 분석 브랜치·사용 여부(누구나). */
export interface ProjectGithubBranchesRequest {
  repositories: {
    githubRepositoryId: number
    analysisBranch: string
    isSelected: boolean
  }[]
}

/** 개인 저장 — 내 증명서 공개 레포(본인). */
export interface ProjectGithubVisibilityRequest {
  repositories: {
    githubRepositoryId: number
    isPublic: boolean
  }[]
}
