// 평판 관리 (/admin/reputation) 도메인 타입 — 기능 로컬.
// BE 계약(P0_25 운영 평판 수집 관리) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 강사 추천서 상태 — 수집됨 / 미수집 / 요청 중 */
export type EndorsementStatus = 'collected' | 'not_collected' | 'requesting'

/** 멘토 평가·추천 상태 */
export type MentorEvalStatus =
  | 'recommended' // 평가 완료 · 추천
  | 'not_recommended' // 평가 완료 · 추천 안 함
  | 'pending' // 평가 대기
  | 'not_eligible' // 평가 대상 외
  | 'in_progress' // 평가 진행 중

/** 푸시 대상 — 강사 / 멘토 / 동료 */
export type PushTarget = 'instructor' | 'mentor' | 'peer'

// 수강생 한 명의 평판 수집 현황(표 한 행).
export interface ReputationStudent {
  id: string
  /** 소속 기수 id — 과정·기수 필터용(구버전 BE 응답엔 없을 수 있어 옵셔널) */
  cohortId?: string
  name: string
  uuid: string
  endorsementStatus: EndorsementStatus
  /** 강사명·D-day 등 — 예: "김지훈 강사" / "김지훈 강사 · D-2" / "-" */
  endorsementBy: string
  mentorEvalStatus: MentorEvalStatus
  /** 멘토명 — 예: "김효원" / "-" */
  mentorBy: string
  /** 동료 5축 수집 인원 */
  peerCount: number
  /** 동료 5축 대상 인원 */
  peerTotal: number
  /** 노출할 푸시 버튼(비어 있으면 완료) */
  pushTargets: PushTarget[]
}

// 상단 KPI 4종.
export interface ReputationSummary {
  students: number
  cohortLabel: string
  endorsements: number
  /** 예: "수집됨 · 77.7%" */
  endorsementsHint: string
  /** 예: "12 / 20" */
  mentorEval: string
  mentorEvalHint: string
  peerAxes: number
  /** 예: "평균 5.05 · 6명" */
  peerAxesHint: string
  /** 누락(미수집) 수강생 수 — 히어로·일괄 푸시 */
  missingStudents: number
}

export interface ReputationOverview {
  summary: ReputationSummary
  students: ReputationStudent[]
}
