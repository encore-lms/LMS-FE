import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { usePlayCoding } from '../api/play'
import { StatStrip } from './StatStrip'
import { pushPlay } from './history'
import { card, fmtTime } from './shared'
import type { CodingFormat, CodingProblem, CodingTestResult } from './types'

// PLAY 코딩 테스트 (/student/play/coding) — Figma 4911:6913 · 결과 4917:7092.
// 언어(Java/Python/C) 선택 → 5문제(빈칸·출력 예측·핵심 코드) → 제출/재시도 → 전체 30분 안에 점수.
const QUESTIONS_PER_TEST = 5

const FORMAT_LABEL: Record<CodingFormat, string> = {
  'fill-blank': '빈칸 채우기',
  'predict-output': '출력 예측',
  'write-code': '핵심 코드 작성',
}
const INPUT_LABEL: Record<CodingFormat, string> = {
  'fill-blank': '빈칸 입력',
  'predict-output': '출력 입력',
  'write-code': '답안 작성',
}

const normCode = (s: string) => s.toLowerCase().replace(/\s+/g, '')
const normOut = (s: string) =>
  s
    .replace(/\r/g, '')
    .replace(/[ \t]+$/gm, '')
    .trim()

// 결정적 채점 — 출력 예측·빈칸은 정답 후보 일치, 핵심 코드는 필수 토큰 모두 포함.
function checkAnswer(p: CodingProblem, input: string): boolean {
  if (!input.trim()) return false
  if (p.format === 'predict-output')
    return p.accept.some((a) => normOut(a) === normOut(input))
  const ni = normCode(input)
  if (p.format === 'write-code')
    return p.accept.every((a) => ni.includes(normCode(a)))
  return p.accept.some((a) => ni === normCode(a)) // fill-blank
}

