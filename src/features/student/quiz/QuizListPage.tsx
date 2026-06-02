import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import type { QuizListItem } from '@/shared/types'
import { useStudentQuizzes } from '../api/quiz'
import { QuizTabs, type QuizTab } from './QuizTabs'
import { QuizListItemCard } from './QuizListItemCard'

const TAB_FILTER: Record<QuizTab, QuizListItem['state']> = {
  available: 'available',
  completed: 'completed',
  pending_manual: 'pending_manual',
}

const EMPTY_TITLE: Record<QuizTab, string> = {
  available: '응시할 퀴즈가 없어요',
  completed: '완료한 퀴즈가 없어요',
  pending_manual: '채점 대기 중인 퀴즈가 없어요',
}

const DocIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path
      d="M5 3h10l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
      strokeLinejoin="round"
    />
    <path d="M14 3v5h5M8 13h8M8 17h5" strokeLinecap="round" />
  </svg>
)

const AlertIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path
      d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      strokeLinejoin="round"
    />
    <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
  </svg>
)

/** 수강생 퀴즈 목록 (/student/quizzes) — 탭(응시가능/완료/채점대기)으로 분류, 행에서 응시·결과로 이동 */
export default function QuizListPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<QuizTab>('available')
  const { data, isPending, isError, refetch } = useStudentQuizzes()

  if (isPending) {
    return <div className="text-fg-muted p-8">퀴즈를 불러오는 중…</div>
  }
  if (isError) {
    return (
      <Empty
        icon={AlertIcon}
        title="퀴즈를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const items = data.filter((it) => it.state === TAB_FILTER[tab])

  return (
    <div className="p-8">
      <h1 className="text-fg text-2xl font-bold">퀴즈</h1>
      <QuizTabs value={tab} onChange={setTab} items={data} />
      {items.length === 0 ? (
        <Empty icon={DocIcon} title={EMPTY_TITLE[tab]} />
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((it) => (
            <QuizListItemCard
              key={it.quiz.id}
              item={it}
              onTake={() => navigate(`/student/quizzes/${it.quiz.id}/take`)}
              onResult={() => navigate(`/student/quizzes/${it.quiz.id}/result`)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
