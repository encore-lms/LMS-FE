// PLAY 타자 관리 (/admin/play/typing-texts) 도메인 타입 — 기능 로컬.
// BE 계약(P0_15 운영 PLAY 관리) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 제시문 상태 — 활성 / 비활성 / 오류 */
export type PassageStatus = 'active' | 'inactive' | 'error'

// 타자 제시문 한 건(목록 행).
export interface TypingPassage {
  id: string
  title: string
  /** 부가 설명 — 예: "내용 미리보기 80자 기준, 수강생 입력 대상 원문" */
  previewNote: string
  /** 언어 — Python / 한글 / 영문 */
  language: string
  /** 난이도 — 쉬움 / 보통 / 어려움 */
  level: string
  /** 정렬 순서 */
  order: number
  status: PassageStatus
  /** 본문 원문 — 수정 폼 프리필용. BE 계약 확정 전 클라이언트 보존(목록 응답에 없으면 undefined). */
  content?: string
}

// 일괄 업로드 검증 결과 한 행.
export interface UploadValidationRow {
  id: string
  rowNo: number
  title: string
  /** title 누락 등 오류 여부 */
  titleError: boolean
  content: string
  contentError: boolean
  language: string
  /** easy / medium / hard */
  level: string
  /** 검증 결과 — 예: "저장 가능" / "title 필수" / "content 필수" */
  result: string
  /** 저장 가능 여부 */
  ok: boolean
}

// 상단 요약(목록 카운트·비활성 과정).
export interface PlaySummary {
  active: number
  inactive: number
  error: number
  /** 비활성 과정 수(노출 조건 배너) */
  disabledCourses: number
}

export interface PlayOverview {
  summary: PlaySummary
  passages: TypingPassage[]
  uploadValidation: UploadValidationRow[]
  /** 일괄 업로드 검증 오류 행 수 */
  uploadErrorRows: number
}
