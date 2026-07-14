// 알림 공용 계약 — 헤더 알림 벨(전 역할)·수강생 대시보드 알림이 공유하는 단일 타입.
// 공유 모델 단일 소유 원칙(CONTRIBUTING §병렬 작업 규칙): 중복 정의 금지, 소비자는 여기서 import.
export interface AppNotification {
  id: string
  title: string
  source: string // 운영자 박지수 / 평판 시스템 / 강사 이정훈
  relativeTime: string // "1시간 전"
  unread: boolean
  /** 클릭 시 이동할 상대 경로(예: /student/qna/{id}). 없으면 비네비게이션 알림. */
  link?: string | null
}
