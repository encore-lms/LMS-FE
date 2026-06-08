import { http, HttpResponse } from 'msw'
import type { CertSnapshot } from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

const PAYLOAD = JSON.stringify(
  {
    version: '2026.02',
    snapshotHash: 'sha256:a3f8…07e',
    publicToken: 'vfy_kp4q4r2nv0',
    issuedAt: '2026-02-14T10:00:00Z',
    student: '이서연',
    course: 'DA 5기',
    trainingHours: 480,
    attendance: 0.962,
    averageQuiz: 84.7,
    submission: 0.91,
    skills: [
      { k: '기술', v: 82 },
      { k: '책임감', v: 76 },
      { k: '소통', v: 88 },
      { k: '성장', v: 79 },
      { k: '팀워크', v: 84 },
      { k: '문제해결', v: 81 },
    ],
    evidence: [
      { type: 'project', title: 'LLM 추천 시스템 v0.3' },
      { type: 'troubleshooting', title: '#042 Airflow 운영 장애' },
      { type: 'record', blog: 12 },
    ],
    isPublic: false,
  },
  null,
  2,
)

const snapshot: CertSnapshot = {
  certificateId: 'cert_8b2a',
  student: { name: '이서연', certId: 'def-5678', cohort: 'DA 5기' },
  isPublic: false,
  issuedAt: '2026-02-14 10:00',
  publicToken: 'vfy_kp4q4r2nv0',
  metrics: {
    trainingHours: 480,
    attendance: 0.962,
    quizAvg: 84.7,
    submissionRate: 0.91,
    submissionRaw: '32/35건',
  },
  skills: [
    { key: '기술', score: 82, confirmed: true },
    { key: '책임감', score: 76, confirmed: true },
    { key: '소통', score: 88, confirmed: true },
    { key: '성장', score: 79, confirmed: true },
    { key: '팀워크', score: 84, confirmed: true },
    { key: '문제해결', score: 81, confirmed: true },
  ],
  skillAvg: 81.7,
  evidence: [
    { title: 'LLM 추천 시스템 v0.3', sub: '프로젝트 · 강사 승인' },
    { title: '#042 Airflow 운영 장애', sub: '트러블슈팅 · 강사 승인' },
    { title: '블로그 12편 일괄', sub: '기록실 · 매니저 승인' },
  ],
  payloadJson: PAYLOAD,
  verify: {
    url: 'verify.playdata.io/cert/vfy_kp4q4r2nv0',
    snapshotHash: 'sha256:a3f8…07e',
    verificationId: 'ver_2026Q2_512',
  },
}

export const handlers = [
  http.get('/api/admin/certificates/:certificateId/snapshot', ({ params }) =>
    ok<CertSnapshot>({
      ...snapshot,
      certificateId: String(params.certificateId),
    }),
  ),
]
