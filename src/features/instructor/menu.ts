import type { MenuItem } from '@/components/layout'

// 강사 사이드바 — 정본: Figma 강사 Sidebar 그룹핑(6항목) + 평가 관리(P0) 복원 = 7항목.
// 2026-06-10 정합: 리뷰 3종(학습기록 조회·프로젝트·트러블슈팅)을 '검토' 1항목으로 묶고,
// Figma(05-19)에서 누락됐던 평가 관리(/instructor/quizzes, 퀴즈 출제·채점 P0 27)를 복원.
export const instructorMenu: MenuItem[] = [
  // 대시보드는 BE 미구현이라 메뉴에서 제외(로그인 랜딩은 평가 관리로 리다이렉트). BE 구축 후 복원.
  // 교육 과정 = 담당 과정/기수 + 하위 수강생 목록·상세. 수강생 상세는 /instructor/students/* 라
  // /instructor/cohorts prefix로 안 잡혀 활성 탭이 풀린다 → match로 묶어 활성 유지.
  {
    label: '교육 과정',
    to: '/instructor/cohorts',
    match: ['/instructor/students'],
  },
  // 과제·실습은 별도 메뉴 없이 평가 관리 하위(Figma 2236:10561 sidebar active=평가 관리).
  {
    label: '평가 관리',
    to: '/instructor/quizzes',
    match: ['/instructor/assignments'],
  },
  { label: '퀴즈 템플릿', to: '/instructor/quiz-templates' },
  // 검토 = 학습기록 조회 + 프로젝트 검토 + 트러블슈팅 검토 묶음(Figma '검토' 부모 항목)
  {
    label: '검토',
    to: '/instructor/records/review',
    match: ['/instructor/projects', '/instructor/troubleshooting'],
  },
  // 재인증 통합 검토는 별도 메뉴 없이 같은 항목 하위(Figma 2750:2202 sidebar active 동일).
  {
    label: '인증 후 변경 제안',
    to: '/instructor/change-requests',
    match: ['/instructor/recertifications'],
  },
  { label: '강사 추천서', to: '/instructor/endorsements' },
]
