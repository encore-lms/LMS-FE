import type { PublicCertificateSevenTabs } from '@/features/student/certificate/analysis'

// 외부 검증 응답 타입 — feature-local(shared 페어 규칙 회피). BE 계약 확정 시 shared 승격.
// 계약 원천: LMS-DOCS P0_02_03_04 증명서 API 명세 — GET /verify/{publicToken}은
// '가능한 한 resultType 응답'(200) 7종 판별 유니언. 실패도 4xx 대신 resultType으로 받는다.

/** 공개 증명서 본문 — 활성 CertificateSnapshot.publicPayload만 사용(내부 근거·결측 경고 비포함). */
export interface PublicCertificatePayload {
  schemaVersion: '2026.08.26-certificate-seven-tab-result-v1'
  generatedAt: string
  /** Snapshot 공개 정책을 적용한 결과라 growthReputation만 없을 수 있다. */
  tabs: PublicCertificateSevenTabs
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
