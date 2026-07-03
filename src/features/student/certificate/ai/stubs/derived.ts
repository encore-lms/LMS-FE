// 파생 데이터 stub (개발용) — 서버 계산 결과의 예시.
// 나중에 서버가 CSV→계산으로 산출. 지금은 이 mock으로 계약 검증.

import type { StudentDerived } from '../types'

export const DERIVED_STUBS: Record<string, StudentDerived> = {
  'stu-001': {
    studentId: 'stu-001',
    sixAxis: {
      기술: 86,
      성장: 78,
      팀워크: 82,
      책임감: 90,
      소통: 74,
      문제해결: 88,
    },
    percentile: { 기술: 92, 문제해결: 89, 책임감: 95 },
    grade: 'A',
    peerAgg: { 협업: 84, 소통: 74, 책임감: 90, 문제해결: 88, 기술기여: 86 },
    achieveDist: {
      백엔드: 91,
      자료구조: 82,
      데이터베이스: 88,
      네트워크: 76,
      CS: 80,
    },
    growthTrend: { slope: 1.4, normalized: 78 },
    problem3: { 데이터처리: 70, 모델튜닝: 40, 인프라배포: 85 },
    domainWeight: { 커머스: 0.5, 핀테크: 0.3, 기타: 0.2 },
    cross: {
      tsCategoryDist: { DB: 3, 성능: 5, '배포·인프라': 4, '네트워크·API': 2 },
      projectStackFreq: { Java: 4, Spring: 4, JPA: 3, Redis: 2, Docker: 2 },
      achieveBySubjectTime: [
        { subject: 'Java/Spring 기본', score: 84, at: '2026-03-10' },
        { subject: '데이터베이스', score: 88, at: '2026-04-02' },
        { subject: '클라우드', score: 90, at: '2026-04-28' },
      ],
      tsDiversity: 4,
      tsDaysTrend: -0.6,
    },
  },
}
