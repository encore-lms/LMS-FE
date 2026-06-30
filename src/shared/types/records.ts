// 학습 기록 검토(운영) 도메인 타입 — 검토 큐(/admin/records/review) + 상세 3종(/admin/records/:category/:submissionId).
// 블로그·스터디·자격증 제출을 MANAGER 단독으로 승인·반려·보완 요청.
// (BE 계약 확정 시 페어가 shared PR로 갱신)

export type RecordCategory = 'blog' | 'study' | 'certificate'

// 큐 노출 상태 — 대기·보완 요청 중심(승인·반려는 처리 후 큐에서 빠짐).
export type RecordReviewStatus = 'pending' | 'changes_requested'

// 인라인 결정 액션 — 미리보기 패널 푸터.
export type RecordDecision = 'approve' | 'reject' | 'changes'

// 강사 관찰 코멘트 — 조회 전용(강사 §13 화면은 조회 전용, 코멘트는 참고용 표시).
export interface InstructorNote {
  instructor: string // "김지훈 강사"
  at: string // "05-19 10:14"
  body: string
}

// 첨부 — RecordAttachment 표시용.
export interface RecordAttachmentRef {
  name: string // "airflow-trace-flow.png"
  meta: string // "PNG · 480 KB"
}

// 큐 행 + 미리보기 공용. category별로 미리보기 본문이 적응한다.
export interface RecordReviewItem {
  id: string
  studentUserId: string // 이름 join 키(useStudentAccounts.items[].id)
  student: { name: string; cohort: string } // cohort = "22기"
  category: RecordCategory
  title: string
  summary: string // 제목 아래 한 줄 요약
  externalUrl?: string // 블로그 등 외부 URL(있을 때만)
  body: string[] // 본문 단락(문제/해결·활동 내용·정책 확인 등)
  submittedAt: string // "2026-05-19 09:42"
  status: RecordReviewStatus
  noteCount: number // 제목 옆 강사 코멘트 수 배지
  instructorNote?: InstructorNote // 강사 관찰 코멘트(조회 전용)
  attachments: RecordAttachmentRef[]
  mileageCandidate?: string // "지급 후보 +15,000" 등(자격증·일부 카테고리)
}

// 검토 큐 요약 + 행 목록. (Figma "운영 — 학습 기록 검토 큐" 1507:10816)
export interface RecordReviewQueue {
  cohortId: string // 학생명 join용(useStudentAccounts)
  cohort: string // "AI 캠프 22기"
  instructor: string // 담당 강사 "김지훈"
  pendingTotal: number // 처리 대기 28
  weekProcessed: number // 이번 주 처리 94
  avgHours: number // 평균 처리 6.4(시간)
  unassigned: number // 미배정 6
  over24h: number // 24h 초과 3
  changesRequested: number // 보완 요청 중 12
  approvedToday: number // 오늘 승인 18
  payoutCandidates: number // 지급 후보 8
  rejectedThisWeek: number // 이번 주 반려 5
  byCategory: Record<RecordCategory, number> // 블로그 14·스터디 8·자격증 6
  items: RecordReviewItem[]
}

// ── 검토 상세 3종 (/admin/records/{blog|study|certificates}/:submissionId) ──
// Figma: 블로그 1515:10927 · 스터디 1515:11144 · 자격증 1515:11361.
// URL 세그먼트는 'certificates'(복수) — RecordCategory 'certificate'(단수)와는
// FE 매핑 함수로 변환하고, 미지원 세그먼트는 페이지에서 Empty 가드.

/** 증빙 이미지 — 스터디·자격증 공용. quality='blurry'면 칸에 경고 표기 */
export interface RecordEvidenceImage {
  id: string
  url: string
  quality: 'ok' | 'blurry'
  note?: string // '흐림 · 재제출 권장' — blurry일 때만
}

/** 자동 점검 결과 — 블로그 URL 점검·개인정보 검사 KPI. 디자인은 통과 상태만 존재(실패 표시값 BE 확정 대기) */
export interface RecordAutoCheck {
  passed: boolean
  label: string // KPI 값 — '정상' / '없음'
  note: string // KPI 캡션 — '응답 200'(HTTP 상태코드) / '자동 검사 통과'
}

/** 상세 공통부 — id = 라우트 :submissionId(큐 RecordReviewItem.id와 동일 키) */
export interface RecordSubmissionBase {
  id: string
  student: { name: string; cohort: string } // '김민준' · 'DA 4기'
  submissionLabel: string // 제출물 종류 — '5주차 회고' / '코테 스터디 3회' / 'PCCP Lv.2'
  submittedAt: string // '2026-05-19 09:42'
  status: RecordReviewStatus // 프레임은 '대기'(스터디는 보완) 상태만 디자인됨
  reviewNote: string // 검토 메모(빈 문자열 = 미입력)
  mileageCandidate?: string // '후보 +2,000' / '+15,000' — RecordReviewItem.mileageCandidate와 동일 표시형
}

