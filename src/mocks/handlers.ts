import { http, HttpResponse, type RequestHandler } from 'msw'
import type {
  Role,
  QuizQuestion,
  QuizResult,
  QuizAttempt,
  AdminDashboardSummary,
  CertReviewQueue,
  CertReviewDetail,
} from '@/shared/types'
// 기능별 mock 자동 수집 — features/**/mocks.ts 가 `export const handlers`를 내보내면 자동 등록된다.
// 새 화면이 늘어도 이 파일을 수정하지 않으므로 머지 충돌이 나지 않는다.
const featureMockModules = import.meta.glob<{ handlers?: RequestHandler[] }>(
  '../features/**/mocks.ts',
  { eager: true },
)
const featureHandlers = Object.values(featureMockModules).flatMap(
  (m) => m.handlers ?? [],
)

// {data} 래핑 헬퍼 — mock 응답은 ApiResponse<T>(= {data:T}) 형태를 지킨다.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 개발용 mock 로그인. 이메일 prefix로 역할을 흉내내 각 shell을 바로 테스트할 수 있다.
//   admin@…→운영(MANAGER) / instructor@…→강사 / mentor@…→멘토 / 그 외→수강생
function roleFromEmail(email: string): Role {
  if (email.startsWith('admin')) return 'MANAGER'
  if (email.startsWith('instructor')) return 'INSTRUCTOR'
  if (email.startsWith('mentor')) return 'MENTOR'
  return 'STUDENT'
}

// 수강생 퀴즈 — 목록은 features/student/quiz/mocks.ts(기능 로컬)로 이동. 응시/결과만 여기 유지.
const quizHandlers = [
  http.get('/api/student/quizzes/:quizId/questions', ({ params }) =>
    ok<QuizQuestion[]>([
      {
        id: 'qq1',
        quizId: String(params.quizId),
        categoryId: 'react',
        type: 'multiple_choice',
        gradingType: 'AUTO',
        prompt: 'useEffect 의존성 배열이 빈 배열일 때 effect 실행 시점은?',
        maxPoints: 10,
        orderNo: 1,
        choices: [
          { id: 'a', label: '매 렌더마다 실행' },
          { id: 'b', label: '마운트 시 1회' },
        ],
      },
    ]),
  ),

  http.post('/api/student/quizzes/:quizId/attempts', ({ params }) =>
    ok<QuizAttempt>({
      id: 'att1',
      quizId: String(params.quizId),
      attemptNo: 1,
      status: 'in_progress',
      startedAt: '2026-06-03T00:00:00Z',
      expiresAt: '2026-06-03T00:30:00Z',
    }),
  ),

  http.get('/api/student/quizzes/:quizId/result', ({ params }) =>
    ok<QuizResult>({
      submission: {
        id: 's3',
        quizId: String(params.quizId),
        attemptNo: 1,
        submittedAt: '2026-05-05T09:00:00Z',
        gradingStatus: 'finalized',
        totalScore: 18,
      },
      answers: [
        {
          questionId: 'qq1',
          prompt: 'useEffect 의존성 배열이 빈 배열일 때 effect 실행 시점은?',
          categoryId: 'react',
          maxPoints: 10,
          answer: { kind: 'multiple_choice', selectedChoiceId: 'b' },
          correctAnswerKey: 'b',
          earnedPoints: 10,
          isCorrect: true,
        },
      ],
    }),
  ),
]