export default function PlayCodingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = usePlayCoding()
  usePageHeader(
    '코딩 테스트',
    '언어를 선택하고 5문제를 푸세요. 빈칸·출력 예측·핵심 코드 작성이 섞여 출제되며 난이도별 배점이 다릅니다.',
  )

  const [lang, setLang] = useState<string | null>(null)
  const [langModalOpen, setLangModalOpen] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [solved, setSolved] = useState<Record<string, boolean>>({})
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'wrong'>>(
    {},
  )
  // null = 아직 미초기화 — 0으로 시작하면 마운트 직후 "시간 종료"로 오인되므로 null로 둔다.
  const [remaining, setRemaining] = useState<number | null>(null)
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  const submittedRef = useRef(false)

  const langs = useMemo(
    () => (data ? [...new Set(data.problems.map((p) => p.language))] : []),
    [data],
  )
  const problems = useMemo(
    () =>
      data && lang
        ? data.problems
            .filter((p) => p.language === lang)
            .slice(0, QUESTIONS_PER_TEST)
        : [],
    [data, lang],
  )
  const p = problems[current]
  const total = problems.length

  // 세션 로드 시 전체 타이머 1회 초기화(매 진입 시 fresh 시작).
  useEffect(() => {
    if (data) setRemaining(data.durationSec)
  }, [data])

  // 전체 카운트다운 — 모달(나가기/언어)이 닫혀 있을 때만(미초기화 null은 건너뜀).
  useEffect(() => {
    if (leaveTo || langModalOpen || !data) return
    const id = setInterval(() => {
      setRemaining((r) => (r === null ? r : r <= 1 ? 0 : r - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [leaveTo, langModalOpen, data])

  const solvedCount = problems.filter((q) => solved[q.id]).length
  const totalAttempts = problems.reduce((s, q) => s + (attempts[q.id] ?? 0), 0)
  const score = problems
    .filter((q) => solved[q.id])
    .reduce((s, q) => s + q.points, 0)
  const elapsedSec =
    data && remaining !== null ? data.durationSec - remaining : 0

  const finish = () => {
    if (submittedRef.current || !data || !lang) return
    submittedRef.current = true
    const results = problems.map((q, i) => ({
      index: i + 1,
      title: q.title,
      format: q.format,
      difficulty: q.difficulty,
      points: q.points,
      solved: !!solved[q.id],
      attempts: attempts[q.id] ?? 0,
      solution: q.solution,
    }))
    pushPlay('coding', {
      detail: `${lang} · ${solvedCount}/${total} 해결 · ${score.toLocaleString()}점`,
      score,
    })
    const result: CodingTestResult = {
      testId: data.testId,
      language: lang,
      durationSec: data.durationSec,
      elapsedSec,
      total,
      solved: solvedCount,
      attempts: totalAttempts,
      score,
      results,
    }
    navigate('/student/play/coding/result', { state: { result } })
  }

  // 전체 시간 종료 → 즉시 종료.
  useEffect(() => {
    if (remaining === 0 && data && lang && !submittedRef.current) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, data, lang])

  const pickLang = (L: string) => {
    setLang(L)
    setCurrent(0)
    setAnswers({})
    setSolved({})
    setAttempts({})
    setFeedback({})
    setRemaining(data?.durationSec ?? 0)
    submittedRef.current = false
    setLangModalOpen(false)
  }

  const submit = () => {
    if (!p) return
    const correct = checkAnswer(p, answers[p.id] ?? '')
    setAttempts((a) => ({ ...a, [p.id]: (a[p.id] ?? 0) + 1 }))
    if (correct) {
      setSolved((s) => ({ ...s, [p.id]: true }))
      setFeedback((f) => ({ ...f, [p.id]: 'correct' }))
      toast.success(`정답! ${p.points.toLocaleString()}점 획득`)
    } else {
      setFeedback((f) => ({ ...f, [p.id]: 'wrong' }))
      toast.warning('오답이에요. 정답을 맞힐 때까지 다시 제출할 수 있어요.')
    }
  }

  const stats = [
    {
      label: '남은 시간',
      value: fmtTime(remaining ?? data?.durationSec ?? 0),
      sub: lang ? '전체 30분' : '언어 선택 대기',
    },
    {
      label: '해결 문제',
      value: `${solvedCount} / ${total || QUESTIONS_PER_TEST}`,
      sub: `남은 ${(total || QUESTIONS_PER_TEST) - solvedCount}문제`,
    },
    {
      label: '통과율',
      value: `${total ? Math.round((solvedCount / total) * 100) : 0}%`,
      sub: `시도 ${totalAttempts}회`,
    },
    {
      label: '예상 점수',
      value: score.toLocaleString(),
      sub: '제출 시 서버 재계산',
    },
  ]

  const fb = p ? feedback[p.id] : undefined
  const isSolved = p ? !!solved[p.id] : false

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="테스트를 불러오는 중…"
      errorTitle="테스트를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8">
          <StatStrip stats={stats} />

          {p ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row">
                <section className={cn(card, 'flex flex-1 flex-col gap-4')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-fg text-[15px] font-bold">
                      문제 {current + 1} / {total}
                    </span>
                    <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
                      {FORMAT_LABEL[p.format]}
                    </span>
                    <span className="bg-surface-muted text-fg-subtle rounded px-2 py-0.5 text-[11px] font-semibold">
                      {p.difficulty}
                    </span>
                    <span className="bg-accent-bg text-accent-strong rounded px-2 py-0.5 text-[11px] font-bold">
                      {p.points.toLocaleString()}점
                    </span>
                    {isSolved && (
                      <span className="bg-success-bg text-success rounded px-2 py-0.5 text-[11px] font-bold">
                        ✓ 통과
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLangModalOpen(true)}
                      className="border-border text-fg-muted hover:border-brand hover:text-brand ml-auto rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                    >
                      언어 변경
                    </button>
                  </div>

                  <p className="text-fg text-[14px] leading-6">{p.prompt}</p>

                  {p.code && (
                    <pre className="bg-surface-muted/50 text-fg overflow-x-auto rounded-xl p-4 font-mono text-[13px] leading-[20px] whitespace-pre">
                      {p.code}
                    </pre>
                  )}

                  <div className="flex flex-col gap-2">
                    <span className="text-fg text-[15px] font-bold">
                      {INPUT_LABEL[p.format]}
                    </span>
                    <textarea
                      value={answers[p.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, [p.id]: e.target.value }))
                      }
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      placeholder={
                        p.format === 'predict-output'
                          ? '실행 결과(출력)를 입력하세요. 줄바꿈도 그대로 입력합니다.'
                          : p.format === 'fill-blank'
                            ? '빈칸(____)에 들어갈 코드를 입력하세요.'
                            : '코드를 작성하세요. 오답이면 정답을 맞힐 때까지 다시 제출할 수 있어요.'
                      }
                      className="border-border bg-surface text-fg focus:border-brand min-h-[110px] w-full resize-none rounded-xl border px-4 py-3 font-mono text-[13px] leading-6 focus:outline-none focus-visible:shadow-none"
                    />
                  </div>

                  {fb === 'correct' && (
                    <div className="bg-success-bg/60 flex flex-col gap-1 rounded-xl p-3.5">
                      <span className="text-success text-[12px] font-bold">
                        정답! · 통과 (+{p.points.toLocaleString()}점)
                      </span>
                      <span className="text-fg-muted font-mono text-[11px]">
                        정답 예시: {p.solution}
                      </span>
                    </div>
                  )}
                  {fb === 'wrong' && !isSolved && (
                    <div className="bg-danger-bg/50 flex flex-col gap-1 rounded-xl p-3.5">
                      <span className="text-danger text-[12px] font-bold">
                        오답 — 다시 제출해 보세요 (시도 {attempts[p.id] ?? 0}회)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrent((i) => Math.max(0, i - 1))}
                        disabled={current === 0}
                        className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        이전
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrent((i) => Math.min(total - 1, i + 1))
                        }
                        disabled={current === total - 1}
                        className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        다음
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={submit}
                      className={buttonClass({ size: 'md' })}
                    >
                      제출
                    </button>
                  </div>
                </section>

                <section
                  className={cn(card, 'flex flex-col gap-3 lg:w-[300px]')}
                >
                  <span className="text-fg text-[15px] font-bold">
                    테스트 정보
                  </span>
                  {[
                    { label: '테스트 ID', value: data.testId },
                    { label: '언어', value: lang ?? '-' },
                    { label: '배점 기준', value: '난이도별 차등' },
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
                  <Button size="sm" onClick={finish} className="mt-1">
                    테스트 종료 · 결과 보기
                  </Button>
                  <button
                    type="button"
                    onClick={() => setLeaveTo('/student/play')}
                    className="border-border text-fg rounded-lg border py-2.5 text-[12px] font-semibold"
                  >
                    저장하지 않고 나가기
                  </button>
                </section>
              </div>

              <section className={cn(card, 'flex flex-col gap-3')}>
                <span className="text-fg text-[15px] font-bold">
                  문제 목록 · {lang} ({total}문제)
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {problems.map((q, i) => {
                    const st = solved[q.id]
                      ? '통과'
                      : i === current
                        ? '진행 중'
                        : (attempts[q.id] ?? 0) > 0
                          ? '미해결'
                          : '시작 전'
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrent(i)}
                        className={cn(
                          'flex flex-col gap-2 rounded-[12px] border p-4 text-left transition-colors',
                          i === current
                            ? 'border-brand bg-brand/5'
                            : 'border-border hover:border-brand',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-fg text-[13px] font-bold">
                            {i + 1}. {q.title}
                          </span>
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold',
                              solved[q.id]
                                ? 'bg-success-bg text-success'
                                : 'bg-surface-muted text-fg-subtle',
                            )}
                          >
                            {solved[q.id] ? '✓ 통과' : st}
                          </span>
                        </div>
                        <span className="text-fg-subtle text-[11px]">
                          {FORMAT_LABEL[q.format]} · {q.difficulty} ·{' '}
                          {q.points.toLocaleString()}점
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </>
          ) : (
            <section
              className={cn(card, 'flex flex-col items-center gap-3 py-16')}
            >
              <span className="text-fg text-[15px] font-bold">
                언어를 선택하면 시작돼요
              </span>
              <span className="text-fg-subtle text-[12px]">
                Java · Python · C 중 하나를 골라 5문제 코딩 테스트를 시작합니다.
              </span>
              <Button onClick={() => setLangModalOpen(true)}>언어 선택</Button>
            </section>
          )}

          <Modal
            open={leaveTo !== null}
            onClose={() => setLeaveTo(null)}
            title="테스트를 나갈까요?"
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
            지금 나가면 현재 풀이와 진행 시간은 저장되지 않습니다.
          </Modal>

          <Modal
            open={langModalOpen}
            onClose={() => setLangModalOpen(false)}
            title="언어 선택"
            size="sm"
          >
            <div className="flex flex-col gap-3">
              <p className="text-fg-muted text-[13px] leading-5">
                어떤 언어로 코딩 테스트를 볼까요? 언어별 5문제가 출제됩니다.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {langs.map((L) => {
                  const count = Math.min(
                    QUESTIONS_PER_TEST,
                    data.problems.filter((q) => q.language === L).length,
                  )
                  const on = L === lang
                  return (
                    <button
                      key={L}
                      type="button"
                      onClick={() => pickLang(L)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors',
                        on
                          ? 'border-brand bg-brand/5'
                          : 'border-border hover:border-brand',
                      )}
                    >
                      <span className="text-fg text-[15px] font-bold">{L}</span>
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
      )}
    </DataBoundary>
  )
}