/** 블로그 검토 상세 (Figma 1515:10927) */
export interface BlogSubmissionDetail extends RecordSubmissionBase {
  category: 'blog'
  externalUrl: string // 제출 URL — '새 탭 열기' 필과 동일 타깃(target=_blank)
  previewSummary: string // 미리보기 요약(수집 본문 2줄 요약)
  urlCheck: RecordAutoCheck // KPI 'URL 점검' — 정상 · 응답 200
  privacyCheck: RecordAutoCheck // KPI '개인정보' — 없음 · 자동 검사 통과
  certificateCandidates: string[] // 증명서 반영 후보 — 화면은 ' · ' 조인('학습 성실성' 등)
}

/** 스터디 검토 상세 (Figma 1515:11144) */
export interface StudySubmissionDetail extends RecordSubmissionBase {
  category: 'study'
  activityHours: number // 활동 시간 KPI — 2(h)
  activityTimeRange: string // '20:00~22:00'
  streakCount: number // 연속 달성 3회 — 승인 시 마일리지 후보 연계
  evidenceQuality: { level: 'ok' | 'warning'; note: string } // '주의' · '한 장 흐림'
  evidenceImages: RecordEvidenceImage[] // 이미지 증빙 첨부 목록(흐림 칸 경고 포함)
  activityNote: string // 활동 내용 단락
}

/** 자격증 OCR 후보 — 증빙 이미지에서 추출(검토자 확인용 값) */
export interface CertificateOcrCandidate {
  certificateName: string // 'PCCP'
  grade?: string // 'Lv.2'
  holderName: string // 응시자 이름 '정도윤'
  acquiredAt: string // 취득일 '2026-05-12'
}

/** 자격증 검토 상세 (Figma 1515:11361) */
export interface CertificateSubmissionDetail extends RecordSubmissionBase {
  category: 'certificate'
  evidenceImages: RecordEvidenceImage[] // KPI '증빙 1장' — 디자인은 1장 케이스만
  ocr: CertificateOcrCandidate // KPI 캡션 'OCR 후보 있음'
  policyAllowed: boolean // 허용 자격증 여부 — KPI '인증 정책 허용'
  allowedCertificates: string[] // 허용 목록 — KPI 캡션 'PCCE/PCCP/PCSQL'('/' 조인)
  duplicateSubmission: boolean // 중복 제출 여부
  policyNote: string // '허용 자격증이며, 중복 제출 이력이 없습니다. …'
}

/** 검토 상세 — category 판별 유니언. GET /api/admin/records/:category/:submissionId 응답 */
export type RecordSubmissionDetail =
  | BlogSubmissionDetail
  | StudySubmissionDetail
  | CertificateSubmissionDetail

/**
 * 검토 처리 액션 DTO — 승인/반려/보완 공용.
 * 반려·보완은 studentVisibleComment 필수(미입력 시 422 REVIEW_REASON_REQUIRED — FE는 버튼 disabled로 선차단),
 * 승인은 선택(빈 문자열 허용).
 */
export interface RecordReviewActionRequest {
  // TODO: reasonCode enum은 BE 확정 대기 — Figma에 사유 코드 선택 UI 없음, FE는 comment만 채운다.
  reasonCode?: string
  studentVisibleComment: string // 수강생 기록실에 노출되는 검토 메모
  internalComment?: string // 운영 내부 메모(수강생 비노출)
}

// ── 운영 기록실 주차 제출 그리드(이전 LMS RecordsGridView) ──
export interface RecordGridWeek {
  no: number
  label: string // "6월 3주차"
}
export interface RecordGridRow {
  studentUserId: string
  cells: Record<string, string> // weekNo → 'approved' | 'pending' | 'rejected'
  recordIds: Record<string, string> // weekNo → recordId(셀 클릭 검토 진입)
  approved: number
  total: number
}
export interface RecordGrid {
  cohortId: string
  weeks: RecordGridWeek[]
  rows: RecordGridRow[]
}

// 운영 자격증 목록 항목(주차 무관 — 수강생별 자격증 제출 + 검토)
export interface AdminCertItem {
  recordId: string
  studentUserId: string
  certificateName: string
  acquiredAt: string
  submittedAt: string
  status: string // 'approved' | 'pending' | 'rejected'
}