// 인증 검토 큐(/admin/certificates/reviews) — Flow 11 C1.
const certReviewQueue: CertReviewQueue = {
  total: 167,
  byStatus: {
    requested: 24,
    reviewing: 8,
    changes_requested: 3,
    certified: 132,
  },
  unassigned: 6,
  riskFlagged: 5,
  myAssigned: 8,
  avgHours: 4.2,
  items: [
    {
      id: 'rv1',
      student: {
        name: '김민준',
        studentNo: '2024-AIB3-0027',
        cohort: 'AI 캠프 22기',
      },
      status: 'changes_requested',
      requestedAt: '05-17 14:32',
      assignee: '황설현',
      missingCount: 0,
      riskFlags: ['개인정보 위험', '점수 재검토'],
      latestReason: '이력서 연락처 마스킹 누락',
    },
    {
      id: 'rv2',
      student: {
        name: '이서연',
        studentNo: '2024-AIB3-0028',
        cohort: 'AI 캠프 22기',
      },
      status: 'reviewing',
      requestedAt: '05-16 09:11',
      assignee: '황설현',
      missingCount: 2,
      riskFlags: ['결측'],
      latestReason: '평판 항목 2개 미수집',
    },
    {
      id: 'rv3',
      student: {
        name: '박지훈',
        studentNo: '2024-AIB3-0029',
        cohort: 'DA 5기',
      },
      status: 'changes_requested',
      requestedAt: '05-15 17:45',
      assignee: '황설현',
      missingCount: 0,
      riskFlags: ['점수 재검토', '미승인 산출물'],
      latestReason: '프로젝트 산출물 강사 미승인 1건',
    },
    {
      id: 'rv4',
      student: {
        name: '최유진',
        studentNo: '2024-AIB3-0030',
        cohort: 'AI 캠프 22기',
      },
      status: 'requested',
      requestedAt: '05-19 08:42',
      assignee: null,
      missingCount: 0,
      riskFlags: [],
      latestReason: '없음',
    },
    {
      id: 'rv5',
      student: { name: '정하늘', studentNo: '2024-DA5-0014', cohort: 'DA 5기' },
      status: 'requested',
      requestedAt: '05-19 09:12',
      assignee: null,
      missingCount: 1,
      riskFlags: ['결측'],
      latestReason: '자격증 인증서 미첨부',
    },
    {
      id: 'rv6',
      student: {
        name: '한지호',
        studentNo: '2024-AIB3-0032',
        cohort: 'AI 캠프 22기',
      },
      status: 'reviewing',
      requestedAt: '05-18 16:30',
      assignee: '이매니저',
      missingCount: 0,
      riskFlags: [],
      latestReason: '없음',
    },
  ],
}

