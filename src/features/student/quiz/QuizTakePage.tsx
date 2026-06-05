import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useStudentQuizzes } from '../api/quiz'
import { useQuizQuestions } from '../api/quiz'
import { QuestionNavRail } from './take/QuestionNavRail'
import { QuestionCard } from './take/QuestionCard'

function fmt(sec: number) {
  const s = Math.max(0, sec)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${ss}`
}

/**
 * 퀴즈 응시 (/student/quizzes/:quizId/take) — 전체화면 집중 모드(쉘 없음).
 * 상단 타이머/진행률·제출 / 좌측 문제 네비 / 본문 문제 카드 / 하단 임시저장.
 */
export default function QuizTakePage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const { data: list } = useStudentQuizzes()
  const {
    data: questions,
    isPending,
    isError,
    refetch,
  } = useQuizQuestions(quizId)

  const quiz = list?.find((it) => it.quiz.id === quizId)?.quiz
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [remain, setRemain] = useState<number | null>(null)

  // 제한 시간 카운트다운(분 → 초). quiz 로드 시 1회 초기화.
  useEffect(() => {
    if (quiz && remain === null) setRemain(quiz.timeLimitMinutes * 60)
  }, [quiz, remain])
  useEffect(() => {
    if (remain === null) return
    const t = setInterval(
      () => setRemain((r) => (r === null ? r : r - 1)),
      1000,
    )
    return () => clearInterval(t)
  }, [remain])

  const answeredIdx = useMemo(() => {
    const set = new Set<number>()
    questions?.forEach((q, i) => {
      const v = answers[q.id]
      if (v != null && v !== '') set.add(i)
    })
    return set
  }, [questions, answers])

  if (isPending) {
    return <div className="text-fg-muted p-8">문제를 불러오는 중…</div>
  }
  if (isError || !questions || questions.length === 0) {
    return (
      <div className="p-8">
        <Empty
          title="문제를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const total = questions.length
  const current = questions[Math.min(idx, total - 1)]
  const setAnswer = (v: string) =>
    setAnswers((prev) => ({ ...prev, [current.id]: v }))

  return (
    <div className="bg-surface flex h-screen flex-col">
      {/* 상단 고정 바 */}
      <header className="border-border flex h-[88px] shrink-0 items-center justify-between border-b px-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-1">
          <p className="text-fg text-[18px] font-semibold">
            {quiz?.title ?? '퀴즈 응시'}
          </p>
          <p className="text-fg-subtle text-[12px]">
            플레이데이터 부트캠프 · {current.categoryId}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-warning size-3 rounded" />
            <span className="text-fg-muted text-[11px] font-medium">
              남은 시간
            </span>
            <span className="text-fg text-[22px] font-bold tracking-[0.5px]">
              {remain === null ? '--:--:--' : fmt(remain)}
            </span>
          </div>
          <div className="bg-border h-1 w-[280px] overflow-hidden rounded-full">
            <div
              className="bg-warning h-1 rounded-full"
              style={{
                width: quiz
                  ? `${Math.max(0, Math.min(100, ((remain ?? 0) / (quiz.timeLimitMinutes * 60)) * 100))}%`
                  : '0%',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-fg-muted text-[11px] font-medium">
              진행률
            </span>
            <span className="text-fg text-[14px] font-semibold">
              {answeredIdx.size} / {total} 답변
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/student/quizzes/${quizId}/result`)}
            className="bg-brand rounded-[10px] px-5 py-3 text-[14px] font-semibold text-white"
          >
            제출하기
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="flex min-h-0 flex-1">
        <QuestionNavRail
          total={total}
          currentIdx={idx}
          answeredIdx={answeredIdx}
          onJump={setIdx}
        />
        <main className="flex flex-1 justify-center overflow-y-auto px-16 py-10">
          <QuestionCard
            question={current}
            index={idx}
            total={total}
            value={answers[current.id]}
            onChange={setAnswer}
          />
        </main>
      </div>

      {/* 하단 고정 바 */}
      <footer className="border-border flex h-[72px] shrink-0 items-center justify-between border-t px-8 shadow-[0px_-1px_2px_0px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => navigate('/student/quizzes')}
          className="border-border text-fg rounded-[10px] border px-5 py-3 text-[14px] font-semibold"
        >
          ← 나가기
        </button>
        <div className="flex items-center gap-2">
          <span className="bg-brand size-2 rounded" />
          <span className="text-fg-muted text-[12px] font-medium">
            임시 저장됨 · 방금 전
          </span>
        </div>
        <button
          type="button"
          className="border-brand text-brand rounded-[10px] border px-5 py-3 text-[14px] font-semibold"
        >
          임시 저장
        </button>
      </footer>
    </div>
  )
}
