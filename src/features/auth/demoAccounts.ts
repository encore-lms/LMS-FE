// 데모 배포(MSW mock)용 빠른 로그인 프리셋.
// mock(mocks/handlers.ts roleFromEmail)은 이메일 prefix로만 역할을 판별하고 비밀번호는 무시한다.
//   admin@…→매니저(MANAGER) / instructor@…→강사 / mentor@…→멘토 / 그 외→수강생
export interface DemoAccount {
  label: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: '매니저', email: 'admin@playdata.io', password: 'playdata123!' },
  { label: '강사', email: 'instructor@playdata.io', password: 'playdata123!' },
  { label: '멘토', email: 'mentor@playdata.io', password: 'playdata123!' },
  { label: '수강생', email: 'student@playdata.io', password: 'playdata123!' },
]
