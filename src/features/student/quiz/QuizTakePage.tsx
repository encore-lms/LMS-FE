import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { cn } from '@/shared/lib/cn'
import { useStudentQuizzes } from '../api/quiz'
import { useQuizQuestions } from '../api/quiz'
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

// 이탈(전체화면 해제) 정책:
//  - 1~3회: 경고. WARNING_GRACE_SECONDS(10초) 잠금 후 "문제로 돌아가기"로 이어서 응시.
//  - 4회째부터: SUBMIT_GRACE_SECONDS(5초) 카운트다운 뒤 자동 제출(시험 종료).
// 어느 경우든 이탈한 동안 시험 타이머는 계속 흐른다(시간 손해 = 추가 억제).
const VIOLATION_LIMIT = 3
const WARNING_GRACE_SECONDS = 10
const SUBMIT_GRACE_SECONDS = 5

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

  const quiz = list?.find((it) => it.quiz.id === quizId)?.quiz
  const [idx, setIdx] = useState(0)
  // maxReached: 순차 진행으로 도달한 최대 문항 인덱스. "한 문제 풀고 다음" 잠금/네비 제한의 기준.
  const [maxReached, setMaxReached] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [remain, setRemain] = useState<number | null>(null)
  // 이탈(전체화면 해제) 후 자동 제출까지 남은 유예 초. null = 카운트다운 없음.
  const [graceLeft, setGraceLeft] = useState<number | null>(null)

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

  const submit = () => {
    if (!allAnswered) return
    leaveToResult()
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
    if (remain === 0 && lock.phase === 'active') leaveToResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remain, lock.phase])

  // 전체화면에 한 번이라도 진입했음을 기록 — '진입 후 이탈'만 자동 제출 대상으로 본다.
  useEffect(() => {
    if (lock.isFullscreen) enteredFsOnceRef.current = true
  }, [lock.isFullscreen])

  // 진입 후 전체화면이 풀리면(ESC 등) 유예 카운트다운 시작 → 복귀하면 취소.
  // 1~3회는 10초, 4회째부터는 5초로 카운트다운한다.
  useEffect(() => {
    const escaped =
      lock.phase === 'active' && !lock.isFullscreen && enteredFsOnceRef.current
    if (!escaped) {
      setGraceLeft(null)
      return
    }
    const fatal = lock.violations > VIOLATION_LIMIT
    setGraceLeft(fatal ? SUBMIT_GRACE_SECONDS : WARNING_GRACE_SECONDS)
    const t = setInterval(() => {
      setGraceLeft((s) => (s === null ? s : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(t)
  }, [lock.phase, lock.isFullscreen, lock.violations])

  // 유예 만료 시: 4회째 이상(이탈 > 3)만 자동 제출. 1~3회는 제출하지 않고 복귀를 허용한다.
  useEffect(() => {
    if (
      graceLeft === 0 &&
      lock.phase === 'active' &&
      lock.violations > VIOLATION_LIMIT
    ) {
      leaveToResult()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graceLeft, lock.phase, lock.violations])

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
        violationLimit={VIOLATION_LIMIT}
        warningSeconds={WARNING_GRACE_SECONDS}
        submitSeconds={SUBMIT_GRACE_SECONDS}
        onStart={() => void lock.start()}
      />
    )
  }

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
          <span className="text-fg-muted text-[11px] font-medium">진행률</span>
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
              allAnswered ? undefined : '모든 문제를 풀어야 제출할 수 있어요'
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

      {/* 전체화면이 풀리면(ESC/F11) 문제를 가리고 재진입을 강제 */}
      {lock.phase === 'active' && !lock.isFullscreen && (
        <ExamRelockOverlay
          violations={lock.violations}
          limit={VIOLATION_LIMIT}
          secondsLeft={graceLeft}
          fatal={lock.violations > VIOLATION_LIMIT}
          onRelock={() => void lock.relock()}
        />
      )}
    </div>
  )
}
