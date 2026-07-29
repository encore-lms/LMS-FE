// 증명서 템플릿 (/admin/certificate-template) 도메인 타입 — 기능 로컬.
// BE 계약(P0_24 운영 증명서 템플릿·정책 관리) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 필드 상태 — 정상 / 주의(공개 위험) */
export type CertFieldStatus = 'normal' | 'warning'

/** 행 액션 — 편집 / 검토 / 마스킹 */
export type CertFieldAction = 'edit' | 'review' | 'mask'

// 섹션별 공개·내부 필드 매핑 한 행.
export interface CertTemplateFieldRow {
  id: string
  /** 섹션 — 예: "프로필" */
  section: string
  /** 공개 필드(수강생/외부 표시) — 예: "이름·과정·기수" */
  publicField: string
  /** 내부 필드(운영/검토 전용) — 예: "userId" */
  internalField: string
  status: CertFieldStatus
  action: CertFieldAction
}

// 상단 KPI 5종.
export interface CertTemplateSummary {
  /** 템플릿 버전 — 예: "v3.2" */
  version: string
  /** 버전 상태 — 예: "공개중" */
  versionState: string
  /** 공개 필드 수(수강생 표시) */
  publicFields: number
  /** 내부 필드 수(운영/검토용) */
  internalFields: number
  /** 스냅샷 잠금 단계(승인 시 고정) */
  snapshotLockStages: number
  /** 정책 경고 수(공개 위험) */
  policyWarnings: number
}

// 우측 "증명서 공개 미리보기" 카드.
export interface CertTemplatePreview {
  studentName: string
  cohortLabel: string
  /** 핵심 역량 요약 — 예: "문제 해결 86 · 협업 91 · 성실성 94" */
  coreCompetency: string
  /** 대표 프로젝트명 */
  representativeProject: string
}

export interface CertTemplateOverview {
  summary: CertTemplateSummary
  fields: CertTemplateFieldRow[]
  preview: CertTemplatePreview
}
