// 도메인 사용자/역할 계약 — 공유 읽기전용. 변경은 도메인 PR에 섞지 말고 별도 "shared" PR로 페어 동기화.
// 근거: LMS-DOCS 20_도메인/사용자_유형.md (5-Role 권한 체계)

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'MANAGER' | 'MENTOR' | 'ADMIN'

/**
 * 수강생 교육 타입 — KDT: K-디지털 트레이닝(부트캠프형), KDC: K-디지털 기초역량훈련(온라인형).
 * STUDENT 역할에만 의미가 있으며, 나의 과정(/student/course) 진입 화면을 분기하는 데 쓴다.
 */
export type TrainingType = 'KDT' | 'KDC'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  /** 수강생 교육 타입(STUDENT 한정). 없으면 KDT(기본 부트캠프형)로 간주. */
  trainingType?: TrainingType
}
