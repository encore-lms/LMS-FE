import { http, HttpResponse } from 'msw'
import type { AuditEvent, AuditLogData } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 감사 로그 (Figma 1521:11112) ──
const events: AuditEvent[] = [
  {
    id: 'a1',
    at: '05-19 09:32',
    actor: '이정훈',
    event: '정식 인증 승인',
    category: 'auth',
    target: 'CERT-1842',
    result: 'success',
    resultLabel: '성공',
    basis: '승인 모달',
  },
  {
    id: 'a2',
    at: '05-19 09:28',
    actor: '시스템',
    event: '마트 재계산',
    category: 'mart',
    target: 'StudentCertificateCandidateMart',
    result: 'success',
    resultLabel: '성공',
    basis: '작업 #MJ-43',
  },
  {
    id: 'a3',
    at: '05-19 09:20',
    actor: '이정훈',
    event: '보완 요청 해제',
    category: 'supplement',
    target: '프로젝트 근거',
    result: 'success',
    resultLabel: '성공',
    basis: '검토 상세',
  },
  {
    id: 'a4',
    at: '05-18 18:40',
    actor: '김하늘',
    event: '공개 URL 복사',
    category: 'public',
    target: 'publicToken',
    result: 'success',
    resultLabel: '성공',
    basis: '스냅샷 상세',
  },
  {
    id: 'a5',
    at: '05-18 17:12',
    actor: '시스템',
    event: 'PDF 내보내기',
    category: 'export',
    target: 'snapshot.pdf',
    result: 'success',
    resultLabel: '성공',
    basis: '다운로드',
  },
  {
    id: 'a6',
    at: '05-18 16:03',
    actor: '이정훈',
    event: '보완 요청',
    category: 'supplement',
    target: '블로그 기록',
    result: 'success',
    resultLabel: '성공',
    basis: '사유 코드 URL',
  },
]

const overview: AuditLogData = {
  certificateId: 'CERT-1842',
  summary: {
    total: 28,
    totalHint: 'CERT-1842 기준',
    reviewActions: 9,
    reviewHint: '승인/보완 포함',
    publicChanges: 4,
    publicHint: 'URL/비공개 전환',
    martJobs: 6,
    martHint: '재계산 포함',
    securityEvents: 2,
    securityHint: '권한 확인',
  },
  events,
}

export const handlers = [
  // :certificateId 는 mock에서 무시하고 동일 로그를 반환(BE 계약 확정 전).
  http.get('/api/admin/certificates/:certificateId/audit', () =>
    ok<AuditLogData>(overview),
  ),
]
