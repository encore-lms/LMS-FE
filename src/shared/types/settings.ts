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

// ── HRD API Key (learning-service /admin/hrd-keys) ──
// BE 계약(HrdKeyResponse)에 맞춘 모델. 키 원문은 마스킹(****+뒤4)·암호화 저장·재조회 불가.
export interface HrdApiKey {
  id: string // UUID
  name: string
  maskedKey: string // '****3456' — 원문 재조회 불가
  description: string | null
  active: boolean // true=사용 중, false=보관/폐기
  createdBy: string // UUID
  updatedBy: string // UUID
  createdAt: string // ISO-8601 Instant
  updatedAt: string // ISO-8601 Instant
}

// 목록 페이지네이션 응답 (GET /admin/hrd-keys)
export interface HrdKeyListData {
  items: HrdApiKey[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  sort: string
}

// BE history action 값 그대로 사용 (등록=create / 수정=update / 삭제=delete / 연결테스트=test)
export type HrdKeyHistoryAction = 'create' | 'update' | 'delete' | 'test'

export interface HrdKeyHistoryRow {
  id: string
  at: string // ISO-8601 Instant
  action: HrdKeyHistoryAction
  actor: string // 수행자 표시명
  ok: boolean
  responseMs: number | null // test 지연(ms), 그 외 null
  targetKeyMasked: string // 대상 키 마스킹 표기
}

// 이력 페이지네이션 응답 (GET /admin/hrd-keys/history)
export interface HrdKeyHistoryData {
  items: HrdKeyHistoryRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// 연결 테스트 결과 (POST /admin/hrd-keys/{id}/test)
export interface HrdKeyTestResult {
  ok: boolean
  latencyMs: number
  at: string // ISO-8601 Instant
  error: string | null // 실패 사유 (성공이면 null)
}

// KPI 요약 (GET /admin/hrd-keys/summary)
export interface HrdKeySummary {
  activeKeys: number
  lastTest: HrdKeyTestResult | null // 첫 테스트 전 null
  expiring: number // BE 미지원 → 항상 0
  recentFail: number // 최근 24시간 연결 테스트 실패 수
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
  startDate: string // 'YYYY-MM-DD' — 등록 시 BE로 전송
  endDate: string // 'YYYY-MM-DD'
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
