// 운영 학생 관리 (/admin/students) — 계정·출결·출결 폼 3탭. (Figma Main Flow 09)
// 공유 읽기전용 계약. 변경은 도메인 PR에 섞지 말고 별도 shared PR로.

// ── 계정 탭 ──
export type StudentTrainingStatus = 'active' | 'dropout' // 정상 / 중도탈락

export interface StudentAccount {
  id: string
  name: string
  studentUuid: string // HRD-Net 기준 UUID, 예: 2024-AIB3-0027
  birthDate: string // YYYY-MM-DD
  joinedAt: string // MM-DD
  lastLoginAt: string | null // '오늘 09:18' | '7일 전' 표기 (null = 미접속)
  trainingStatus: StudentTrainingStatus
  loginBlocked: boolean
}

export interface StudentAccountsSummary {
  total: number
  normal: number
  loginBlocked: number
  lastSyncAt: string // '09:42'
  syncCreated: number // 마지막 동기화 생성 수
  syncExisting: number // 기존 수
}

export interface StudentAccountQueue {
  cohortLabel: string // 'AI 캠프 22기'
  summary: StudentAccountsSummary
  items: StudentAccount[]
}

// ── 출결 탭 (HRD-Net 월별 출결 — learning-service) ──
export type HrdAttendanceStatus =
  | 'normal'
  | 'late'
  | 'absent'
  | 'early_leave'
  | 'leave_missing' // 퇴실 누락

// HRD 출결 1행 = 학생·일자 단위(월별 조회). 출결 폼 대조(formLink/verify)는 후속 단위.
export interface StudentAttendanceRow {
  id: string
  studentName: string
  studentUuid: string
  date: string // YYYY-MM-DD
  checkIn: string | null // '08:36'
  checkOut: string | null // '17:51'
  hrdStatus: HrdAttendanceStatus
  hrdStatusLabel: string // HRD 원본 상태명('출석'·'지각'…)
}

export interface AttendanceSummary {
  present: number
  late: number
  earlyLeaveOuting: number // 조퇴·외출
  absent: number
  hrdMismatch: number
}

export interface StudentAttendanceData {
  cohortLabel: string
  date: string // YYYY-MM-DD (선택 일자)
  summary: AttendanceSummary
  rows: StudentAttendanceRow[]
}

// ── 출결 폼 탭 ──
export type AttendanceFormType = 'late' | 'early_leave' | 'absent' | 'outing'
export type AttendanceFormReviewStatus =
  | 'pending'
  | 'approval_pending'
  | 'confirmed'
  | 'changes' // 보완 요청

export interface AttendanceFormRow {
  id: string
  submitter: string
  targetDate: string // '2026-05-19' (테이블은 MM-DD 슬라이스)
  type: AttendanceFormType
  officialLeaveUsed: boolean // 공가 사용 여부
  evidence: string // '교통 지연 캡처'
  status: AttendanceFormReviewStatus
  reason: string // 신청 사유 (우측 검토 패널 상세)
  evidenceFiles: number // 증빙 파일 수
}

export interface AttendanceFormSummary {
  totalSubmitted: number
  late: number
  earlyLeaveOuting: number
  absent: number
  officialLeaveUsed: number
}

export interface AttendanceFormData {
  cohortLabel: string
  summary: AttendanceFormSummary
  rows: AttendanceFormRow[]
}
