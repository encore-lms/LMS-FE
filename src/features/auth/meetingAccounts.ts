import { DEMO_LOGIN_ENABLED, type DemoAccount } from './demoAccounts'

// 개발자 회의용 빠른 로그인 프리셋(/login2) — 시연용 데모 4계정과 완전히 분리된 QA 실계정.
// auth-user-service는 단일 세션 정책이라 같은 계정으로 두 번째 로그인이 성공하는 순간
// 먼저 로그인한 세션이 즉시 끊긴다(AUTH_SESSION_REPLACED). 회의 접속이 시연 세션을
// 밀어내지 않도록 페이지가 아니라 계정을 통째로 나눈다.
// 게이트는 demoAccounts와 동일 — 꺼진 빌드에서는 상수 폴딩으로 평문 비밀번호가 번들에서 제거된다.
export const MEETING_ACCOUNTS: DemoAccount[] = DEMO_LOGIN_ENABLED
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
