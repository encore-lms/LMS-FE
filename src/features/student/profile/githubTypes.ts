// 수강생 개인 GitHub 계정 연결 — 기능 로컬 계약(공유 파일 미오염).
// 식별 기준은 변경 가능한 githubLogin이 아니라 GitHub의 불변 숫자 githubUserId.
// access/refresh token은 이 타입에 절대 담기지 않는다(BE가 보관, FE 미반환).

/** 서버가 반환하는 연결 상태. CONNECTING·TEMPORARILY_UNAVAILABLE은 서버값이 아니라 FE 로컬 표현 상태. */
export type GithubIdentityStatus = 'CONNECTED' | 'REAUTH_REQUIRED' | 'DISCONNECTED'

/**
 * 수강생 ↔ GitHub 사용자 연결 정보.
 * DISCONNECTED이면 식별 필드는 모두 null. CONNECTED·REAUTH_REQUIRED이면 값이 채워진다.
 */
export interface StudentGithubIdentity {
  status: GithubIdentityStatus
  githubUserId: number | null
  githubLogin: string | null
  avatarUrl: string | null
  profileUrl: string | null
  connectedAt: string | null
  verifiedAt: string | null
}

/** POST /github/user-connections/start 응답 — GitHub 인증 URL + 일회성 state. 토큰 없음. */
export interface GithubConnectionStart {
  authorizeUrl: string
  state: string
}

/** FE에서만 쓰는 화면 표현 상태(서버 status + 진행/오류 로컬 상태). */
export type GithubConnectionViewState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'REAUTH_REQUIRED'
  | 'TEMPORARILY_UNAVAILABLE'
