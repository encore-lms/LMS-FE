import type { QuizListItem } from '@/shared/types'

// 퀴즈 목록 화면 전용 뷰 모델 — 공유 QuizListItem에 화면 표시용 파생 필드를 더한다(기능 로컬).
// 카테고리/문항수/디데이/기간 라벨은 목록 카드(Figma 226:27)에서만 쓰는 표시값이라 여기서 정의.
export type QuizCategory = 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'DATABASE' | 'CS'

export interface StudentQuizListItem extends QuizListItem {
  category: QuizCategory
  questionCount: number
  /** 응시 가능 카드의 D-day(남은 일수). 그 외 상태는 null */
  dDay: number | null
  /** "05/13 14:00 — 05/16 23:59" 형태의 응시 기간 라벨 */
  periodLabel: string
}
