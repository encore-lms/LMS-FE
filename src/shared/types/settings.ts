// 운영 설정 Flow 10 (/admin/settings/*) — 허브·계정 관리·HRD API Key·교육 과정 설정·교육 과정 추가.
// 공유 읽기전용 계약. 변경은 도메인 PR에 섞지 말고 별도 shared PR로.

// ── 설정 허브 (Figma 1284:8852) ──
export interface SettingsCardSummary {
  /** 카드 요약 4행 — label/value 그대로 렌더 */
  rows: { label: string; value: string }[]
}

export interface SettingsAuditLog {
  id: string
  at: string // '05-27 09:05'
  actor: string
  /** 출처 영역 — 계정 관리 / HRD API Key / 교육 과정 설정 / 교육 과정 추가 */
  origin: string
  action: string
  detail: string
}

export interface SettingsHubData {
  lastChange: { at: string; by: string } // 히어로 우측 '마지막 변경'
  accounts: SettingsCardSummary
  hrdKey: SettingsCardSummary
  courseConfig: SettingsCardSummary
  courseAdd: SettingsCardSummary
  auditLogs: SettingsAuditLog[]
}

// ── 계정 관리 (Figma 1284:8597) ──
export type OpsRole = 'MANAGER' | 'INSTRUCTOR' | 'MENTOR'
export type OpsAccountStatus = 'active' | 'invited' | 'inactive' // 활성 / 초대 전 / 비활성

export interface OpsAccount {
  id: string
  name: string
  email: string
  role: OpsRole
  /** 담당 범위 표기 — '전체 운영 · 모든 과정·기수' | 'AI 캠프 22기 · DA 5기' 등 */
  scope: string
  /** 담당 범위 경고 보조문구 — '강사는 최소 1개 이상 권장' 등 (없으면 미노출) */
  scopeWarning?: string
  status: OpsAccountStatus
  lastLoginAt: string | null // '오늘 09:18' (null = 미접속 '-')
  /** 본인 계정 여부 — 본인 매니저 권한 회수(비활성화) 방지 */
  isSelf: boolean
}

export interface OpsAccountsSummary {
  managers: number
  managersActive: number
  managersInactive: number
  instructors: number
  instructorNoScope: number // 담당 범위 없음 강사 수
  mentors: number
  mentorNoTeam: number // 팀 배정 없음 멘토 수
  inactive: number
  inactiveRevoked30d: number // 최근 30일 회수 건수
  total: number
}

export interface OpsAccountsData {
  summary: OpsAccountsSummary
  items: OpsAccount[]
}

// ── HRD API Key (Figma 1284:8960) ──
export type HrdKeyStatus = 'active' | 'revoked' // 활성 / 폐기

export interface HrdApiKey {
  id: string
  name: string // 'HRD 운영키 2026'
  isPrimary: boolean // '기본' 칩
  maskedKey: string // 'APIPO****9K2A' — 원문 재조회 불가
  createdAt: string // 'YYYY-MM-DD'
  lastUsedAt: string // '오늘 10:22'
  status: HrdKeyStatus
}

export type HrdKeyHistoryAction = 'register' | 'rotate' | 'revoke' | 'test'

export interface HrdKeyHistoryRow {
  id: string
  at: string // '05-20 10:22'
  action: HrdKeyHistoryAction
  actor: string
  ok: boolean
  /** 응답 표기 — '220ms' | 'timeout' (없으면 '-') */
  response: string | null
  targetKey: string // masked 표기, 교체는 'APIPO****9K2A ← OLD'
}

export interface HrdKeySummary {
  activeKeys: number
  activeKeysHint: string // '기본 + 보조 1개'
  lastTest: { ok: boolean; at: string; latency: string } // '05-20 10:22' · '220ms'
  expiring: number
  expiringHint: string // 'D-14 알림 대상'
  recentFail: number // 24시간 기준
}

export interface HrdKeyData {
  summary: HrdKeySummary
  keys: HrdApiKey[]
  history: HrdKeyHistoryRow[]
}

// ── 교육 과정 설정 (Figma 1284:9243) ──
export type CourseOperationStatus = 'operating' | 'ended' // 운영 중 / 종료

export interface CourseListItem {
  id: string
  name: string // 'AI 캠프 22기'
  code: string // 'AI22'
  campus: string // '강남캠퍼스'
  status: CourseOperationStatus
}

export interface CourseFeatureToggle {
  key: string // 'mileage' | 'play' | 'records' | 'blog' | 'library'
  label: string // '마일리지'
  description: string
  enabled: boolean
}

export interface CourseLearningPolicy {
  key: string // 'attendance' | 'quiz' | 'assignment'
  label: string
  description: string
}

export interface CourseConfigDetail {
  courseId: string
  name: string
  campus: string
  status: CourseOperationStatus
  description: string
  featureToggles: CourseFeatureToggle[] // 기능 토글 5
  learningPolicies: CourseLearningPolicy[] // 학습 정책 3 (조회 전용 행)
  publicToggles: CourseFeatureToggle[] // 공개 정책 2 — 수강생 메뉴 노출·증명서 반영
  /** 변경 시 영향을 받는 화면 안내 — §6 완료 기준 */
  impacts: string[]
}

// ── 교육 과정 추가 (Figma 1284:9435) ──
export type HrdCourseStatus = 'unregistered' | 'registered' | 'ended' // 미등록 / 등록됨 / 종료

export interface HrdCourseResult {
  trprId: string // 'AIG2026-0001'
  status: HrdCourseStatus
  title: string
  grade: string // '22기'
  period: string // '2026-03-02 ~ 2026-08-29'
  capacity: number
  applied: number
  hrdUrl: string
}

export interface HrdCourseSearchData {
  summary: {
    total: number // scn_cnt
    registrable: number // 종료 제외 미등록
    registered: number // (trprId + 기수) 매칭
    ended: number // endDate < today
  }
  results: HrdCourseResult[]
  page: number
  pageSize: number
  totalPages: number
}
