// 데모 빠른 로그인 프리셋 — 실제 BE 계정(auth-user-service)으로 연결.
// 버튼 클릭 시 해당 계정으로 즉시 로그인하고 역할 홈으로 이동한다.
// 실로그인 모드(VITE_REAL_AUTH=true, dev 기본)에서 실제 인증된다.
export interface DemoAccount {
  label: string
  email: string
  password: string
}

// 데모 로그인 노출 게이트 — 로컬 dev이거나 VITE_ENABLE_DEMO_LOGIN='true'인 빌드에서만.
// 플래그가 꺼진 빌드에서는 아래 계정 목록이 상수 폴딩으로 번들에서 제거된다
// (실계정 평문 비밀번호가 데모 환경 밖 번들에 포함되지 않도록 하는 안전장치).
export const DEMO_LOGIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true'

// 네 계정 모두 SK네트웍스 Family AI 캠프 34기 하나에만 묶여 있다. 이전 프리셋은 32기를 포함한
// 여섯 기수에 배정돼 있어 32기에 쌓인 검증용 데이터가 그대로 보였다.
export const DEMO_ACCOUNTS: DemoAccount[] = DEMO_LOGIN_ENABLED
  ? [
      // 수강생은 이메일 대신 수강생 코드로 로그인 — 34기 황수빈
      { label: '수강생', email: '100051503818', password: 'PlaydataDemo2026!' },
      {
        label: '멘토',
        email: 'jungminjae@playdata.io',
        password: 'PlaydataDemo2026!',
      },
      {
        label: '강사',
        email: 'parkjihoon@playdata.io',
        password: 'PlaydataDemo2026!',
      },
      {
        label: '매니저',
        email: 'encore@playdata.io',
        password: 'PlaydataDemo2026!',
      },
    ]
  : []
