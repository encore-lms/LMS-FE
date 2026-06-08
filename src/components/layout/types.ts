import type { ReactNode } from 'react'

// 사이드바 메뉴 항목 계약 — 각 역할이 features/<role>/menu.ts로 등록한다(공유 사이드바 파일 충돌 방지).
export interface MenuItem {
  label: string
  to: string
  icon?: ReactNode
  /** to 경로 prefix 외에 이 항목을 active로 볼 추가 경로(prefix). 예: 나의 과정 ← /student/quizzes */
  match?: string[]
}