// 인증 검토 상세(/admin/certificates/reviews/:reviewId) — Flow 11 C2.
const certReviewDetail: CertReviewDetail = {
  id: 'rev_8b2a',
  student: { name: '이서연', certId: 'def-5678', cohort: 'DA 5기' },
  status: 'reviewing',
  assignee: '황설현',
  requestedAt: '2026-05-16 09:11',
  martStale: true,
  martLastRefreshed: '2026-05-15 23:00',
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
  payloadPreview:
    '{"student":"이서연","course":"DA 5기","trainingHours":480,"attendance":0.962,"averageQuiz":84.7,"submission":0.91,"skills":[{"k":"기술","v":82,"status":"confirmed"}, …]}',
  approvalChecks: [
    {
      key: 'profile',
      label: '프로필',
      detail: '이름·과정·필수 URL 오류 없음',
      pass: true,
    },
    {
      key: 'metric',
      label: '핵심 지표',
      detail: '교육시간·출석률·시험평균 산정 가능',
      pass: true,
    },
    {
      key: 'skill',
      label: '6축 점수',
      detail: 'SkillScore.status = confirmed (6/6)',
      pass: true,
    },
    {
      key: 'evidence',
      label: '대표 근거',
      detail: '프로젝트 1 · 트러블슈팅 1 · 기록실 12',
      pass: true,
    },
    {
      key: 'mart',
      label: '원천 데이터 최신성',
      detail: '인증 요청 이후 미갱신 · 재계산 필요',
      pass: false,
    },
    {
      key: 'privacy',
      label: '개인정보',
      detail: '공개 payload에 민감정보 없음',
      pass: true,
    },
  ],
  riskFlags: [
    { label: '결측', detail: '평판 항목 2개 미수집', count: 2 },
    { label: '개인정보 위험', detail: '공개 payload 안전', count: 0 },
    { label: '점수 재검토', detail: 'SkillScore 재검토 요청 없음', count: 0 },
  ],
  scoreEvidence: [
    { skill: '기술 82점', basis: '프로젝트 v0.3 산출물 + 강사 코멘트 3건' },
    { skill: '책임감 76점', basis: '동료 평판 5건 평균 + 회의록 기여 12건' },
    {
      skill: '소통 88점',
      basis: 'PR 리뷰 코멘트 28건 + 멘토 평가 · 원천 데이터 변경',
    },
    { skill: '성장 79점', basis: '이전 기수 대비 +12점 · 트러블슈팅 14건' },
  ],
  artifactApprovals: [
    {
      title: '프로젝트 v0.3 (LLM 추천)',
      by: '강사 김지훈',
      status: 'approved',
    },
    {
      title: '트러블슈팅 #042 (Airflow)',
      by: '강사 박지영',
      status: 'approved',
    },
    { title: '블로그 12편 일괄', by: '매니저 황설현', status: 'approved' },
    { title: '외부 자격증 OPIc IH', by: '외부 검증', status: 'unverified' },
  ],
  auditLog: [
    { at: '05-19 10:24', actor: '황설현', action: '검토 시작' },
    {
      at: '05-18 16:08',
      actor: '시스템',
      action: '마트 갱신 실패 — 출결 원본 누락',
    },
    {
      at: '05-17 11:42',
      actor: '황설현',
      action: '이전 인증 요청 보완 — 평판 항목 보강',
    },
    {
      at: '05-16 09:11',
      actor: '이서연',
      action: '인증 요청 (certification_requested)',
    },
  ],
}

