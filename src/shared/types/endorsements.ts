// 강사 추천서(긍정 추천서) 도메인 — MentorEndorsement(role=INSTRUCTOR) 기반.
// 정책(P0 31): 긍정 추천서만 작성, 코멘트 길이 무제한, 제출 후 24h 내 수정 가능.
// 공개 = 추천서 존재 + 인증 완료 + 증명서 전체 공개 토글 ON + 최신화 작업 후 공개 스냅샷 포함.
// (BE 계약 확정 시 페어가 shared PR로 갱신)

// 증명서 스냅샷 반영 상태(파생) — 추천서 1건이 공개 스냅샷까지 가는 단계.
export type EndorsementSnapshotStatus =
  | 'snapshot_applied' // 스냅샷 반영(공개 반영 완료)
  | 'pending_certification' // 인증 대기(증명서 인증 전)
  | 'pending_refresh' // 최신화 대기(인증 완료, 최신화 작업 전)

export interface EndorsementStudent {
  id: string
  name: string
  cohort: string // 'DA 4기'
  track?: string // '데이터 분석'
  email?: string
}

// 작성 대기 카드 — 담당 기수 중 아직 추천서를 안 쓴 학생.
export interface EndorsementPending {
  student: EndorsementStudent
  observationMonths: number // 관찰 4개월
  dueDays: number // 마감 D-3
}

// 작성된 추천서 1건.
export interface Endorsement {
  id: string
  student: EndorsementStudent
  summary: string // 코멘트 요약(목록·전체 보기 행)
  comment: string // 전체 코멘트(상세·수정)
  createdAt: string // '2026-05-12'
  snapshotStatus: EndorsementSnapshotStatus
  /** 제출 후 24h 수정 창의 남은 분. 0/미정이면 수정 불가(신규 row로만 변경). */
  editableUntilMinutes?: number
}

// 목록/작성 화면(/instructor/endorsements).
export interface EndorsementQueue {
  cohort: string
  instructor: string
  pending: EndorsementPending[]
  recent: Endorsement[]
  recentTotal: number // 누적 18건
}

// 전체 보기(/instructor/endorsements/history).
export interface EndorsementStats {
  total: number // 누적 추천서 14
  thisMonth: number // 이번 달 3
  snapshotApplied: number // 스냅샷 반영 8
  pendingRefresh: number // 최신화 대기 2
}

export interface EndorsementHistory {
  stats: EndorsementStats
  items: Endorsement[]
}
