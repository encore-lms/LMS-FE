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
