import { http, HttpResponse } from 'msw'
import type { StudentQuizListItem } from './types'

// 퀴즈 목록 mock — 기능 로컬(공유 handlers.ts에서 이동, 보강). 자동 수집 규약: `export const handlers`.
// 목록은 Figma 226:27 시안 재현(카테고리·문항수·D-day·기간). 응시/결과 핸들러는 공유 handlers.ts 유지.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 목록 카드에 필요 없는 계약 필드 기본값 헬퍼
function base(
  id: string,
  title: string,
  gradingMode: 'AUTO' | 'MANUAL' | 'MIXED',
  timeLimitMinutes: number,
  startsAt: string,
  endsAt: string,
) {
  return {
    id,
    cohortId: 'c1',
    title,
    gradingMode,
    startsAt,
    endsAt,
    timeLimitMinutes,
    maxAttempts: 2,
    shuffleQuestions: false,
  }
}

const mockQuizzes: StudentQuizListItem[] = [
  // ── 응시 가능 (4) ──
  {
    quiz: base(
      'qa1',
      'Spring Boot — JPA 영속성 컨텍스트 퀴즈',
      'AUTO',
      30,
      '2026-05-13T14:00:00Z',
      '2026-05-16T23:59:00Z',
    ),
    myAttemptCount: 0,
    state: 'available',
    category: 'BACKEND',
    questionCount: 15,
    dDay: 3,
    periodLabel: '05/13 14:00 — 05/16 23:59',
  },
  {
    quiz: base(
      'qa2',
      'JWT & 세션 단점 비교 분석',
      'AUTO',
      20,
      '2026-05-12T09:00:00Z',
      '2026-05-15T18:00:00Z',
    ),
    myAttemptCount: 0,
    state: 'available',
    category: 'BACKEND',
    questionCount: 10,
    dDay: 1,
    periodLabel: '05/12 09:00 — 05/15 18:00',
  },
  {
    quiz: base(
      'qa3',
      '도커 컨테이너 네트워킹 단답형',
      'MIXED',
      25,
      '2026-05-14T10:00:00Z',
      '2026-05-20T23:59:00Z',
    ),
    myAttemptCount: 0,
    state: 'available',
    category: 'DEVOPS',
    questionCount: 12,
    dDay: 6,
    periodLabel: '05/14 10:00 — 05/20 23:59',
  },
  {
    quiz: base(
      'qa4',
      'SQL 인덱스 정리 시나리오',
      'MANUAL',
      40,
      '2026-05-10T09:00:00Z',
      '2026-05-17T23:59:00Z',
    ),
    myAttemptCount: 0,
    state: 'available',
    category: 'DATABASE',
    questionCount: 8,
    dDay: 3,
    periodLabel: '05/10 09:00 — 05/17 23:59',
  },
  // ── 완료 (2) ──
  {
    quiz: base(
      'qc1',
      '운영체제 — 프로세스 / 스레드 종합',
      'AUTO',
      35,
      '2026-05-08T14:00:00Z',
      '2026-05-10T23:59:00Z',
    ),
    myAttemptCount: 1,
    state: 'completed',
    category: 'CS',
    questionCount: 14,
    dDay: null,
    periodLabel: '05/08 (목) 14:00 — 05/10 (토) 23:59',
    latestSubmission: {
      id: 'sc1',
      gradingStatus: 'finalized',
      totalScore: 92,
      submittedAt: '2026-05-10T20:11:00Z',
    },
  },
  {
    quiz: base(
      'qc2',
      'JPA 영속성 컨텍스트 · 3주차',
      'MIXED',
      45,
      '2026-05-11T09:00:00Z',
      '2026-05-13T23:59:00Z',
    ),
    myAttemptCount: 1,
    state: 'completed',
    category: 'BACKEND',
    questionCount: 20,
    dDay: null,
    periodLabel: '05/11 (월) 09:00 — 05/13 (수) 23:59',
    latestSubmission: {
      id: 'sc2',
      gradingStatus: 'finalized',
      totalScore: 82,
      submittedAt: '2026-05-13T14:32:00Z',
    },
  },
  // ── 채점 대기 (1) ──
  {
    quiz: base(
      'qp1',
      'CS 면접 단답 — 자료구조',
      'MANUAL',
      30,
      '2026-05-06T09:00:00Z',
      '2026-05-09T23:59:00Z',
    ),
    myAttemptCount: 1,
    state: 'pending_manual',
    category: 'CS',
    questionCount: 20,
    dDay: null,
    periodLabel: '05/06 (화) 09:00 — 05/09 (금) 23:59',
    latestSubmission: {
      id: 'sp1',
      gradingStatus: 'pending_manual',
      totalScore: 12,
      submittedAt: '2026-05-09T18:20:00Z',
    },
  },
  // ── 기간 종료 (2) ──
  {
    quiz: base(
      'qx1',
      'Kafka 메시지 흐름 사진 퀴즈',
      'AUTO',
      15,
      '2026-04-28T00:00:00Z',
      '2026-05-02T23:59:00Z',
    ),
    myAttemptCount: 0,
    state: 'closed',
    category: 'BACKEND',
    questionCount: 10,
    dDay: null,
    periodLabel: '04/28 (월) 00:00 — 05/02 (금) 23:59',
  },
  {
    quiz: base(
      'qx2',
      'HTTP 캐싱 전략 퀴즈',
      'AUTO',
      20,
      '2026-04-20T00:00:00Z',
      '2026-04-25T23:59:00Z',
    ),
    myAttemptCount: 0,
    state: 'closed',
    category: 'FRONTEND',
    questionCount: 12,
    dDay: null,
    periodLabel: '04/20 (월) 00:00 — 04/25 (토) 23:59',
  },
]

export const handlers = [
  http.get('/api/student/quizzes', () =>
    ok<StudentQuizListItem[]>(mockQuizzes),
  ),
]
