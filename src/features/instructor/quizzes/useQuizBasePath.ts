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

/**
 * 템플릿 화면 경로 — 퀴즈와 같은 역할 프리픽스를 따른다.
 *
 * <p>매니저가 /admin 에서 '템플릿 관리'를 눌렀을 때 /instructor 로 보내면 역할 가드에 막혀
 * 대시보드로 튕긴다.</p>
 */
export function useQuizTemplateBasePath() {
  const { pathname } = useLocation()
  return pathname.startsWith('/admin')
    ? '/admin/quiz-templates'
    : '/instructor/quiz-templates'
}
