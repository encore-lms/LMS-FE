// 데모 빠른 로그인 프리셋 — 실제 BE 계정(auth-user-service)으로 연결.
// 버튼 클릭 시 해당 계정으로 즉시 로그인하고 역할 홈으로 이동한다.
// 실로그인 모드(VITE_REAL_AUTH=true, dev 기본)에서 실제 인증된다.
export interface DemoAccount {
  label: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: '수강생', email: 'student1@playdata.io', password: 'password123!' },
  { label: '멘토', email: 'apsxh123@naver.com', password: 'Lms@S6rGZrNARXNh' },
  { label: '강사', email: 'rkdtk123@naver.com', password: 'Lms@DupVrqdtQR56' },
  {
    label: '운영(관리자)',
    email: 'admin@playdata.io',
    password: 'password123!',
  },
]
