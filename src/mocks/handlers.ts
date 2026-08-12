import { http, HttpResponse, type RequestHandler } from 'msw'
import type { Role } from '@/shared/types'
// 기능별 mock 자동 수집 — features/**/mocks.ts 가 `export const handlers`를 내보내면 자동 등록된다.
// 새 화면이 늘어도 이 파일을 수정하지 않으므로 머지 충돌이 나지 않는다.
const featureMockModules = import.meta.glob<{ handlers?: RequestHandler[] }>(
  '../features/**/mocks.ts',
  { eager: true },
)
const featureHandlers = Object.values(featureMockModules).flatMap(
  (m) => m.handlers ?? [],
)

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
  ...featureHandlers,
]
