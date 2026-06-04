import { http, HttpResponse } from 'msw'
import type { StudentDashboardSummary, DashboardAttendanceDay } from './types'

// 대시보드 mock — 기능 로컬. mocks/handlers.ts에서 import 후 spread로 등록(공유 최소 터치).
// 데이터는 Figma 시안을 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const calendarDays: DashboardAttendanceDay[] = [
  { date: '2026-05-01', status: 'PRESENT' },
  { date: '2026-05-04', status: 'LATE' },
  { date: '2026-05-05', status: 'PRESENT' },
  { date: '2026-05-06', status: 'ABSENT' },
  { date: '2026-05-07', status: 'PRESENT' },
  { date: '2026-05-08', status: 'OUTING' },
  { date: '2026-05-11', status: 'EARLY_LEAVE' },
  { date: '2026-05-12', status: 'LATE' },
  { date: '2026-05-13', status: 'PRESENT' },
  { date: '2026-05-14', status: 'PRESENT' },
]

const mockDashboard: StudentDashboardSummary = {
  hero: {
    studentName: '김수강',
    courseName: '백엔드 부트캠프',
    cohortName: '5기',
    totalWeeks: 24,
    currentWeek: 16,
    progressPct: 67,
  },
  kpis: {
    attendanceRate: 92,
    pendingQuizzes: 2,
    pendingRecords: 3,
    changeRequests: 0,
  },
  todos: [
    {
      id: 't1',
      category: '퀴즈',
      title: 'Spring Security 기초 퀴즈 응시',
      due: '오늘',
      to: '/student/quizzes',
    },
    {
      id: 't2',
      category: '블로그',
      title: '블로그 1주차 회고 작성',
      due: 'D-2',
      to: '/student/records',
    },
    {
      id: 't3',
      category: '과제',
      title: 'WeatherAPI 분석 과제 제출',
      due: 'D-4',
      to: '/student/course/assignments',
    },
  ],
  deadlineQuizzes: [
    {
      id: 'q1',
      category: 'BACKEND',
      title: 'Spring Security 기초',
      due: 'D-1',
      to: '/student/quizzes',
    },
    {
      id: 'q2',
      category: 'BACKEND',
      title: 'REST API 설계 패턴',
      due: 'D-3',
      to: '/student/quizzes',
    },
    {
      id: 'q3',
      category: 'DATABASE',
      title: 'JPA 영속성 컨텍스트',
      due: 'D-5',
      to: '/student/quizzes',
    },
  ],
  mentoring: { waiting: 0, reserved: 1, completed: 1, recent: 3 },
  attendance: {
    calendar: { year: 2026, month: 5, days: calendarDays },
    cumulative: {
      presentDays: 73,
      lateCount: 2,
      earlyLeaveCount: 1,
      outingCount: 0,
      absentCount: 1,
    },
    trend: [
      { week: '9주', rate: 86 },
      { week: '10주', rate: 90 },
      { week: '11주', rate: 88 },
      { week: '12주', rate: 94 },
      { week: '13주', rate: 92 },
      { week: '14주', rate: 96 },
      { week: '15주', rate: 90 },
      { week: '16주', rate: 92 },
    ],
  },
  notices: [
    {
      id: 'n1',
      tag: '시스템',
      title: '시스템 점검 안내 (09:00-10:00)',
      date: '2026-05-18',
    },
    {
      id: 'n2',
      tag: '공지',
      title: '더글로 프로젝트 발표 일정 안내',
      date: '2026-05-16',
    },
    {
      id: 'n3',
      tag: '공지',
      title: '4주차 과제 제출 안내',
      date: '2026-05-14',
    },
  ],
  notifications: [
    { id: 'a1', title: '블로그 2주차 검토 완료', date: '2026-05-18' },
    {
      id: 'a2',
      title: '동기수 평판(Reputation) 작성 요청',
      date: '2026-05-17',
    },
    {
      id: 'a3',
      title: '프로젝트 카드 인증 승인 — WeatherAPI 분석',
      date: '2026-05-16',
    },
    { id: 'a4', title: '평판 작성 요청 도착', date: '2026-05-15' },
  ],
  projects: [
    {
      id: 'p1',
      title: 'WeatherAPI 분석 서비스',
      members: 4,
      certified: true,
      to: '/student/projects',
    },
    {
      id: 'p2',
      title: 'AI 헬스 도우미 챗봇',
      members: 3,
      certified: false,
      to: '/student/projects',
    },
    {
      id: 'p3',
      title: '주말 모니터링 PoC',
      members: 2,
      certified: false,
      to: '/student/projects',
    },
  ],
  troubleshooting: [
    {
      id: 'ts1',
      tag: 'BACKEND',
      title: 'JWT 검증 오류 — 만료 토큰 처리',
      date: '2026-05-18',
      to: '/student/troubleshooting',
    },
    {
      id: 'ts2',
      tag: 'DEVOPS',
      title: 'Docker Compose 네트워크 충돌 해결',
      date: '2026-05-16',
      to: '/student/troubleshooting',
    },
    {
      id: 'ts3',
      tag: 'BACKEND',
      title: 'Spring Batch 청크 처리 성능 개선',
      date: '2026-05-14',
      to: '/student/troubleshooting',
    },
  ],
}

export const dashboardHandlers = [
  http.get('/api/student/dashboard', () =>
    ok<StudentDashboardSummary>(mockDashboard),
  ),
]
