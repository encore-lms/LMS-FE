import { useLocation } from 'react-router-dom'

// QnA 화면 공용 base — 같은 페이지를 수강생(/student/qna)·운영(/admin/qna)·강사(/instructor/qna)가 함께 마운트한다.
// 운영은 'QnA 질문' 알림의 목적지(매니저 브로드캐스트)이며 열람·답변만 한다.
// 강사도 열람·답변만 하며, 보이는 질문은 BE가 JWT cohorts로 담당 기수만 스코프한다.
// API 경로·내부 navigate 모두 현재 마운트 위치를 따른다(useQuizBasePath와 동일 규약).
export function useQnaBase() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) return '/admin/qna'
  if (pathname.startsWith('/instructor')) return '/instructor/qna'
  return '/student/qna'
}

// API 전용 base — 운영 마운트도 /instructor/qna 를 호출한다.
// BE의 /admin/qna 미러 컨트롤러는 삭제됐고(강사 컨트롤러와 바이트 단위 동일),
// /instructor/** 게이트는 INSTRUCTOR·ADMIN·MANAGER 를 모두 통과시킨다.
// 화면 이동(navigate)은 여전히 useQnaBase(마운트 위치)를 쓴다 — 매니저는 강사 라우트가 차단된다.
export function useQnaApiBase() {
  const base = useQnaBase()
  return base === '/admin/qna' ? '/instructor/qna' : base
}
