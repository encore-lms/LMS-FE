import { http, HttpResponse } from 'msw'
import type {
  InstructorChangeRequestsData,
  RecertificationsData,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// 변경된 내역 샘플 — 재인증 frame(2750:2202)의 접힘 카드 3종.
const curationChanges = [
  {
    id: 'diff-stack',
    label: '기술스택: React Query 추가',
    before: 'axios 단독 호출 + 수동 캐시',
    after: 'TanStack Query v5 도입 — 서버 상태 캐시·재시도 일원화',
  },
  {
    id: 'diff-artifact',
    label: '산출물: 최종 발표 PDF 교체',
    before: 'final-presentation-v1.pdf (5/18 업로드)',
    after: 'final-presentation-v2.pdf — 성능 비교 슬라이드 4장 추가',
  },
  {
    id: 'diff-minutes',
    label: '회의록: 5/21 회의록 요약 보강',
    before: '결정 사항 2줄 요약',
    after: '참석자·논의 배경·결정 근거 포함 전체 요약으로 보강',
  },
]

// ── 변경 제안 통합 검토 (Figma 2750:2070) ──
const changeRequests: InstructorChangeRequestsData = {
  items: [
    {
      id: 'cr-1',
      type: 'project',
      target: '추천 영상 큐레이션',
      requester: '김민준 PM',
      status: 'requested',
      certifierAbsent: false,
      changes: curationChanges,
    },
    {
      id: 'cr-2',
      type: 'troubleshooting',
      target: 'OOM 원인 분석',
      requester: '이서연',
      status: 'reviewing',
      certifierAbsent: true,
      changes: [
        {
          id: 'diff-oom-cause',
          label: '원인 분석: heap dump 근거 추가',
          before: '로그 기반 추정 (OutOfMemoryError 발생 시각)',
          after: 'heap dump 분석 — ThreadLocal 누수 객체 경로 첨부',
        },
        {
          id: 'diff-oom-fix',
          label: '해결 과정: 재발 방지 테스트 추가',
          before: '수동 재현 절차만 기록',
          after: '부하 테스트 시나리오 + 메모리 사용량 임계 알람 추가',
        },
      ],
    },
    {
      id: 'cr-3',
      type: 'project',
      target: 'LLM 상담 챗봇',
      requester: '박지우',
      status: 'requested',
      certifierAbsent: false,
      changes: [
        {
          id: 'diff-llm-metric',
          label: '성과 지표: 응답 정확도 재측정',
          before: '정확도 82% (5/10 평가셋)',
          after: '정확도 89% — 평가셋 200건 확장 후 재측정',
        },
      ],
    },
  ],
}

// ── 재인증 통합 검토 (Figma 2750:2202) ──
const recertifications: RecertificationsData = {
  items: [
    {
      id: 'rc-1',
      type: 'project',
      target: '추천 영상 큐레이션',
      requesterLabel: 'PM 김민준',
      summary: '수정 완료 요청',
      changes: curationChanges,
    },
    {
      id: 'rc-2',
      type: 'troubleshooting',
      target: 'OOM 원인 분석',
      requesterLabel: '이서연',
      summary: '수정 완료 요청',
      changes: [
        {
          id: 'diff-oom-recert',
          label: '해결 과정: 재발 방지 테스트 추가',
          before: '수동 재현 절차만 기록',
          after: '부하 테스트 시나리오 + 메모리 사용량 임계 알람 추가',
        },
      ],
    },
  ],
}

export const handlers = [
  http.get('/api/instructor/change-requests', () =>
    ok<InstructorChangeRequestsData>(changeRequests),
  ),
  http.get('/api/instructor/recertifications', () =>
    ok<RecertificationsData>(recertifications),
  ),
]
