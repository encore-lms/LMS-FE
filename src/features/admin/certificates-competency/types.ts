/**
 * 역량 증명서 진행 상태 — 증명서를 만들 재료가 얼마나 갖춰졌는지의 축.
 *
 * - `cohort_open` 기수가 아직 안 끝났다 — 증명서를 만들 시점이 아니다
 * - `data_pending` 기수는 끝났는데 재료(프로젝트·기록·평판)가 덜 모였다
 * - `data_ready` 재료가 갖춰져 증명서를 만들 수 있다
 * - `issued` 증명서가 나왔다 — 이 상태에서만 상세를 열 수 있다
 */
export type CompetencyCertStatus =
  | 'cohort_open'
  | 'data_pending'
  | 'data_ready'
  | 'issued'

/** 목록 한 줄 — 수강생 한 명의 역량 증명서 현황. */
export interface CompetencyCertRow {
  studentId: string
  studentName: string
  studentUuid: string
  cohortLabel: string
  status: CompetencyCertStatus
  /** 외부 공개 여부 — 증명서가 나온 뒤에만 켤 수 있다. */
  published: boolean
  /** 증명서가 나오기 전에는 점수가 없다. */
  overallScore: number | null
  /** 증명서 완료 건만 상세를 열 수 있다. */
  openable: boolean
  /** 상세에서 보여줄 데모 인물 id — BE 연동 시 실제 증명서 id 로 바뀐다. */
  demoStudentId: string
}
