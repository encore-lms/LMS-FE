import { http, HttpResponse } from 'msw'
import type { ReputationOverview, ReputationStudent } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 수강생별 평판 수집 현황 (Figma 1193:6267) ──
const students: ReputationStudent[] = [
  {
    id: 'stu-1',
    name: '김민준',
    uuid: 'abc-1234',
    endorsementStatus: 'collected',
    endorsementBy: '김지훈 강사',
    mentorEvalStatus: 'recommended',
    mentorBy: '김효원',
    peerCount: 6,
    peerTotal: 6,
    pushTargets: [],
  },
  {
    id: 'stu-2',
    name: '이서연',
    uuid: 'def-5678',
    endorsementStatus: 'collected',
    endorsementBy: '박지영 강사',
    mentorEvalStatus: 'not_recommended',
    mentorBy: '이지훈',
    peerCount: 5,
    peerTotal: 6,
    pushTargets: ['peer'],
  },
  {
    id: 'stu-3',
    name: '박지훈',
    uuid: 'ghi-9012',
    endorsementStatus: 'not_collected',
    endorsementBy: '-',
    mentorEvalStatus: 'pending',
    mentorBy: '김효원',
    peerCount: 3,
    peerTotal: 6,
    pushTargets: ['instructor', 'mentor', 'peer'],
  },
  {
    id: 'stu-4',
    name: '최유진',
    uuid: 'jkl-3456',
    endorsementStatus: 'requesting',
    endorsementBy: '김지훈 강사 · D-2',
    mentorEvalStatus: 'not_eligible',
    mentorBy: '-',
    peerCount: 6,
    peerTotal: 6,
    pushTargets: ['instructor'],
  },
  {
    id: 'stu-5',
    name: '정하늘',
    uuid: 'mno-7890',
    endorsementStatus: 'collected',
    endorsementBy: '이지수 강사',
    mentorEvalStatus: 'in_progress',
    mentorBy: '박멘토',
    peerCount: 4,
    peerTotal: 6,
    pushTargets: ['peer'],
  },
]

const overview: ReputationOverview = {
  summary: {
    students: 121,
    cohortLabel: 'AI 캠프 22기',
    endorsements: 94,
    endorsementsHint: '수집됨 · 77.7%',
    mentorEval: '12 / 20',
    mentorEvalHint: 'N시간 완료 팀 한정',
    peerAxes: 612,
    peerAxesHint: '평균 5.05 · 6명',
    missingStudents: 38,
  },
  students,
  pushFlows: [
    {
      id: 'instructor',
      label: '강사 추천서',
      route: '/instructor/endorsements',
    },
    {
      id: 'mentor-eval',
      label: '멘토 평가',
      route: '/mentor/teams/:teamId/evaluation',
    },
    {
      id: 'mentor-rec',
      label: '멘토 추천',
      route: '/mentor/teams/:teamId/recommendation',
    },
    { id: 'peer', label: '프로젝트 상호평가' },
  ],
}

export const handlers = [
  http.get('/api/admin/reputation', () => ok<ReputationOverview>(overview)),
]
