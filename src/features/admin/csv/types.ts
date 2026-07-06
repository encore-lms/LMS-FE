// CSV 매핑·업로드 (/admin/csv-mapping) 도메인 타입 — 기능 로컬.
// BE 계약(P0_20 운영 CSV 매핑·인입·격리 큐) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 인입 소스 — 탭(학생/프로젝트 · 기록실 · 이력서) */
export type CsvImportSource = 'student-project' | 'record' | 'resume'

/** 매핑 상태 — 확정 / 확인 / 후보 / 미매핑 */
export type CsvMappingStatus = 'confirmed' | 'check' | 'candidate' | 'unmapped'

/** 매핑 행 액션 — 고정 / 수정 / 검토 / 선택 */
export type CsvMappingAction = 'pin' | 'edit' | 'review' | 'select'

/** 검증 항목 처리 — 격리 / 수정 필요 / 통과 / 운영 확인 */
export type CsvValidationHandling =
  | 'quarantine'
  | 'fix_needed'
  | 'pass'
  | 'ops_check'

// 원본 필드 → 도메인 필드 매핑 한 행.
export interface CsvMappingRow {
  id: string
  /** 원본(CSV 헤더) 필드 — 예: "student_name" */
  sourceField: string
  /** 매핑 대상 도메인 필드 — 예: "StudentProfile.name" */
  domainField: string
  /** 자동 매핑 신뢰도(%) */
  confidence: number
  status: CsvMappingStatus
  action: CsvMappingAction
}

// 검증 항목 한 행.
export interface CsvValidationRow {
  id: string
  /** 검증 항목명 — 예: "필수값" */
  item: string
  /** 정상 행 수 */
  normal: number
  /** 오류 행 수 */
  error: number
  handling: CsvValidationHandling
}

// 상단 KPI 5종.
export interface CsvImportSummary {
  uploadFiles: number
  /** 업로드 파일 구성 — 예: "CSV 2 · XLSX 1" */
  uploadFilesHint: string
  /** 매핑 신뢰도(%) */
  mappingConfidence: number
  unmappedFields: number
  validationErrors: number
  requiredValueErrors: number
  quarantineCandidates: number
  /** 처리 예상 시간(분) */
  estimatedMinutes: number
  totalRows: number
}

// 업로드 파일 메타.
export interface CsvFileMeta {
  fileName: string
  /** 파일 상세 — 예: "2,340행 · UTF-8 · 쉼표 구분 · 헤더 포함" */
  detail: string
}

// 한 인입 소스의 전체 데이터.
export interface CsvImportData {
  source: CsvImportSource
  file: CsvFileMeta
  summary: CsvImportSummary
  mappings: CsvMappingRow[]
  validations: CsvValidationRow[]
}

// 소스별 데이터 묶음 — 탭 전환 시 해당 소스를 렌더.
export type CsvImportOverview = Record<CsvImportSource, CsvImportData>

// ---- 실연동(operations-service /admin/csv-ingest) 타입 — P0_20 업로드 구간 ----

/** 인입 가능한 데이터셋 계약 + staging 적재 현황. */
export interface CsvIngestDataset {
  key: string
  label: string
  table: string
  /** 수용 가능한 전체 컬럼(풍부판) */
  columns: string[]
  /** 반드시 있어야 하는 최소 컬럼(스펙판) */
  requiredColumns: string[]
  /** 현재 staging 적재 행 수 */
  rowCount: number
}

/** 격리된 행 미리보기(최대 20건). */
export interface CsvIngestQuarantinePreview {
  rowNo: number
  reason: string
}

/** CSV 업로드 처리 결과 — 정상 행 staging 반영, 오류 행 격리 큐 이동. */
export interface CsvIngestUploadResult {
  uploadId: number
  dataset: string
  fileName: string
  mode: 'replace' | 'append'
  totalRows: number
  insertedRows: number
  quarantinedRows: number
  quarantinePreview: CsvIngestQuarantinePreview[]
}

/** 업로드 감사 이력 1건. status: applied(반영됨) / rolled_back(롤백됨). */
export interface CsvIngestUpload {
  id: number
  dataset: string
  fileName: string
  mode: 'replace' | 'append'
  totalRows: number
  insertedRows: number
  quarantinedRows: number
  uploadedBy: string | null
  status: 'applied' | 'rolled_back'
  rolledBackAt: string | null
  createdAt: string
}

/** 업로드 롤백 결과 — 제거된 staging 행·격리 행 수. */
export interface CsvIngestRollbackResult {
  uploadId: number
  dataset: string
  removedRows: number
  removedQuarantineRows: number
}
