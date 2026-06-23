import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { usePageHeader } from '@/shared/store'
import { usePlayQuizBattle } from '../api/play'
import { StatStrip } from './StatStrip'
import { pushPlay } from './history'
import { card, fmtTime } from './shared'
import type {
  QuizAnswerReview,
  QuizBattleQuestion,
  QuizBattleResult,
} from './types'

const QUESTIONS_PER_BATTLE = 10 // 영역별 10문제 고정

// PLAY CS 퀴즈 배틀 (/student/play/quiz) — Figma 4911:7000 · 결과 4925:7361 · 영역 모달 4939:7444.
// 영역(전체/운영체제/네트워크/자료구조) 선택 → 문제당 30초 4지선다 → 콤보로 AI 페이서와 대결.
type Phase = 'answering' | 'revealed'
const ALL = '전체'

const BASE_POINTS = 1000
const TIME_BONUS_MAX = 500
const COMBO_STEP = 200
const RIVAL_POINTS = 1250

export default function PlayQuizPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = usePlayQuizBattle()
  usePageHeader(
    'CS 퀴즈 배틀',
    '영역을 선택하고 문제당 제한 시간 안에 CS 문제를 풀어 콤보로 상대와 겨룹니다.',
  )

  const [area, setArea] = useState<string | null>(null)
  const [areaModalOpen, setAreaModalOpen] = useState(true) // 첫 진입 시 영역 선택 모달
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  // null = 아직 미초기화 — 0으로 시작하면 마운트 직후 "시간 종료"로 오인되므로 null로 둔다.
  const [remaining, setRemaining] = useState<number | null>(null)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [rivalScore, setRivalScore] = useState(0)
  const [rivalCorrect, setRivalCorrect] = useState(0)
  const [reviews, setReviews] = useState<QuizAnswerReview[]>([])
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  const elapsedRef = useRef(0)
  const submittedRef = useRef(false)

  // 영역 목록(전체 + 카테고리) + 선택 영역의 문제.
  const areas = useMemo(
    () =>
      data ? [ALL, ...new Set(data.questions.map((q) => q.category))] : [],
    [data],
  )
  const battleQuestions = useMemo(() => {
    if (!data || !area) return []
    if (area !== ALL)
      return data.questions
        .filter((qq) => qq.category === area)
        .slice(0, QUESTIONS_PER_BATTLE)
    // 전체: 카테고리를 번갈아 섞어 10문제로 고정.
    const groups = new Map<string, QuizBattleQuestion[]>()
    for (const qq of data.questions) {
      const g = groups.get(qq.category) ?? []
      g.push(qq)
      groups.set(qq.category, g)
    }
    const cats = [...groups.keys()]
    const mixed: QuizBattleQuestion[] = []
    for (let i = 0; mixed.length < QUESTIONS_PER_BATTLE; i++) {
      let added = false
      for (const c of cats) {
        const item = groups.get(c)?.[i]
        if (item) {
          mixed.push(item)
          added = true
          if (mixed.length >= QUESTIONS_PER_BATTLE) break
        }
      }
      if (!added) break
    }
    return mixed
  }, [data, area])
  const total = battleQuestions.length
  const q = battleQuestions[idx]

  // 새 문제마다 선택·단계·타이머 초기화(데이터 로드 시 첫 문제 포함).
  useEffect(() => {
    if (!data) return
    setPicked(null)
    setPhase('answering')
    setRemaining(data.perQuestionSec)
  }, [idx, data])

  // 문제당 카운트다운 — 응답 단계이고 모달(나가기/영역)이 닫혀 있을 때만(미초기화 null은 건너뜀).
  useEffect(() => {
    if (phase !== 'answering' || leaveTo || areaModalOpen || !data) return
    const id = setInterval(() => {
      setRemaining((r) => (r === null ? r : r <= 1 ? 0 : r - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [phase, leaveTo, areaModalOpen, data, idx])

  // 답을 고르거나(또는 시간 종료 시 null) 정오를 공개하고 점수·콤보·상대를 갱신.
  const answer = (opt: number | null) => {
    if (phase !== 'answering' || !data || !q) return
    const correct = opt !== null && opt === q.answerIndex
    const nc = correct ? combo + 1 : 0
    const left = remaining ?? data.perQuestionSec
    elapsedRef.current += data.perQuestionSec - left

    setPicked(opt)
    setPhase('revealed')
    setCombo(nc)
    setMaxCombo((mx) => Math.max(mx, nc))
    if (correct) {
      const timeBonus = Math.round(
        (left / data.perQuestionSec) * TIME_BONUS_MAX,
      )
      const comboBonus = (nc - 1) * COMBO_STEP
      setMyScore((s) => s + BASE_POINTS + timeBonus + comboBonus)
    }
    setReviews((rv) => [
      ...rv,
      {
        index: idx + 1,
        prompt: q.prompt,
        picked: opt,
        answerIndex: q.answerIndex,
        correct,
      },
    ])
    // AI 페이서 — 문제당 정답 확률만큼 점수를 따라온다.
    if (Math.random() < data.rival.accuracy) {
      setRivalCorrect((c) => c + 1)
      setRivalScore((s) => s + RIVAL_POINTS)
    }
  }

  // 시간 종료 → 미응답(오답) 처리. null·모달 중엔 발동하지 않는다.
  useEffect(() => {
    if (remaining === 0 && phase === 'answering' && data && q && !areaModalOpen)
      answer(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, data, areaModalOpen])

  const finish = () => {
    if (submittedRef.current || !data || !q) return
    submittedRef.current = true
    // 미응답 문제는 오답으로 채워 항상 전체 문항 리뷰를 만든다(안전망).
    const answered = new Map(reviews.map((r) => [r.index, r]))
    const full: QuizAnswerReview[] = battleQuestions.map(
      (qq, i) =>
        answered.get(i + 1) ?? {
          index: i + 1,
          prompt: qq.prompt,
          picked: null,
          answerIndex: qq.answerIndex,
          correct: false,
        },
    )
    const correctCount = full.filter((r) => r.correct).length
    pushPlay('quiz', {
      detail: `${area} · 정답 ${correctCount}/${total} · 콤보 ×${maxCombo} · ${myScore.toLocaleString()}점`,
      score: myScore,
    })
    const result: QuizBattleResult = {
      battleId: data.battleId,
      category: area ?? data.category,
      total,
      correct: correctCount,
      maxCombo,
      elapsedSec: elapsedRef.current,
      myScore,
      rivalName: data.rival.name,
      rivalScore,
      rivalCorrect,
      win: myScore >= rivalScore,
      reviews: full,
    }
    navigate('/student/play/quiz/result', { state: { result } })
  }

  if (isPending)
    return <div className="text-fg-muted p-8">배틀을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="배틀을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 영역 선택 → 배틀 상태 초기화.
  const pickArea = (A: string) => {
    setArea(A)
    setIdx(0)
    setPicked(null)
    setPhase('answering')
    setRemaining(data.perQuestionSec)
    setCombo(0)
    setMaxCombo(0)
    setMyScore(0)
    setRivalScore(0)
    setRivalCorrect(0)
    setReviews([])
    elapsedRef.current = 0
    submittedRef.current = false
    setAreaModalOpen(false)
  }

  const isLast = idx === total - 1
  const correctSoFar = reviews.filter((r) => r.correct).length
  const wrongSoFar = reviews.length - correctSoFar
  const leading = myScore >= rivalScore

  const stats = [
    {
      label: '남은 시간',
      value: fmtTime(remaining ?? data.perQuestionSec),
      sub: q ? `문제당 ${data.perQuestionSec}초` : '영역 선택 대기',
    },
    { label: '콤보', value: `×${combo}`, sub: `최대 ×${maxCombo}` },
    { label: '맞은 문제', value: `${correctSoFar}`, sub: `오답 ${wrongSoFar}` },
    {
      label: '예상 점수',
      value: myScore.toLocaleString(),
      sub: '제출 시 서버 재계산',
    },
  ]

  const optClass = (i: number) => {
    if (phase === 'answering')
      return 'border-border hover:border-brand cursor-pointer'
    if (q && i === q.answerIndex) return 'border-success bg-success-bg'
    if (i === picked) return 'border-danger bg-danger-bg'
    return 'border-border opacity-50'
  }
  const chipClass = (i: number) => {
    if (phase === 'revealed' && q && i === q.answerIndex)
      return 'bg-success text-white'
    if (phase === 'revealed' && i === picked) return 'bg-danger text-white'
    return 'bg-surface-muted text-fg-subtle'
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <StatStrip stats={stats} />

      {q ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row">
            <section className={cn(card, 'flex flex-1 flex-col gap-4')}>
              <div className="flex items-center gap-2">
                <span className="text-fg text-[15px] font-bold">
                  문제 {idx + 1} / {total}
                </span>
                <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
                  {q.category} · {q.difficulty}
                </span>
                <button
                  type="button"
                  onClick={() => setAreaModalOpen(true)}
                  className="border-border text-fg-muted hover:border-brand hover:text-brand ml-auto rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                >
                  영역 변경
                </button>
              </div>
              <p className="text-fg min-h-[52px] text-[16px] leading-7 font-semibold">
                {q.prompt}
              </p>

              <div className="flex flex-col gap-2">
                <span className="text-fg-subtle text-[12px] font-semibold">
                  보기 선택
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => answer(i)}
                      disabled={phase === 'revealed'}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default',
                        optClass(i),
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold',
                          chipClass(i),
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-fg text-[13px]">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {phase === 'revealed' && (
                <div
                  className={cn(
                    'flex flex-col gap-1 rounded-xl p-3.5',
                    picked === q.answerIndex
                      ? 'bg-success-bg/60'
                      : 'bg-danger-bg/50',
                  )}
                >
                  <span
                    className={cn(
                      'text-[12px] font-bold',
                      picked === q.answerIndex ? 'text-success' : 'text-danger',
                    )}
                  >
                    {picked === null
                      ? '시간 초과 — 오답 처리'
                      : picked === q.answerIndex
                        ? '정답!'
                        : '오답'}
                    {' · 정답: '}
                    {String.fromCharCode(65 + q.answerIndex)}
                  </span>
                  <span className="text-fg-muted text-[11px] leading-5">
                    {q.explanation}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setLeaveTo('/student/play')}
                  className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold"
                >
                  저장하지 않고 나가기
                </button>
                <button
                  type="button"
                  onClick={() => (isLast ? finish() : setIdx((i) => i + 1))}
                  disabled={phase !== 'revealed'}
                  className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLast ? '결과 보기' : '다음 문제'}
                </button>
              </div>
            </section>

            <section className={cn(card, 'flex flex-col gap-3 lg:w-[300px]')}>
              <span className="text-fg text-[15px] font-bold">배틀 정보</span>
              {[
                { label: '배틀 ID', value: data.battleId },
                { label: '상대', value: data.rival.name },
                { label: '영역', value: area ?? data.category },
                { label: '내 점수', value: myScore.toLocaleString() },
                { label: '상대 점수', value: rivalScore.toLocaleString() },
                { label: '보상', value: data.reward },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="text-fg-subtle">{r.label}</span>
                  <span className="text-fg font-semibold">{r.value}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAreaModalOpen(true)}
                className="border-border text-fg mt-1 rounded-lg border py-2.5 text-[12px] font-semibold"
              >
                영역 변경
              </button>
            </section>
          </div>

          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[15px] font-bold">
              실시간 스코어보드
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  name: '나 (김민준)',
                  detail: `정답 ${correctSoFar} · 콤보 ×${combo} · ${myScore.toLocaleString()}점`,
                  me: true,
                },
                {
                  name: data.rival.name,
                  detail: `정답 ${rivalCorrect} · ${rivalScore.toLocaleString()}점`,
                  me: false,
                },
                {
                  name: '남은 문제',
                  detail: `${total - reviews.length}문제 · 현재 ${leading ? '1위' : '2위'}`,
                  me: false,
                },
              ].map((c) => (
                <div
                  key={c.name}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-[12px] border p-4',
                    c.me ? 'border-brand/40 bg-brand/5' : 'border-border',
                  )}
                >
                  <span className="text-fg text-[13px] font-bold">
                    {c.name}
                  </span>
                  <span className="text-fg-muted text-[11px]">{c.detail}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className={cn(card, 'flex flex-col items-center gap-3 py-16')}>
          <span className="text-fg text-[15px] font-bold">
            영역을 선택하면 시작돼요
          </span>
          <span className="text-fg-subtle text-[12px]">
            전체 또는 운영체제 · 네트워크 · 자료구조 중 하나를 골라 배틀을
            시작합니다.
          </span>
          <Button onClick={() => setAreaModalOpen(true)}>영역 선택</Button>
        </section>
      )}

      <Modal
        open={leaveTo !== null}
        onClose={() => setLeaveTo(null)}
        title="배틀을 나갈까요?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeaveTo(null)}>
              계속하기
            </Button>
            <Button
              onClick={() => {
                const to = leaveTo
                setLeaveTo(null)
                if (to) navigate(to)
              }}
            >
              나가기
            </Button>
          </>
        }
      >
        지금 나가면 현재 점수와 진행 상황은 저장되지 않습니다.
      </Modal>

      <Modal
        open={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        title="영역 선택"
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-[13px] leading-5">
            어떤 영역의 문제를 풀까요? 선택한 영역의 문제로 배틀이 진행됩니다.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {areas.map((A) => {
              const count =
                A === ALL
                  ? QUESTIONS_PER_BATTLE
                  : Math.min(
                      QUESTIONS_PER_BATTLE,
                      data.questions.filter((qq) => qq.category === A).length,
                    )
              const on = A === area
              return (
                <button
                  key={A}
                  type="button"
                  onClick={() => pickArea(A)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors',
                    on
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand',
                  )}
                >
                  <span className="text-fg text-[15px] font-bold">{A}</span>
                  <span className="text-fg-subtle text-[11px]">
                    {count}문제
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}