// 운영(admin) — 대시보드 요약(v2)·인증 검토 큐·상세. 나머지 운영 화면은 후속 PR에서 소비.
const adminHandlers = [
  http.get('/api/admin/dashboard', () =>
    ok<AdminDashboardSummary>({
      hero: {
        status: { level: 'normal', label: '운영 정상' },
        riskCount: 3,
        martUpdatedAt: '09:20',
        martNextAt: '09:50',
        todayPending: { value: 45, deltaLabel: '어제 대비 +6' },
        todayDone: { value: 12, avgLabel: '평균 처리 8분' },
      },
      kpis: [
        {
          key: 'request',
          label: '인증 요청',
          value: '18',
          delta: '+3',
          hint: '보완 요청 4건 포함',
          icon: 'request',
        },
        {
          key: 'reviewing',
          label: '검토 중',
          value: '12',
          delta: '—',
          hint: '강사 미확인 2건',
          icon: 'reviewing',
        },
        {
          key: 'changes',
          label: '보완 요청',
          value: '7',
          delta: '+1',
          hint: 'HRD 불일치 3건',
          icon: 'changes',
        },
        {
          key: 'certified',
          label: '인증 완료',
          value: '1,243',
          delta: '−4',
          hint: '누적 마지막 60일',
          icon: 'certified',
        },
        {
          key: 'mart',
          label: '마트 오류',
          value: '2',
          delta: '+2',
          hint: '재계산 필요',
          icon: 'mart',
        },
      ],
      queue: [
        {
          id: 'q1',
          priority: 'P0',
          type: '출결 이상',
          target: 'AI 백엔드 3기 김민준',
          status: 'HRD 퇴실 누락',
          due: '오늘',
          action: { label: '확인', to: '/admin/students' },
        },
        {
          id: 'q2',
          priority: 'P0',
          type: '마트 오류',
          target: '재계산 큐 — 인증 마트',
          status: '원본 동기화 실패',
          due: '오늘',
          action: { label: '재계산', to: '/admin/certificates/reviews' },
        },
        {
          id: 'q3',
          priority: 'P1',
          type: '기록실',
          target: 'Airflow 장애 회고 (블로그)',
          status: '승인 대기',
          due: '오늘',
          action: { label: '검토', to: '/admin/records/review' },
        },
        {
          id: 'q4',
          priority: 'P1',
          type: '마일리지',
          target: '상품권 구매 요청',
          status: '결제 확인',
          due: '오늘',
          action: { label: '처리', to: '/admin/mileage' },
        },
        {
          id: 'q5',
          priority: 'P2',
          type: '퀴즈',
          target: 'SQL 조인 퀴즈',
          status: '채점 예외',
          due: 'D-1',
          action: { label: '재채점', to: '/admin/quizzes' },
        },
        {
          id: 'q6',
          priority: 'P2',
          type: '인증',
          target: 'WeatherAPI 프로젝트',
          status: '보완 재제출',
          due: 'D-2',
          action: { label: '상세', to: '/admin/certificates/reviews' },
        },
      ],
      queueSummary: { total: 6, p0: 2, p1: 2, p2: 2 },
      risks: [
        {
          title: 'HRD 원본 수정 불가',
          desc: '동기화 값은 읽기 전용, 정정은 사유와 증빙을 남김',
        },
        {
          title: '공가 잔여일 부족',
          desc: '출결 폼 승인 시 잔여 공가 자동 차감',
        },
        { title: '강사 확인 지연', desc: '기록실 승인 24시간 초과 2건' },
      ],
      shortcuts: [
        {
          key: 'review',
          title: '인증 검토 큐',
          desc: 'P0 2건 처리 대기',
          to: '/admin/certificates/reviews',
          icon: 'review',
        },
        {
          key: 'accounts',
          title: '사용자·권한',
          desc: '계정·역할·기수 관리',
          to: '/admin/settings/accounts',
          icon: 'accounts',
        },
        {
          key: 'csv',
          title: 'CSV 매핑',
          desc: '인입 매핑 검사·재시도',
          to: '/admin/csv-mapping',
          icon: 'csv',
        },
        {
          key: 'reputation',
          title: '평판 관리',
          desc: '5축 평판 최근 7일 12건',
          to: '/admin/reputation',
          icon: 'reputation',
        },
        {
          key: 'quarantine',
          title: '인입 격리 큐',
          desc: '오류 1건 보류',
          to: '/admin/ingestion/quarantine',
          icon: 'quarantine',
        },
      ],
      sync: [
        { name: 'HRD-Net 수강생', at: '05-19 09:10', status: 'normal' },
        { name: '출결 원본', at: '05-19 09:05', status: 'caution' },
        { name: '마일리지 정산', at: '05-18 23:00', status: 'normal' },
        { name: '인증 스냅샷', at: '05-19 08:40', status: 'normal' },
      ],
      decisionLog: [
        {
          at: '09:20',
          text: '출결 이상 2건을 HRD 재동기화 후 수동 확인으로 전환',
        },
        {
          at: '09:05',
          text: '기록실 승인 대기 중 강사 확인 필요 2건 담당자 배정',
        },
        { at: '08:50', text: '퀴즈 채점 예외 3건을 자동 재채점 큐로 이동' },
        {
          at: '08:30',
          text: '인입 격리 큐 1건 — 마일리지 일자 오류, 재시도 예약',
        },
      ],
    }),
  ),

  http.get('/api/admin/certificates/reviews', () =>
    ok<CertReviewQueue>(certReviewQueue),
  ),

  http.get('/api/admin/certificates/reviews/:reviewId', ({ params }) =>
    ok<CertReviewDetail>({ ...certReviewDetail, id: String(params.reviewId) }),
  ),
]

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const email = body.email ?? ''
    return HttpResponse.json({
      data: {
        token: 'mock-token',
        user: {
          id: 'mock-1',
          email,
          name: '테스트 사용자',
          role: roleFromEmail(email),
        },
      },
    })
  }),
  ...quizHandlers,
  ...adminHandlers,
  ...featureHandlers,
]
