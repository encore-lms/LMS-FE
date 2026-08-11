import { DEMO_LOGIN_ENABLED, type DemoAccount } from './demoAccounts'

// QA 빠른 로그인 프리셋 — 시연용 데모 4계정과 분리된 개발·테스트 실계정.
// auth-user-service는 단일 세션 정책이라 같은 계정으로 두 번째 로그인이 성공하는 순간
// 먼저 로그인한 세션이 즉시 끊긴다(AUTH_SESSION_REPLACED) — 여럿이 쓸 때는 계정을 나눈다.
// (구 /login2 회의용 입구는 08-11 시연 종료 후 폐쇄, 계정 그룹만 /login 으로 이동.)
// 게이트는 demoAccounts와 동일 — 꺼진 빌드에서는 상수 폴딩으로 평문 비밀번호가 번들에서 제거된다.
export const QA_ACCOUNTS: DemoAccount[] = DEMO_LOGIN_ENABLED
  ? [
      { label: 'QA 수강생', email: 'qa-student', password: 'LmsQa2026!' },
      {
        label: 'QA 멘토',
        email: 'qa.mentor@playdata.io',
        password: 'LmsQa2026!',
      },
      {
        label: 'QA 강사',
        email: 'qa.instructor@playdata.io',
        password: 'LmsQa2026!',
      },
      {
        label: 'QA 매니저',
        email: 'qa.manager@playdata.io',
        password: 'LmsQa2026!',
      },
      {
        label: 'QA 관리자',
        email: 'qa.admin@playdata.io',
        password: 'LmsQa2026!',
      },
    ]
  : []
