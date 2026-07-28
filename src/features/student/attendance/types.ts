// 출결 도메인 계약 — 기능 로컬(공유 파일 미오염). 강사·매니저가 쓰게 되면 그때 shared로 승격.
// 정책: HRD-Net 출결은 단방향 표시(원본 미수정), 출결 폼은 같은 cohort 마지막 1건만 유효(덮어쓰기).
// 출결 유형 4종(공가는 유형 아닌 보조 토글). wire 포맷: 날짜·시각은 ISO 8601 string.

/** 출결 폼 유형 — 4종(지각·조퇴·외출·결석) */
export type AttendanceType = 'LATE' | 'EARLY_LEAVE' | 'OUTING' | 'ABSENT'

/** 공가 유형 5종 — officialLeaveUsed=true일 때만 의미. OTHER는 사유 직접 입력 */
export type OfficialLeaveType =
  | 'VACATION'
  | 'SICK'
  | 'INTERVIEW'
  | 'RESERVE'
  | 'OTHER'

/** HRD-Net 일자별 출결 상태 — 캘린더 셀 표시용(출석 포함 5종) */
export type HrdAttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'OUTING'
  | 'ABSENT'

/** 증빙 첨부 메타 — 실제 바이트는 다운로드 엔드포인트로 받는다. */
export interface AttendanceAttachment {
  id: string
  fileName: string
  /** 바이트 수. 예전 mock 은 size 였다. */
  fileSize?: number | null
  contentType?: string | null
}

/** 출결 폼 제출 1건 — 같은 cohort에서 마지막 제출 1건만 유효(재제출 시 덮어쓰기) */
export interface AttendanceFormSubmission {
  id: string
  studentId: string
  cohortId: string
  targetDate: string // YYYY-MM-DD
  submittedAt: string // ISO datetime
  attendanceType: AttendanceType
  expectedArrivalTime?: string | null // LATE
  expectedLeaveTime?: string | null // EARLY_LEAVE
  outingStartTime?: string | null // OUTING
  outingEndTime?: string | null // OUTING
  officialLeaveUsed: boolean
  officialLeaveType?: OfficialLeaveType | null
  officialLeaveOtherReason?: string | null
  attachments?: AttendanceAttachment[] | null
  note?: string | null // 비고(결석이면 결석 사유로 사용)
}

/** 캘린더 일자 — HRD 단방향 표시. status=null이면 표시 없음(주말·미래·데이터 없음) */
export interface HrdAttendanceDay {
  date: string // YYYY-MM-DD
  status: HrdAttendanceStatus | null
}

/** 누적 출결 요약 — 상단 KPI 5카드 */
export interface AttendanceSummary {
  attendanceRate: number // 0~100 (%)
  presentDays: number
  totalDays: number
  lateCount: number
  earlyLeaveCount: number
  outingCount: number
  absentCount: number
}

/** 월 단위 캘린더 묶음 */
export interface HrdAttendanceCalendarData {
  year: number
  month: number // 1~12
  today?: string // YYYY-MM-DD — 오늘 날짜(당일 셀 강조용)
  days: HrdAttendanceDay[]
}

/** 출결/태도 조회 화면 응답 묶음 */
export interface AttendanceOverview {
  cohortId: string
  courseName: string
  cohortName: string
  summary: AttendanceSummary
  calendar: HrdAttendanceCalendarData
  submissions: AttendanceFormSubmission[]
}

/** 출결 폼 메타 — 진입 시 canSubmit·최근 제출 표시 */
export interface AttendanceFormMeta {
  cohortId: string
  courseName: string
  cohortName: string
  targetDate: string
  canSubmit: boolean
  latestSubmission?: Pick<
    AttendanceFormSubmission,
    'attendanceType' | 'submittedAt'
  > | null
}

/** 출결 폼 제출 페이로드 — 첨부는 mock 단계라 파일명 메타만 */
export interface AttendanceFormPayload {
  attendanceType: AttendanceType
  expectedArrivalTime?: string
  expectedLeaveTime?: string
  outingStartTime?: string
  outingEndTime?: string
  officialLeaveUsed: boolean
  officialLeaveType?: OfficialLeaveType | null
  officialLeaveOtherReason?: string | null
  note?: string | null
}
