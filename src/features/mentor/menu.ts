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
  // 예약·일지·평가·추천은 팀 상세(/mentor/teams/:teamId)의 탭으로 옮겼다(2026-08-04).
  // 멘토가 하는 일은 늘 '어느 팀의' 무엇이라, 사이드바에서 연 뒤 다시 팀을 고르게 하지 않는다.
  // 경로는 그대로 살아 있어 기존 링크·딥링크·완료 화면 복귀는 계속 열린다.
  {
    label: roleTag('내 배정 팀', '멘토'),
    to: '/mentor/teams',
    match: [
      '/mentor/mentees',
      '/mentor/mentoring-requests',
      '/mentor/mentoring-logs',
      '/mentor/evaluations',
      '/mentor/recommendations',
    ],
  },
]
