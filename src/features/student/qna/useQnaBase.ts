import { useLocation } from 'react-router-dom'

// QnA 화면 공용 base — 같은 페이지를 수강생(/student/qna)과 운영(/admin/qna)이 함께 마운트한다.
// 운영은 'QnA 질문' 알림의 목적지(매니저 브로드캐스트)이며 열람·답변만 한다.
// API 경로·내부 navigate 모두 현재 마운트 위치를 따른다(useQuizBasePath와 동일 규약).
export function useQnaBase() {
  const { pathname } = useLocation()
  return pathname.startsWith('/admin') ? '/admin/qna' : '/student/qna'
}
