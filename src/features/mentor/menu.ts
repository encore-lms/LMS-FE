import type { MenuItem } from '@/components/layout'
import { roleTag } from '@/shared/constants'

// 멘토 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §멘토 콘솔.
// 경로는 canonical(Figma · P0_32_35 API 명세)로 정합 — 구 /mentor/reservations · /mentor/journals 폐기.
export const mentorMenu: MenuItem[] = [
  // index(/mentor)와 /mentor/dashboard 는 같은 화면 — 별칭 경로도 활성 유지
  { label: '대시보드', to: '/mentor', match: ['/mentor/dashboard'] },
  // 팀 상세(/mentor/teams/:teamId)·학생 상세(/mentor/mentees/:studentId) 진입 시에도 활성 유지.
  // 평가 작성(/mentor/teams/:teamId/evaluation)은 Figma상 '평가·추천' 활성이지만 Sidebar match가
  // prefix 전용이라 suffix(:teamId/evaluation) 매칭 불가 — '내 배정 팀' 활성을 허용한다(결정 기록).
  {
    label: roleTag('내 배정 팀', '멘토'),
    to: '/mentor/teams',
    match: ['/mentor/mentees'],
  },
  { label: roleTag('멘토링 예약', '멘토'), to: '/mentor/mentoring-requests' },
  { label: roleTag('멘토링 일지', '멘토'), to: '/mentor/mentoring-logs' },
  {
    label: roleTag('평가·추천', '멘토'),
    to: '/mentor/evaluations',
    match: ['/mentor/recommendations'],
  },
]
