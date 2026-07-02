import { http, HttpResponse, type RequestHandler } from 'msw'
import type { Role, CertReviewQueue, CertReviewDetail } from '@/shared/types'
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

// 개발용 교육 타입 흉내 — 로그인 ID에 'kdc'가 들어가면 K-디지털 기초역량훈련(온라인형),
// 그 외 수강생은 K-디지털 트레이닝(부트캠프형). 두 진입 화면을 모두 바로 테스트할 수 있다.
function trainingTypeFromEmail(email: string): 'KDT' | 'KDC' {
  return email.toLowerCase().includes('kdc') ? 'KDC' : 'KDT'
}

// 수강생 퀴즈 — 목록은 features/student/quiz/mocks.ts(기능 로컬)로 이동. 응시/결과만 여기 유지.

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
  http.get('/api/admin/certificates/reviews', () =>
    ok<CertReviewQueue>(certReviewQueue),
  ),

  http.get('/api/admin/certificates/reviews/:reviewId', ({ params }) =>
    ok<CertReviewDetail>({ ...certReviewDetail, id: String(params.reviewId) }),
  ),
]

// 로그인 mock — VITE_REAL_AUTH=true면 등록하지 않아 bypass → vite proxy → 실 auth-service(:8081).
// (learning-service가 수용하는 진짜 JWT를 발급받기 위함. 기본은 mock 유지해 dev 흐름 보존.)
const loginMockHandler = http.post('/api/auth/login', async ({ request }) => {
  const body = (await request.json()) as {
    userId?: string
    email?: string
    password: string
  }
  // BE 계약: 로그인 ID 필드는 userId(운영=이메일, 수강생=studentUuid). 구 email도 fallback.
  const loginId = body.userId ?? body.email ?? ''
  return HttpResponse.json({
    data: {
      token: 'mock-token',
      user: {
        id: 'mock-1',
        email: loginId,
        name: '테스트 사용자',
        role: roleFromEmail(loginId),
        trainingType: trainingTypeFromEmail(loginId),
      },
    },
  })
})

// 수강생 과정 기능 플래그 mock — VITE_REAL_AUTH=true면 bypass → 실 learning-service(/student/course-features).
// mock 모드에선 전부 노출(메뉴 풀). 관리자가 저장한 실제 토글 반영은 실 모드에서 동작.
const courseFeaturesMockHandler = http.get('/api/student/course-features', () =>
  HttpResponse.json({
    data: {
      courseId: null,
      courseTitle: null,
      features: {
        mileage: true,
        play: true,
      },
    },
  }),
)

export const handlers = [
  ...(import.meta.env.VITE_REAL_AUTH === 'true'
    ? []
    : [loginMockHandler, courseFeaturesMockHandler]),
  ...adminHandlers,
  ...featureHandlers,
]
