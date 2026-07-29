// shared/api 배럴.
export { apiClient } from './client'
export type { ApiClient } from './client'
export { quizKeys, adminKeys, instructorKeys } from './queryKeys'
// 운영·강사 공유 수강생 계정 훅(교차 사용 → shared 승격). 직접 모듈(@/shared/api/students)로
// 임포트하면 테스트가 배럴 전체를 mock하지 않아도 된다.
export { useStudentAccounts } from './students'
// 알림 훅(헤더 벨 + 수강생 대시보드 교차 사용 → shared 승격).
export {
  notificationKeys,
  useRoleNotifications,
  useMarkNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
} from './notifications'
export {
  useCourseNotices,
  useStaffCourseNotices,
  useWriteCourseNotice,
  useDeleteCourseNotice,
} from './notices'
export type { NoticePost, NoticePostList } from './notices'
