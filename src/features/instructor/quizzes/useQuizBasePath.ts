import { useLocation } from 'react-router-dom'

// 퀴즈 화면 공용 base path — 같은 페이지를 강사(/instructor/quizzes)와
// 운영(/admin/quizzes, 매니저 P0 재사용 결정 2026-05-21 안건 6)이 함께 마운트하므로
// 내부 navigate는 현재 마운트 위치를 따른다.
export function useQuizBasePath() {
  const { pathname } = useLocation()
  return pathname.startsWith('/admin')
    ? '/admin/quizzes'
    : '/instructor/quizzes'
}
