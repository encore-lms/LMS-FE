import { http, HttpResponse } from 'msw'
import type { CertTemplateOverview } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 증명서 템플릿 (Figma 1521:10895) ──
// 섹션별 공개/내부 필드 매핑 + 스냅샷 정책. (P0_24 BE 계약 확정 시 교체)
const overview: CertTemplateOverview = {
  summary: {
    version: 'v3.2',
    versionState: '공개중',
    publicFields: 18,
    internalFields: 9,
    snapshotLockStages: 5,
    policyWarnings: 2,
  },
  fields: [
    {
      id: 'profile',
      section: '프로필',
      publicField: '이름·과정·기수',
      internalField: 'userId',
      status: 'normal',
      action: 'edit',
    },
    {
      id: 'competency',
      section: '역량 요약',
      publicField: '6축 점수·요약',
      internalField: 'martScore',
      status: 'normal',
      action: 'edit',
    },
    {
      id: 'project',
      section: '프로젝트',
      publicField: '대표 프로젝트',
      internalField: 'auditTrail',
      status: 'warning',
      action: 'review',
    },
    {
      id: 'record',
      section: '기록실',
      publicField: '승인 기록',
      internalField: 'reviewMemo',
      status: 'normal',
      action: 'edit',
    },
    {
      id: 'reputation',
      section: '평판',
      publicField: '동료/멘토 요약',
      internalField: 'rawComment',
      status: 'warning',
      action: 'mask',
    },
  ],
  preview: {
    studentName: '김민준',
    cohortLabel: 'DA 4기',
    coreCompetency: '문제 해결 86 · 협업 91 · 성실성 94',
    representativeProject: 'WeatherAPI 기반 데이터 파이프라인',
  },
}

export const handlers = [
  http.get('/api/admin/certificate-template', () =>
    ok<CertTemplateOverview>(overview),
  ),
]
