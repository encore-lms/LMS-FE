/**
 * 역량 증명서 진행 상태 — 재료가 갖춰지는 축과 정식 인증 축을 하나로 잇는다.
 *
 * <p>예전에는 재료 축(이 목록)과 인증 축(별도 '인증 검토 큐')을 다른 화면에서 봤다.
 * 증명서 한 장의 앞뒤인데 두 군데를 오가야 해서 하나로 합쳤다(2026-08-06 결정).</p>
 *
 * - `cohort_open` 기수가 아직 안 끝났다 — 증명서를 만들 시점이 아니다
 * - `data_pending` 기수는 끝났는데 재료(프로젝트·기록·평판)가 덜 모였다
 * - `data_ready` 재료가 갖춰졌다 — 수강생이 정식 인증을 요청할 수 있다
 * - `requested` 수강생이 정식 인증을 요청했다 — 검토를 시작할 수 있다
 * - `reviewing` 운영자가 검토 중이다 — 승인·보완 요청을 낼 수 있다
 * - `changes_requested` 보완을 요청했다 — 수강생의 재요청을 기다린다
 * - `certified` 정식 인증 완료 — 인증 마크가 붙고 스냅샷이 동결된다
 */
export type CompetencyCertStatus =
  | 'cohort_open'
  | 'data_pending'
  | 'data_ready'
  | 'requested'
  | 'reviewing'
  | 'changes_requested'
  | 'certified'

/** 운영자가 지금 손댈 수 있는 단계 — 목록의 '검토 대기' 묶음. */
export const REVIEW_STATUSES: CompetencyCertStatus[] = [
  'requested',
  'reviewing',
  'changes_requested',
]

/** 목록 한 줄 — 수강생 한 명의 역량 증명서 현황. */
export interface CompetencyCertRow {
  studentId: string
  studentName: string
  studentUuid: string
  cohortLabel: string
  status: CompetencyCertStatus
  /** 외부 공개 여부 — 정식 인증 뒤에만 켤 수 있다. */
  published: boolean
  /** 재료가 갖춰지기 전에는 점수가 없다. */
  overallScore: number | null
  /** 재료가 갖춰진 뒤부터 상세를 열 수 있다 — 검토하려면 먼저 봐야 한다. */
  openable: boolean
  /** 상세에서 보여줄 데모 인물 id — BE 연동 시 실제 증명서 id 로 바뀐다. */
  demoStudentId: string
  /** 서버 상태로 병합할 때 점수를 재계산하기 위한 데모 원본 점수. */
  demoOverallScore: number
}
