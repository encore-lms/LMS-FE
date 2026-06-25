import { usePageHeader } from '@/shared/store'
import { QuestionForm } from '../components/QuestionForm'

// 새 질문 작성 (/student/qna/new) — 작성 폼 단일 페이지.
export default function NewQuestionPage() {
  usePageHeader('질문하기', '동료·멘토·강사에게 궁금한 점을 물어보세요.')
  return <QuestionForm />
}
