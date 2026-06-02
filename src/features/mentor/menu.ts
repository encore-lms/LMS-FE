import type { MenuItem } from '@/components/layout'

// 멘토 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §멘토 콘솔.
export const mentorMenu: MenuItem[] = [
  { label: '대시보드', to: '/mentor' },
  { label: '내 배정 팀', to: '/mentor/teams' },
  { label: '멘토링 예약', to: '/mentor/reservations' },
  { label: '멘토링 일지', to: '/mentor/journals' },
  { label: '평가·추천', to: '/mentor/evaluations' },
]
