// 외부 검증 응답 타입 — feature-local(shared 페어 규칙 회피). BE 계약 확정 시 shared 승격.
// 계약 원천: LMS-DOCS P0_02_03_04 증명서 API 명세 — GET /verify/{publicToken}은
// '가능한 한 resultType 응답'(200) 7종 판별 유니언. 실패도 4xx 대신 resultType으로 받는다.

/** 공개 증명서 본문 — 활성 CertificateSnapshot.publicPayload만 사용(내부 근거·결측 경고 비포함). */
export interface PublicCertificatePayload {
  issuer: string
  /** 인증일(YYYY-MM-DD) — Hero 메타. */
  certifiedDate: string
  /** 발급 시점 표시 문자열(예: '2026-05-19 11:24 KST') — 검증 정보 카드. */
  issuedAt: string
  student: {
    nameKo: string
    nameEn: string
    cohort: string
    /** 과정 요약(예: 'PLAYDATA 데이터 분석 과정 · 480h · 2025-12 ~ 2026-05'). */
    courseSummary: string
  }
  stats: {
    coreCompetencyGrade: string
    attendanceRate: string
    examAverage: string
    submissionRate: string
  }
  skills: { label: string; score: number }[]
  skillAvg: number
  /** 동료 평판·코멘트 공개 여부 — 수강생이 공개 설정에서 켠 값. '평가·추천' 탭 노출을 가른다. */
  peerReputationPublic?: boolean
  /** 대표 근거 요약(예: '프로젝트 1 · 트러블슈팅 1 · 기록실 12'). */
  evidenceSummary: string
  evidence: {
    category: '프로젝트' | '트러블슈팅' | '기록실'
    title: string
    description: string
  }[]
}

export interface CertifiedPublicResult {
  resultType: 'certified_public'
  verificationId: string
  snapshotVersion: string
  snapshotHash: string
  publicSchemaVersion: string
  publicPayload: PublicCertificatePayload
}

export interface CertifiedPrivateResult {
  resultType: 'certified_private'
  /** 마스킹 검증 ID(예: 'CERT-****-0012') — payload 없음. */
  verificationIdMasked: string
  messageCode: 'CERTIFICATE_PRIVATE'
}

export interface NotCertifiedResult {
  resultType: 'not_certified'
  messageCode: 'CERTIFICATE_NOT_CERTIFIED'
}

export interface PublicPreparingResult {
  resultType: 'public_preparing'
  verificationIdMasked: string
  messageCode: 'CERTIFICATE_PUBLIC_PAYLOAD_NOT_READY'
}

export interface VerificationDisabledResult {
  resultType: 'verification_disabled'
  messageCode: 'CERTIFICATE_TOKEN_DISABLED'
}

export interface InvalidTokenResult {
  resultType: 'invalid_token'
  messageCode: 'CERTIFICATE_TOKEN_INVALID'
}

export interface ExpiredTokenResult {
  resultType: 'expired_token'
  messageCode: 'CERTIFICATE_TOKEN_EXPIRED'
}

/** GET /verify/:publicToken 응답 — resultType 판별 유니언(7종). */
export type ExternalCertificateVerificationResponse =
  | CertifiedPublicResult
  | CertifiedPrivateResult
  | NotCertifiedResult
  | PublicPreparingResult
  | VerificationDisabledResult
  | InvalidTokenResult
  | ExpiredTokenResult

export type VerificationResultType =
  ExternalCertificateVerificationResponse['resultType']
