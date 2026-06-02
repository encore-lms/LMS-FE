import type { MenuItem } from '@/components/layout'

// 강사 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §강사 콘솔.
export const instructorMenu: MenuItem[] = [
  { label: '대시보드', to: '/instructor' },
  { label: '담당 과정/기수', to: '/instructor/cohorts' },
  { label: '평가 관리', to: '/instructor/quizzes' },
  { label: '퀴즈 템플릿', to: '/instructor/quiz-templates' },
  { label: '학습 기록 조회', to: '/instructor/records' },
  { label: '프로젝트 검토', to: '/instructor/projects' },
  { label: '트러블슈팅 검토', to: '/instructor/troubleshooting' },
  { label: '인증 후 변경 제안 검토', to: '/instructor/change-requests' },
  { label: '강사 추천서', to: '/instructor/endorsements' },
]
