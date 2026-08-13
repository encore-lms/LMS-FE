import { timeLimitLabel } from '@/shared/lib/quizTimeLimit'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useQuizResult, useStudentQuizzes } from '../api/quiz'
import { ResultSummary } from './result/ResultSummary'
import { QuestionResultRow } from './result/QuestionResultRow'

type Filter = 'all' | 'wrong' | 'pending' | 'feedback'

/**
 * 퀴즈 결과 (/student/quizzes/:quizId/result) — 쉘 포함. 요약·카테고리별 점수·문제별 결과.
 * useQuizResult(answers) 기반으로 점수/정답률/카테고리를 파생 계산한다.
 */
export default function QuizResultPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useQuizResult(quizId)
  const { data: list } = useStudentQuizzes()
  const [filter, setFilter] = useState<Filter>('all')
  usePageHeader('퀴즈 결과')

  const quiz = list?.find((it) => it.quiz.id === quizId)?.quiz

  const stat = useMemo(() => {
    const answers = data?.answers ?? []
    const earned = answers.reduce((s, a) => s + a.earnedPoints, 0)
    const max = answers.reduce((s, a) => s + a.maxPoints, 0)
    const pending = answers.filter((a) => a.pending).length
    const correct = answers.filter((a) => !a.pending && a.isCorrect).length
    const wrong = answers.filter((a) => !a.pending && !a.isCorrect).length
    const feedback = answers.filter((a) => a.feedback).length
    const byCat = new Map<string, { earned: number; max: number }>()
    answers.forEach((a) => {
      const c = byCat.get(a.categoryId) ?? { earned: 0, max: 0 }
      c.earned += a.earnedPoints
      c.max += a.maxPoints
      byCat.set(a.categoryId, c)
    })
    const CAT_ORDER = [
      '객체지향 설계',
      'JPA 영속성 컨텍스트',
      '트랜잭션/격리 수준',
      'Querydsl & 동적 쿼리',
    ]
    const categories = [...byCat.entries()]
      .map(([name, v]) => ({
        name,
        score: v.max > 0 ? Math.round((v.earned / v.max) * 100) : 0,
      }))
      .sort((a, b) => CAT_ORDER.indexOf(a.name) - CAT_ORDER.indexOf(b.name))
    return {
      answers,
      earned,
      max,
      correct,
      wrong,
      pending,
      feedback,
      total: answers.length,
      categories,
    }
  }, [data])

  const pendingManual = data?.submission.gradingStatus === 'pending_manual'
  const reattemptsLeft = Math.max(
    0,
    (quiz?.maxAttempts ?? 1) - (data?.submission.attemptNo ?? 0),
  )
  const filtered = stat.answers.filter((a) =>
    filter === 'all'
      ? true
      : filter === 'wrong'
        ? !a.pending && !a.isCorrect
        : filter === 'feedback'
          ? !!a.feedback
          : filter === 'pending'
            ? !!a.pending
            : false,
  )

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: `전체 (${stat.total})` },
    { key: 'wrong', label: `오답 (${stat.wrong})` },
    { key: 'pending', label: `채점 대기 (${stat.pending})` },
    { key: 'feedback', label: `피드백 (${stat.feedback})` },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="결과를 불러오는 중…"
      errorTitle="결과를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8">
          {/* 메타 행 */}
          <div className="text-fg flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
            <Meta
              label="제출 시각"
              value={data.submission.submittedAt.replace('T', ' ').slice(0, 16)}
            />
            <Meta
              label="응시 회차"
              value={`${data.submission.attemptNo} / ${quiz?.maxAttempts ?? '-'}`}
            />
            {quiz && (
              <Meta
                label="제한 시간"
                value={timeLimitLabel(quiz.timeLimitMinutes)}
              />
            )}
            {pendingManual && (
              <span className="bg-warning-bg text-warning ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold">
                <span className="bg-warning size-1.5 rounded" />
                수동 채점 대기
              </span>
            )}
          </div>

          <ResultSummary
            earned={data.submission.totalScore}
            max={stat.max}
            correct={stat.correct}
            wrong={stat.wrong}
            pending={stat.pending}
            notAnswered={0}
            total={stat.total}
            autoGradedCount={stat.total - stat.pending}
            reattemptsLeft={reattemptsLeft}
          />

          {/* 카테고리별 점수 */}
          {stat.categories.length > 0 && (
            <section className="bg-surface flex flex-col gap-4 rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
              <div className="flex flex-col gap-1">
                <h2 className="text-fg text-[15px] font-semibold">
                  카테고리별 점수
                </h2>
                <p className="text-fg-muted text-[12px]">
                  문항별 카테고리는 역량 증명서의 세부 지표와 연결됩니다
                </p>
              </div>
              {stat.categories.map((c) => (
                <div key={c.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-fg font-medium">{c.name}</span>
                    <span
                      className={cn(
                        'font-semibold',
                        c.score < 70 ? 'text-warning' : 'text-brand',
                      )}
                    >
                      {c.score}점
                    </span>
                  </div>
                  <div className="bg-surface-muted border-border h-2 w-full overflow-hidden rounded border">
                    <div
                      className={cn(
                        'h-full rounded',
                        c.score < 70 ? 'bg-warning' : 'bg-brand',
                      )}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* 문제별 결과 */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-5">
              <h2 className="text-fg text-[15px] font-semibold">문제별 결과</h2>
              <p className="text-fg-muted text-[12px]">
                총 {stat.total}문항 · 피드백이 있는 답안은 강조 표시됩니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[12px] font-semibold',
                    filter === f.key
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-fg-muted bg-surface',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <Empty title="해당하는 문항이 없어요" />
            ) : (
              filtered.map((a, i) => (
                <QuestionResultRow key={a.questionId} num={i + 1} answer={a} />
              ))
            )}
          </div>

          {/* 액션 */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate('/student/quizzes')}
              className="border-border text-fg-muted rounded-[10px] border px-4 py-3 text-[13px] font-semibold"
            >
              퀴즈 목록으로
            </button>
            <div className="flex items-center gap-3">
              {reattemptsLeft > 0 && (
                <button
                  type="button"
                  onClick={() => navigate(`/student/quizzes/${quizId}/take`)}
                  className="border-accent-strong text-accent-strong rounded-[10px] border px-4 py-3 text-[13px] font-semibold"
                >
                  재응시 ({reattemptsLeft}회 남음)
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/student/quizzes')}
                className={buttonClass({ size: 'md', className: 'px-10' })}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-fg-subtle">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </span>
  )
}
