// 기록실 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 246:27 외.
// 기록실 목록(블로그·스터디·자격증) + 삭제/수정 상태 + 블로그/스터디/자격증 등록·수정 폼.

import type { Tone } from '@/shared/lib/tone'
export type { Tone }

/** 기록 상태 — draft(작성 중·임시저장)는 수강생 본인에게만 노출, 검토 큐에는 안 올라간다 */
export type RecordStatus = 'draft' | 'approved' | 'reviewing' | 'rejected'

/** 기록 카테고리 — 탭 구분(전체 제외) */
export type RecordCategory = 'blog' | 'study' | 'cert'

/** 상단 필터 탭(카테고리별 건수) */
export interface RecordTab {
  key: string // all/blog/study/cert
  label: string
  count: number
}

/** 요약 통계 카드 */
export interface RecordStat {
  key: string
  label: string // 전체 기록 / 승인 완료 / 검토 중 / 반려
  value: string
  unit: string // "건"
  sub: string
  dotTone: Tone
}

/** 상단 제출 안내 배너(이번 주차 블로그 제출) */
export interface SubmitBanner {
  title: string // "11주차 블로그 제출"
  sub: string // "제출 후 승인 전까지 변경 불가 · 마감 5/18 (월) 23:59"
  actionLabel: string // "블로그 제출"
}

/** 기록 카드(블로그·스터디·자격증 공통 표시 모델) */
export interface BlogRecord {
  id: string
  category: RecordCategory // 탭 구분
  weekLabel: string // "10주차"
  dateRange: string // "5/6 ~ 5/12"
  status: RecordStatus
  statusLabel: string // "승인" | "검토 중" | "반려"
  title: string
  url: string
  instructor: string // "강사 이정훈"
  submittedAt: string // "2026.05.10 제출"
  statusAt: string // "2026.05.12 승인" | "검토 대기"
  rejectReason?: { title: string; detail: string }
  canEdit: boolean
  canDelete: boolean
}

/** 기록실 목록 전체 */
export interface RecordsOverview {
  tabs: RecordTab[]
  stats: RecordStat[]
  banner: SubmitBanner
  listTitle: string // "블로그 기록"
  listCount: number // 12
  records: BlogRecord[]
  shownLabel: string // "12건 중 4건 표시"
}

// ── 등록/수정 폼 ──

/** 주차 셀 상태 */
export type WeekState = 'none' | 'approved' | 'rejected' | 'completed'

export interface WeekCell {
  no: number
  label: string // "12주차"
  range: string // "5/13 ~ 5/19"
  state: WeekState
  note?: string // "승인됨" | "반려 재제출 필요" | "완료"
}

/** 블로그 폼(생성/수정 공통) 데이터 */
export interface BlogFormData {
  cohortLabel: string // "기수 기간 2026-03-04 ~ 2026-08-29 · 26주차"
  weeks: WeekCell[]
  moreLabel: string // "더보기 13~21"
  selectedNo: number // 기본 선택 주차
  title: string // 글 제목(목록 카드 제목으로 노출). 생성 시 빈 문자열
  url: string // 수정 시 기존 URL
  rejectReason?: { title: string; detail: string } // 수정(반려) 시
}

/** 첨부 파일 메타(기존 첨부 표시용) */
export interface UploadedFileMeta {
  id: string
  name: string
  size: string // "2.1MB"
}

/** 스터디 등록/수정 폼 데이터 */
export interface StudyFormData {
  title: string
  date: string // "2026-06-17(수)"
  startTime: string // "19:00"
  endTime: string // "21:30"
  body: string
  files: UploadedFileMeta[] // 수정 시 기존 첨부
  rejectReason?: { title: string; detail: string }
}

/** 자격증 종류 — 인증 프리셋 3종 + 기타(직접 입력) */
export type CertType = 'PCCE' | 'PCCP' | 'PCSQL' | 'OTHER'

/** 자격증 등록/수정 폼 데이터 */
export interface CertFormData {
  certType: CertType
  title: string
  otherCertName?: string // certType='OTHER'일 때 직접 입력한 자격증명
  fileName?: string // 수정 시 기존 첨부 파일명
  fileSize?: string
  rejectReason?: { title: string; detail: string }
}

// ── 등록(생성) 입력 ──

/** 블로그 기록 등록 입력 — 선택 주차 + 제목 + 외부 URL */
export interface CreateBlogRecordInput {
  weekNo: number
  weekLabel: string
  dateRange: string
  title: string
  url: string
}

/** 스터디 기록 등록 입력 — 제목·일정·증빙 개수. draft=true면 임시저장(작성 중) */
export interface CreateStudyRecordInput {
  title: string
  date: string
  startTime: string
  endTime: string
  fileCount: number
  draft?: boolean
}

/** 자격증 기록 등록 입력 — 종류·제목. draft=true면 임시저장(작성 중) */
export interface CreateCertRecordInput {
  certType: CertType
  title: string
  otherCertName?: string
  draft?: boolean
}
