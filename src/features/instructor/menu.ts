import type { MenuItem } from '@/components/layout'

// 강사 사이드바 — 정본: Figma 강사 Sidebar 그룹핑.
// 2026-07-23: 퀴즈·과제(구 평가 관리)·퀴즈 템플릿을 교육 과정 허브·퀴즈 영역 안으로 이관 →
// 별도 '평가 관리'·'퀴즈 템플릿' 메뉴 제거(매니저 EducationPage와 동일하게 과정 안에서 관리).
// 퀴즈/과제 폼·통합 목록·템플릿 라우트는 유지(퀴즈 화면 '템플릿 관리' 버튼으로 진입).
export const instructorMenu: MenuItem[] = [
  // 대시보드 = 담당 기수 채점·인증·보완 KPI + 우선 처리 목록(로그인 랜딩).
  { label: '대시보드', to: '/instructor/dashboard' },
  // 교육 과정 = 담당 과정/기수 + 과정 클릭 시 허브(자료실·과제·퀴즈·프로젝트·이력서·기록실 탭).
  // 수강생 상세·퀴즈/과제 관리·퀴즈 템플릿을 match로 묶어 활성 유지.
  {
    label: '교육 과정',
    to: '/instructor/cohorts',
    match: [
      '/instructor/students',
      '/instructor/quizzes',
      '/instructor/assignments',
      '/instructor/quiz-templates',
    ],
  },
  // 검토 = 프로젝트 검토 + 트러블슈팅 검토. 학습 기록 조회는 교육 과정 허브 '기록실' 탭으로 이관(진입은 프로젝트).
  {
    label: '검토',
    to: '/instructor/projects/review',
    match: ['/instructor/troubleshooting', '/instructor/records'],
  },
  // 재인증 통합 검토는 별도 메뉴 없이 같은 항목 하위(Figma 2750:2202 sidebar active 동일).
  {
    label: '인증 후 변경 제안',
    to: '/instructor/change-requests',
    match: ['/instructor/recertifications'],
  },
  { label: '강사 추천서', to: '/instructor/endorsements' },
]
