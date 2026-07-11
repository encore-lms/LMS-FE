import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type { AnswerPayload } from '@/shared/types'
import { useStudentQuizzes, useQuizQuestions, useSubmitQuiz } from '../api/quiz'
import { QuestionNavRail } from './take/QuestionNavRail'
import { QuestionCard } from './take/QuestionCard'
import { ExamIntro, ExamRelockOverlay } from './take/ExamOverlays'
import { useExamLock } from './take/useExamLock'

function fmt(sec: number) {
  const s = Math.max(0, sec)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${ss}`
}

// 이탈(전체화면 해제) 정책: 한도·자동 제출 없음.
//  - 이탈하면 재진입 오버레이에 RELOCK_COUNTDOWN_SECONDS(10초) 카운트다운이 표시되지만,
//    "문제로 돌아가기"는 처음부터 활성화되어 도중이든 0초 이후든 언제든 눌러 이어서 응시할 수 있다.
//  - 0초가 되어도 자동 제출하지 않는다. 이탈한 동안에도 시험 타이머는 계속 흐르고(시간 손해 = 억제),
//    이탈 횟수는 기록·표시만 한다.
const RELOCK_COUNTDOWN_SECONDS = 10

/**
 * 퀴즈 응시 (/student/quizzes/:quizId/take) — 전체화면 집중 모드(쉘 없음).
 *
 * anti-cheat: 응시 중 구글링·AI 사용을 막기 위해 브라우저 전체화면으로 진입하고,
 * 모든 문제를 풀기 전에는 ESC·뒤로가기·탭 전환 등으로 나갈 수 없게 가둔다(useExamLock).
 * 흐름: 인트로(규칙+시작) → 전체화면 응시 → 전부 답하면 제출 → 결과. 시간 초과 시 자동 제출.
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
  const submitQuiz = useSubmitQuiz(quizId)
  const toast = useToast()

  const quiz = list?.find((it) => it.quiz.id === quizId)?.quiz
  const [idx, setIdx] = useState(0)
  // maxReached: 순차 진행으로 도달한 최대 문항 인덱스. "한 문제 풀고 다음" 잠금/네비 제한의 기준.
  const [maxReached, setMaxReached] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [remain, setRemain] = useState<number | null>(null)
  // 이탈(전체화면 해제) 후 재진입 오버레이의 카운트다운 남은 초. null = 카운트다운 없음.
  const [graceLeft, setGraceLeft] = useState<number | null>(null)
  // 카운트다운이 0이 되어 자동으로 문제로 돌아갔는지 — true면 오버레이를 닫고 그대로 이어 푼다.
  const [autoReturned, setAutoReturned] = useState(false)

  const lock = useExamLock()
  // 우리가 의도한 이탈(제출/시간초과)만 허용 — 그 외 모든 라우터 이동을 막는다.
  const allowLeaveRef = useRef(false)
  // 전체화면을 한 번이라도 진입했는지 — 최초 진입 실패와 '진입 후 이탈'을 구분(전자는 자동제출 안 함).
  const enteredFsOnceRef = useRef(false)

  const total = questions?.length ?? 0

  const answeredIdx = useMemo(() => {
    const set = new Set<number>()
    questions?.forEach((q, i) => {
      const v = answers[q.id]
      if (v != null && v !== '') set.add(i)
    })
    return set
  }, [questions, answers])

  const allAnswered = total > 0 && answeredIdx.size === total

  // 라우터 내 이동(뒤로가기·링크 클릭 등) 차단 — 응시 중에는 제출/시간초과 외 이탈 불가.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      lock.phase === 'active' &&
      !allowLeaveRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    // 막힌 이동은 즉시 reset해 페이지에 머무르게 하고, 다음 이동도 다시 차단되도록 한다.
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  // 제한 시간 카운트다운(분 → 초). quiz 로드 시 1회 초기화.
  useEffect(() => {
    if (quiz && remain === null) setRemain(quiz.timeLimitMinutes * 60)
  }, [quiz, remain])
  useEffect(() => {
    if (remain === null) return
    const t = setInterval(
      () => setRemain((r) => (r === null ? r : Math.max(0, r - 1))),
      1000,
    )
    return () => clearInterval(t)
  }, [remain])

  // 정상 종료 — 라우터 차단을 풀고 전체화면을 해제한 뒤 결과로 이동.
  const leaveToResult = () => {
    allowLeaveRef.current = true
    void lock.release()
    navigate(`/student/quizzes/${quizId}/result`)
  }

  // 답안(Record<string,string>) → 유형별 AnswerPayload. 빈칸은 줄바꿈으로 칸 구분.
  const buildResponses = (): {
    questionId: string
    payload: AnswerPayload
  }[] =>
    (questions ?? []).map((q) => {
      const v = answers[q.id] ?? ''
      let payload: AnswerPayload
      if (q.type === 'multiple_choice')
        payload = { kind: 'multiple_choice', selectedChoiceId: v }
      else if (q.type === 'short_answer' || q.type === 'essay')
        payload = { kind: 'short_answer', text: v }
      else
        payload = {
          kind: 'fill_blank',
          answers: v.split('\n').map((s) => s.trim()),
        }
      return { questionId: q.id, payload }
    })

  // 실제 제출 — 자동채점 후 결과로. 실패 시 응시 화면 유지.
  const finalize = () => {
    if (submitQuiz.isPending) return
    submitQuiz.mutate(
      { responses: buildResponses() },
      {
        onSuccess: () => leaveToResult(),
        onError: () =>
          toast.danger('제출에 실패했어요. 잠시 후 다시 시도해 주세요'),
      },
    )
  }

  const submit = () => {
    if (!allAnswered) return
    finalize()
  }

  const isLast = total > 0 && idx === total - 1
  const currentAnswered = answeredIdx.has(idx)

  // 다음 문제 — 현재 문제를 풀어야만 진행(잠금 해제). 마지막에서는 제출만 가능.
  const goNext = () => {
    if (isLast || !currentAnswered) return
    const next = idx + 1
    setIdx(next)
    setMaxReached((m) => Math.max(m, next))
  }
  const goPrev = () => setIdx((i) => Math.max(0, i - 1))

  // 시간 초과 시 자동 제출(미답 포함). 응시 중일 때만 1회 동작.
  useEffect(() => {
    if (remain === 0 && lock.phase === 'active') finalize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remain, lock.phase])

  // 전체화면에 한 번이라도 진입했음을 기록 — '진입 후 이탈'만 자동 제출 대상으로 본다.
  useEffect(() => {
    if (lock.isFullscreen) enteredFsOnceRef.current = true
  }, [lock.isFullscreen])

  // 진입 후 전체화면이 풀리면(ESC 등) 재진입 오버레이의 카운트다운을 시작.
  //  - 0초가 되면 자동으로 오버레이를 닫고 문제로 돌아간다(autoReturned).
  //  - 그 전에도 "문제로 돌아가기" 버튼으로 언제든 즉시 복귀할 수 있다.
  // 전체화면 재진입은 브라우저 정책상 클릭 제스처에서만 가능하므로, 자동 복귀(0초)는 전체화면 없이
  // 진행되고(버튼 클릭만 전체화면을 다시 건다), 한도·자동 제출은 없다.
  useEffect(() => {
    const escaped =
      lock.phase === 'active' && !lock.isFullscreen && enteredFsOnceRef.current
    if (!escaped) {
      setGraceLeft(null)
      setAutoReturned(false)
      return
    }
    setAutoReturned(false)
    setGraceLeft(RELOCK_COUNTDOWN_SECONDS)
    const t = setInterval(() => {
      setGraceLeft((s) => (s === null ? s : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(t)
  }, [lock.phase, lock.isFullscreen])

  // 카운트다운이 0에 도달하면 자동으로 오버레이를 닫아 문제로 돌아간다.
  useEffect(() => {
    if (graceLeft === 0) setAutoReturned(true)
  }, [graceLeft])

  // 답을 고른 뒤 Enter → 다음 문제. 텍스트 입력(단답/서술) 중에는 줄바꿈이므로 제외.
  // 마지막 문제에서는 동작하지 않음 — 제출은 오직 클릭으로만.
  useEffect(() => {
    if (lock.phase !== 'active') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      if (!isLast && currentAnswered) {
        const next = idx + 1
        setIdx(next)
        setMaxReached((m) => Math.max(m, next))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lock.phase, isLast, currentAnswered, idx])

  // 1) 인트로 — 규칙 안내 + 시작(전체화면 진입은 사용자 클릭에서만 가능).
  if (lock.phase === 'intro') {
    return (
      <ExamIntro
        title={quiz?.title ?? '퀴즈 응시'}
        total={total}
        timeLimitMinutes={quiz?.timeLimitMinutes ?? 0}
        countdownSeconds={RELOCK_COUNTDOWN_SECONDS}
        onStart={() => void lock.start()}
      />
    )
  }

  const current = questions?.[Math.min(idx, total - 1)]
  const setAnswer = (v: string) =>
    setAnswers((prev) => (current ? { ...prev, [current.id]: v } : prev))

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !questions || questions.length === 0}
      onRetry={refetch}
      loadingText="문제를 불러오는 중…"
      errorTitle="문제를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {current && (
        <div className="bg-surface flex h-screen flex-col">
          {/* 상단 고정 바 */}
          <header className="border-border flex h-[88px] shrink-0 items-center justify-between border-b px-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-1">
              <p className="text-fg text-[18px] font-semibold">
                {quiz?.title ?? '퀴즈 응시'}
              </p>
              <p className="text-fg-subtle text-[12px]">
                플레이데이터 부트캠프 12기 · {current.categoryId}
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
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-fg-muted text-[11px] font-medium">
                진행률
              </span>
              <span className="text-fg text-[14px] font-semibold">
                {answeredIdx.size} / {total} 답변
              </span>
            </div>
          </header>

          {/* 본문 */}
          <div className="flex min-h-0 flex-1">
            <QuestionNavRail
              total={total}
              currentIdx={idx}
              answeredIdx={answeredIdx}
              reachableMax={maxReached}
              onJump={(i) => i <= maxReached && setIdx(i)}
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

          {/* 하단 고정 바 — 한 문제씩 순차 진행. 자유 이탈 불가(나가기 버튼 없음). */}
          <footer className="border-border flex h-[72px] shrink-0 items-center justify-between border-t px-8 shadow-[0px_-1px_2px_0px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={goPrev}
              disabled={idx === 0}
              className="border-border text-fg rounded-[10px] border px-5 py-3 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← 이전
            </button>

            <span className="text-fg-muted flex items-center gap-2 text-[12px] font-medium">
              🔒 집중 모드 · 문제 {idx + 1} / {total}
              {!isLast &&
                (currentAnswered
                  ? ' · Enter로 다음 문제'
                  : ' · 답을 선택하면 다음으로 넘어가요')}
              {isLast && ' · 마지막 문제예요. 제출 버튼을 눌러 종료하세요'}
            </span>

            {isLast ? (
              <button
                type="button"
                onClick={submit}
                disabled={!allAnswered}
                title={
                  allAnswered
                    ? undefined
                    : '모든 문제를 풀어야 제출할 수 있어요'
                }
                className={cn(
                  'rounded-[10px] px-6 py-3 text-[14px] font-semibold text-white',
                  allAnswered
                    ? 'bg-brand'
                    : 'bg-fg-subtle cursor-not-allowed opacity-60',
                )}
              >
                제출하기
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!currentAnswered}
                title={
                  currentAnswered
                    ? undefined
                    : '현재 문제를 풀어야 다음으로 넘어가요'
                }
                className={cn(
                  'rounded-[10px] px-6 py-3 text-[14px] font-semibold text-white',
                  currentAnswered
                    ? 'bg-brand'
                    : 'bg-fg-subtle cursor-not-allowed opacity-60',
                )}
              >
                다음 문제 →
              </button>
            )}
          </footer>

          {/* 전체화면이 풀리면(ESC/F11) 문제를 가리는 오버레이 — 카운트다운 0초 또는 버튼 클릭 시 닫힘 */}
          {lock.phase === 'active' && !lock.isFullscreen && !autoReturned && (
            <ExamRelockOverlay
              violations={lock.violations}
              secondsLeft={graceLeft}
              onRelock={() => {
                // 버튼은 카운트다운 도중 언제든 활성화 — 즉시 닫고 전체화면 재진입(클릭 제스처)을 시도.
                setAutoReturned(true)
                void lock.relock()
              }}
            />
          )}
        </div>
      )}
    </DataBoundary>
  )
}
