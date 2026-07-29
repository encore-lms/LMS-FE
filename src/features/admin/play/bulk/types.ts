// 타자 제시문 일괄 업로드 (/admin/play/typing-texts/bulk) 도메인 타입 — 기능 로컬.
// BE 계약(P0_15 운영 PLAY, GameContent) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 필드 검증 — 정상 / 길이 확인 / 중복 후보 */
export type FieldValidation = 'normal' | 'length_check' | 'dup_candidate'

/** 필드 행 액션 — 고정 / 검토 / 수정 */
export type FieldAction = 'pin' | 'review' | 'edit'

/** 검증 항목 처리 — 통과 / 수정 필요 / 운영 확인 / 매핑 필요 */
export type ValidationHandling =
  | 'pass'
  | 'fix_needed'
  | 'ops_check'
  | 'map_needed'

// 필드 매핑/검증 한 행.
export interface BulkFieldRow {
  id: string
  /** 필수 열명 — language / level / title / content / sortOrder */
  field: string
  /** 샘플 값 */
  sample: string
  validation: FieldValidation
  action: FieldAction
}

// 검증 항목 한 행.
export interface BulkValidationRow {
  id: string
  item: string
  normal: number
  error: number
  handling: ValidationHandling
}

// 상단 KPI 5종.
export interface BulkSummary {
  uploadFiles: number
  uploadFilesHint: string
  normalRows: number
  normalHint: string
  errorRows: number
  errorHint: string
  dupCandidates: number
  dupHint: string
  estimated: number
  estimatedHint: string
}

export interface BulkFileMeta {
  fileName: string
  detail: string
}

export interface BulkUploadData {
  file: BulkFileMeta
  summary: BulkSummary
  fields: BulkFieldRow[]
  validations: BulkValidationRow[]
}
