// 수강생 마이 프로필 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 증명서·외부 공개에 쓰일 기본 정보·이미지·URL·스킬·공개 설정을 관리.

/** 외부 공개 항목 토글 — 증명서 검증 시 외부 노출 여부 */
export interface ProfilePublicSettings {
  profileImage: boolean
  githubUrl: boolean
  blogUrl: boolean
  portfolioUrl: boolean
  linkedinUrl: boolean
}

/** 프로필 완성도 — 상단 배너 */
export interface ProfileCompletion {
  pct: number // 0~100
  requiredDone: number
  requiredTotal: number
  missingCount: number // 증명서 필수 미입력 개수
  updatedAt: string // 마지막 수정 (ISO)
}

/** 마이 프로필 전체 */
export interface StudentProfile {
  // 기본 정보
  name: string // 실명 — 증명서 반영, 편집 잠금
  displayName: string // 표시명 — 증명서·공개 페이지 노출
  courseName: string
  cohortName: string
  email: string
  profileImageUrl: string | null // null이면 이니셜 아바타
  // 외부 URL
  githubUrl: string
  blogUrl: string
  portfolioUrl: string
  linkedinUrl: string
  // 스킬
  skills: string[] // 기술 태그
  interests: string[] // 관심 직무
  // 공개 설정
  publicSettings: ProfilePublicSettings
  // 완성도(파생, 읽기 전용)
  completion: ProfileCompletion
}

/** 프로필 저장 페이로드 — 편집 가능한 필드만 (name·과정/기수·완성도는 서버 파생) */
export interface ProfileUpdatePayload {
  displayName: string
  githubUrl: string
  blogUrl: string
  portfolioUrl: string
  linkedinUrl: string
  skills: string[]
  interests: string[]
  publicSettings: ProfilePublicSettings
}
