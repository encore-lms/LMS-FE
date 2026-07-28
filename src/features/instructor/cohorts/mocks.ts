import { http, HttpResponse } from 'msw'
import type {
  InstructorDashboardData,
  InstructorCohortsData,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── §1 강사 대시보드 (Figma 1268:7456) — 기수별 데이터(칩 선택 시 해당 기수만) ──
const dashboardCohorts = [
  { id: 'da-4', label: 'DA 4기 · 진행 중' },
  { id: 'fe-7', label: 'FE 7기 · 진행 중' },
]

const dashboardByCohort: Record<string, InstructorDashboardData> = {
  // 통합(전체) — 담당 전 기수 합산. 칩 '전체' 선택 시(기본).
  all: {
    instructorName: '박준석',
    cohortCount: 2,
    cohorts: dashboardCohorts,
    kpiGrading: {
      value: 14,
      hint: '수동 채점 9 · 자동 재검토 5',
      badge: '오늘 +3',
    },
    kpiProjects: { value: 3, hint: 'PM 인증 요청 · D+2 1건' },
    kpiSupplements: {
      value: 2,
      hint: '학생 응답 대기 · D+5 1건',
      badge: '긴급',
    },
    priorities: [
      {
        id: 'pri-1',
        type: 'supplement',
        title: '점수 재검토 보완 응답',
        subtitle: '박지훈 · FE 7기',
        dday: 'D+5',
        urgent: true,
        actionLabel: '확인',
        to: '/instructor/cohorts/fe-7/education',
      },
      {
        id: 'pri-2',
        type: 'manual_grading',
        title: '알고리즘 기초 퀴즈 #3 · 5문항 채점 대기',
        subtitle: '김민준 · DA 4기',
        dday: 'D+1',
        urgent: false,
        actionLabel: '채점 시작',
        to: '/instructor/quizzes/quiz-algo-3/submissions',
      },
      {
        id: 'pri-3',
        type: 'project_cert',
        title: '추천 영상 큐레이션 PM 인증 요청',
        subtitle: 'DA 4팀 (3명)',
        dday: 'D+2',
        urgent: false,
        actionLabel: '검토',
        to: '/instructor/projects/review',
      },
      {
        id: 'pri-5',
        type: 'ts_review',
        title: 'OOM 원인 분석 사례 · 강사 승인 대기',
        subtitle: '박지훈 · FE 7기',
        dday: 'D+1',
        urgent: false,
        actionLabel: '검토',
        to: '/instructor/troubleshooting/review',
      },
      {
        id: 'pri-6',
        type: 'manual_grading',
        title: '데이터 분석 퀴즈 #2 · 3문항 채점 대기',
        subtitle: '정도윤 · DA 4기',
        dday: 'D+1',
        urgent: false,
        actionLabel: '채점 시작',
        to: '/instructor/quizzes/quiz-algo-3/submissions',
      },
    ],
    shortcuts: {
      quizzes: { badge: 14, hint: '채점 대기 14' },
      students: { hint: 'DA 4기 · FE 7기 통합' },
      reviews: {
        badge: 12,
        hint: '기록 7 + 프로젝트 3 + 트러블슈팅 2',
      },
    },
  },
  'da-4': {
    instructorName: '박준석',
    cohortCount: 2,
    cohorts: dashboardCohorts,
    kpiGrading: {
      value: 9,
      hint: '수동 채점 6 · 자동 재검토 3',
      badge: '오늘 +3',
    },
    kpiProjects: { value: 2, hint: 'PM 인증 요청 · D+2 1건' },
    kpiSupplements: { value: 1, hint: '학생 응답 대기 1건' },
    priorities: [
      {
        id: 'pri-2',
        type: 'manual_grading',
        title: '알고리즘 기초 퀴즈 #3 · 5문항 채점 대기',
        subtitle: '김민준 · DA 4기',
        dday: 'D+1',
        urgent: false,
        actionLabel: '채점 시작',
        to: '/instructor/quizzes/quiz-algo-3/submissions',
      },
      {
        id: 'pri-3',
        type: 'project_cert',
        title: '추천 영상 큐레이션 PM 인증 요청',
        subtitle: 'DA 4팀 (3명)',
        dday: 'D+2',
        urgent: false,
        actionLabel: '검토',
        to: '/instructor/projects/review',
      },
      {
        id: 'pri-6',
        type: 'manual_grading',
        title: '데이터 분석 퀴즈 #2 · 3문항 채점 대기',
        subtitle: '정도윤 · DA 4기',
        dday: 'D+1',
        urgent: false,
        actionLabel: '채점 시작',
        to: '/instructor/quizzes/quiz-algo-3/submissions',
      },
    ],
    shortcuts: {
      quizzes: { badge: 9, hint: '채점 대기 9' },
      students: { hint: 'DA 4기 24명' },
      reviews: {
        badge: 7,
        hint: '기록 4 + 프로젝트 2 + 트러블슈팅 1',
      },
    },
  },
  'fe-7': {
    instructorName: '박준석',
    cohortCount: 2,
    cohorts: dashboardCohorts,
    kpiGrading: { value: 5, hint: '수동 채점 3 · 자동 재검토 2' },
    kpiProjects: { value: 1, hint: 'PM 인증 요청 1건' },
    kpiSupplements: {
      value: 1,
      hint: '학생 응답 대기 · D+5 1건',
      badge: '긴급',
    },
    priorities: [
      {
        id: 'pri-1',
        type: 'supplement',
        title: '점수 재검토 보완 응답',
        subtitle: '박지훈 · FE 7기',
        dday: 'D+5',
        urgent: true,
        actionLabel: '확인',
        to: '/instructor/cohorts/fe-7/education',
      },
      {
        id: 'pri-5',
        type: 'ts_review',
        title: 'OOM 원인 분석 사례 · 강사 승인 대기',
        subtitle: '박지훈 · FE 7기',
        dday: 'D+1',
        urgent: false,
        actionLabel: '검토',
        to: '/instructor/troubleshooting/review',
      },
    ],
    shortcuts: {
      quizzes: { badge: 5, hint: '채점 대기 5' },
      students: { hint: 'FE 7기 18명' },
      reviews: {
        badge: 5,
        hint: '기록 3 + 프로젝트 1 + 트러블슈팅 1',
      },
    },
  },
}

// ── §2 담당 과정/기수 (Figma 1324:9636) ──
const cohorts: InstructorCohortsData = {
  total: 5,
  operating: 2,
  upcoming: 0,
  ended: 3,
  summary: {
    operatingCourses: { value: 2, hint: 'DA 4기 · FE 7기' },
    students: { value: 42, hint: 'DA 24 + FE 18 · 위험 3' },
    gradingPending: { value: 14, hint: 'DA 9 + FE 5 · 오늘 +3' },
    reviewPending: { value: 12, hint: '기록 7 + 프로젝트 3 + 트러블 2' },
  },
  rows: [
    {
      id: 'da-4',
      name: 'DA 4기',
      subtitle: '데이터 분석 · 4회차',
      period: '2026.03.01 ~ 2026.05.31',
      dday: 'D-12',
      role: 'lead',
      students: 24,
      riskCount: 2,
      evalSummary: '미응시 3 · 제출 18',
      evalPending: '채점 대기 9',
      reviewSummary: '기록 4 · 프로젝트 2 · 트러블 1',
      reviewPending: '대기 7건',
      status: 'operating',
    },
    {
      id: 'fe-7',
      name: 'FE 7기',
      subtitle: '프론트엔드 · 7회차',
      period: '2026.04.01 ~ 2026.06.30',
      dday: 'D-42',
      role: 'assist',
      students: 18,
      riskCount: 1,
      evalSummary: '미응시 5 · 제출 12',
      evalPending: '채점 대기 5',
      reviewSummary: '기록 3 · 프로젝트 1 · 트러블 1',
      reviewPending: '대기 5건',
      status: 'operating',
    },
    {
      id: 'da-3',
      name: 'DA 3기',
      subtitle: '데이터 분석 · 3회차',
      period: '2025.09.01 ~ 2025.12.20',
      dday: '종료',
      role: 'lead',
      students: 22,
      riskCount: 0,
      evalSummary: '미응시 0 · 제출 22',
      evalPending: '채점 완료',
      reviewSummary: '기록 0 · 프로젝트 0 · 트러블 0',
      reviewPending: '대기 0건',
      status: 'ended',
    },
    {
      id: 'fe-6',
      name: 'FE 6기',
      subtitle: '프론트엔드 · 6회차',
      period: '2025.10.01 ~ 2026.01.15',
      dday: '종료',
      role: 'assist',
      students: 20,
      riskCount: 0,
      evalSummary: '미응시 0 · 제출 20',
      evalPending: '채점 완료',
      reviewSummary: '기록 0 · 프로젝트 0 · 트러블 0',
      reviewPending: '대기 0건',
      status: 'ended',
    },
    {
      id: 'da-2',
      name: 'DA 2기',
      subtitle: '데이터 분석 · 2회차',
      period: '2025.03.01 ~ 2025.06.30',
      dday: '종료',
      role: 'lead',
      students: 21,
      riskCount: 0,
      evalSummary: '미응시 0 · 제출 21',
      evalPending: '채점 완료',
      reviewSummary: '기록 0 · 프로젝트 0 · 트러블 0',
      reviewPending: '대기 0건',
      status: 'ended',
    },
  ],
}

// 담당 기수 없음 시연용 변형 (Figma 2750:1974) — instructor-new@* 계정으로 로그인 시 반환.
const dashboardNoCohort: InstructorDashboardData = {
  ...dashboardByCohort['da-4'],
  instructorName: '신규',
  cohortCount: 0,
  cohorts: [],
  priorities: [],
}

// persist된 auth(localStorage 'lms-auth')에서 이메일을 읽어 mock 분기.
// MSW 핸들러는 앱 컨텍스트에서 실행되므로 localStorage 접근 가능.
function isNewInstructor() {
  try {
    const raw = localStorage.getItem('lms-auth')
    if (!raw) return false
    const email: string = JSON.parse(raw)?.state?.user?.email ?? ''
    return email.startsWith('instructor-new')
  } catch {
    return false
  }
}

export const handlers = [
  http.get('/api/instructor/dashboard', ({ request }) => {
    if (isNewInstructor()) return ok<InstructorDashboardData>(dashboardNoCohort)
    const cohortId = new URL(request.url).searchParams.get('cohortId')
    return ok<InstructorDashboardData>(
      (cohortId && dashboardByCohort[cohortId]) || dashboardByCohort['all'],
    )
  }),
  http.get('/api/instructor/cohorts', () => ok<InstructorCohortsData>(cohorts)),
]
