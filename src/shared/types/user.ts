// 도메인 사용자/역할 계약 — 공유 읽기전용. 변경은 도메인 PR에 섞지 말고 별도 "shared" PR로 페어 동기화.
// 근거: LMS-DOCS 20_도메인/사용자_유형.md (5-Role 권한 체계)

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'MANAGER' | 'MENTOR' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}
