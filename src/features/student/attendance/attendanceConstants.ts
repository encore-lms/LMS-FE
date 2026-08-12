import { formatDateTime } from '@/shared/lib/date'
import type { AttendanceType, OfficialLeaveType } from './types'

// 출결 도메인 표시 상수 — 폼 옵션·이력 표시가 공유하는 단일 출처(라벨 중복 방지).
// (출결 상태 라벨/색은 ATTENDANCE_STATUS_META, 공가 라벨은 여기서 관리)

/** 출결 유형 4종 — 폼 라디오 옵션. hint는 유형별 조건부 입력 안내 */
export const ATTENDANCE_TYPE_OPTIONS: {
  value: AttendanceType
  label: string
  hint: string
}[] = [
  { value: 'LATE', label: '지각', hint: '예상 입실 시간 입력' },
  { value: 'EARLY_LEAVE', label: '조퇴', hint: '예상 조퇴 시간 입력' },
  { value: 'OUTING', label: '외출', hint: '외출·복귀 시간 입력' },
  { value: 'ABSENT', label: '결석', hint: '결석 사유 입력' },
]

/** 공가 유형 5종 — 폼 칩 옵션 */
export const OFFICIAL_LEAVE_TYPE_OPTIONS: {
  value: OfficialLeaveType
  label: string
}[] = [
  { value: 'VACATION', label: '휴가' },
  { value: 'SICK', label: '병가' },
  { value: 'INTERVIEW', label: '면접' },
  { value: 'RESERVE', label: '예비군' },
  { value: 'OTHER', label: '기타' },
]

/** 공가 유형 라벨 맵 — 제출 이력 표시용 */
export const OFFICIAL_LEAVE_LABEL: Record<OfficialLeaveType, string> = {
  VACATION: '휴가',
  SICK: '병가',
  INTERVIEW: '면접',
  RESERVE: '예비군',
  OTHER: '기타',
}

/**
 * 제출 일시 표시 — "YYYY-MM-DD HH:mm" (KST).
 *
 * BE는 Instant.toString() 으로 UTC(Z 접미)를 내려준다. 예전엔 시안 값을 그대로 쓰려고
 * 문자열을 잘라 썼는데, 그러면 UTC 시각을 그대로 노출해 같은 제출 건이 운영 화면
 * (formatDateTime, KST)보다 9시간 이르게 보였다. 표시는 공용 포맷터로 일원화한다.
 */
export const formatSubmittedAt = (iso: string) => formatDateTime(iso)
