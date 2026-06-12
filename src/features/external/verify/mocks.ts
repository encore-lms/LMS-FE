import { http, HttpResponse } from 'msw'
import type {
  ExternalCertificateVerificationResponse,
  PublicCertificatePayload,
} from './types'

// 기능별 mock — src/mocks/handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집.
// 에러 시맨틱: 명세 '가능한 한 resultType 응답' — 전 분기 200 + resultType.
// 401 절대 금지(인터셉터가 세션을 삭제). 미존재/형식오류 토큰 → 200 + invalid_token으로 통일.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 공개 토큰 — 운영 스냅샷 mock(features/admin/certificates)과 동일 토큰·동일 인물(이서연)로
// 스냅샷 상세 'URL 복사 → /verify 접속' 데모 서사를 일관시킨다.
const PUBLIC_TOKEN = 'vfy_kp9q4r2nx0'

// 공개 payload — 운영 스냅샷 mock(이서연·DA 5기·6축 82/76/88/79/84/81·avg 81.7)과 동일 값.
// Figma 543:2909 대표값과 일치.
const publicPayload: PublicCertificatePayload = {
  issuer: 'PLAYDATA',
  certifiedDate: '2026-05-19',
  issuedAt: '2026-05-19 11:24 KST',
  student: {
    nameKo: '이서연',
    nameEn: 'Lee Seoyeon',
    cohort: 'DA 5기',
    courseSummary: 'PLAYDATA 데이터 분석 과정 · 480h · 2025-12 ~ 2026-05',
  },
  stats: {
    coreCompetencyGrade: 'A',
    attendanceRate: '96.2%',
    examAverage: '84.7',
    submissionRate: '91%',
  },
  skills: [
    { label: '기술', score: 82 },
    { label: '책임감', score: 76 },
    { label: '소통', score: 88 },
    { label: '성장', score: 79 },
    { label: '팀워크', score: 84 },
    { label: '문제해결', score: 81 },
  ],
  skillAvg: 81.7,
  evidenceSummary: '프로젝트 1 · 트러블슈팅 1 · 기록실 12',
  evidence: [
    {
      category: '프로젝트',
      title: 'LLM 추천 시스템 v0.3',
      description:
        'DA 5기 · 강사 김지훈 승인 · LangGraph 기반 Intent/QA/Recommend 분기 설계',
    },
    {
      category: '트러블슈팅',
      title: '#042 Airflow 분산 트레이싱 장애 회고',
      description: '강사 박지영 승인 · DAG 17회 실패 원인 추적·X-Trace 도입',
    },
    {
      category: '기록실',
      title: '블로그 12편 일괄',
      description: '매니저 황설현 승인 · 회고·정리·튜토리얼 다양',
    },
  ],
}

const publicResult: ExternalCertificateVerificationResponse = {
  resultType: 'certified_public',
  verificationId: 'ver_2026Q2_512',
  snapshotVersion: '2026.05',
  snapshotHash: 'sha256:a3f9…07e',
  publicSchemaVersion: '2026.06',
  publicPayload,
}

const invalidResult: ExternalCertificateVerificationResponse = {
  resultType: 'invalid_token',
  messageCode: 'CERTIFICATE_TOKEN_INVALID',
}

// 데모 토큰 7종 분기 — 등록 외 토큰은 전부 invalid_token(미존재/형식오류 통일).
const DEMO: Record<string, ExternalCertificateVerificationResponse> = {
  [PUBLIC_TOKEN]: publicResult,
  vfy_private_demo: {
    resultType: 'certified_private',
    verificationIdMasked: 'CERT-****-0012',
    messageCode: 'CERTIFICATE_PRIVATE',
  },
  vfy_uncert_demo: {
    resultType: 'not_certified',
    messageCode: 'CERTIFICATE_NOT_CERTIFIED',
  },
  vfy_preparing_demo: {
    resultType: 'public_preparing',
    verificationIdMasked: 'CERT-****-0012',
    messageCode: 'CERTIFICATE_PUBLIC_PAYLOAD_NOT_READY',
  },
  vfy_disabled_demo: {
    resultType: 'verification_disabled',
    messageCode: 'CERTIFICATE_TOKEN_DISABLED',
  },
  vfy_expired_demo: {
    resultType: 'expired_token',
    messageCode: 'CERTIFICATE_TOKEN_EXPIRED',
  },
}

export const handlers = [
  // 구체 경로를 :param보다 먼저 등록 — 공개 JSON 다운로드(P0-EXT-VERIFY-007).
  // 다운로드 파일은 publicPayload·verificationId·snapshotVersion·snapshotHash·publicSchemaVersion만
  // 포함(명세 — internalPayload·raw 근거 금지). raw 파일 응답이라 {data} 래핑 없음.
  http.get('/api/verify/:publicToken/public-payload.json', ({ params }) => {
    if (String(params.publicToken) !== PUBLIC_TOKEN) {
      // 공개 불가 상태의 다운로드는 명세상 403 FORBIDDEN(401 금지 — 세션 삭제 인터셉터 회피).
      return HttpResponse.json(
        { error: 'FORBIDDEN', messageCode: 'CERTIFICATE_PRIVATE' },
        { status: 403 },
      )
    }
    const { resultType: _omit, ...file } = publicResult
    void _omit
    return HttpResponse.json(file)
  }),

  http.get('/api/verify/:publicToken', ({ params }) =>
    ok<ExternalCertificateVerificationResponse>(
      DEMO[String(params.publicToken)] ?? invalidResult,
    ),
  ),
]
