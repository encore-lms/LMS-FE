// shared/api 배럴.
export { apiClient } from './client'
export type { ApiClient } from './client'
export { quizKeys, adminKeys, instructorKeys } from './queryKeys'
// 운영·강사 공유 수강생 계정 훅(교차 사용 → shared 승격). 직접 모듈(@/shared/api/students)로
// 임포트하면 테스트가 배럴 전체를 mock하지 않아도 된다.
export { useStudentAccounts } from './students'
