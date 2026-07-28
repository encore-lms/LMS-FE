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
  /** 분류 키(ASSIGNMENT·QUIZ·RECORD…) — 알림 화면 필터·배지에 쓴다. BE가 source에서 유도해 내려준다. */
  category?: string
  categoryLabel?: string
}

/** 알림 화면 필터 칩 1개. key 가 null 이면 '전체'. */
export interface NotificationCategoryCount {
  key: string | null
  label: string
  count: number
}

/** 알림 수신함 한 페이지 — nextCursor 가 null 이면 더 없다. */
export interface NotificationInboxPage {
  items: AppNotification[]
  nextCursor: string | null
  categories: NotificationCategoryCount[]
  unreadTotal: number
}
