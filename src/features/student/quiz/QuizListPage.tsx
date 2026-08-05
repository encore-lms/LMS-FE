import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { useCourseHubHeader } from '../course/useCourseHubHeader'
import { useStudentQuizzes } from '../api/quiz'
import { CourseTabs } from '../course/CourseTabs'
import type { StudentQuizListItem } from './types'
import { QuizStatusChips, type QuizStatus } from './list/QuizStatusChips'
import { AvailableQuizRow } from './list/AvailableQuizRow'
import { OtherStatusRow } from './list/OtherStatusRow'
import { SearchInput } from '@/components/ui/SearchInput'

const STATUS_LABEL: Record<QuizStatus, string> = {
  available: '응시 가능',
  scheduled: '응시 예정',
  completed: '완료',
  pending_manual: '채점 대기',
  closed: '기간 종료',
}

/**
 * 수강생 퀴즈 목록 (/student/quizzes) — 나의 과정 '퀴즈' 탭. Figma 226:27.
 * 상태 칩(응시가능/응시예정/완료/채점대기/기간종료) + 검색. 응시가능 뷰는 카드 2개(응시가능 + 다른 상태 미리보기).
 */
export default function QuizListPage() {
  const navigate = useNavigate()
  // 대시보드('마감 임박 퀴즈'·'이번 주 할 일')가 퀴즈 하나를 짚어 보낸다 — 그 퀴즈만 여는
  // 화면은 없으므로 목록에서 찾아 준다.
  const { quizId } = useParams()
  const { data, isPending, isError, refetch } = useStudentQuizzes()
  useCourseHubHeader()
  const [status, setStatus] = useState<QuizStatus>('available')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const items = (data as StudentQuizListItem[]) ?? []

  // 짚어 온 퀴즈가 지금 칩에 없으면 안 보인다 — 그 퀴즈가 있는 칩으로 옮기고 그 줄로 데려간다.
  const focused = quizId ? items.find((it) => it.quiz.id === quizId) : undefined
  useEffect(() => {
    if (focused) setStatus(focused.state as QuizStatus)
  }, [focused])
  useEffect(() => {
    if (!quizId) return
    document
      .querySelector(`[data-quiz-id="${CSS.escape(quizId)}"]`)
      ?.scrollIntoView?.({ block: 'center' })
  }, [quizId, status, items.length])
  const counts: Record<QuizStatus, number> = {
    available: items.filter((q) => q.state === 'available').length,
    scheduled: items.filter((q) => q.state === 'scheduled').length,
    completed: items.filter((q) => q.state === 'completed').length,
    pending_manual: items.filter((q) => q.state === 'pending_manual').length,
    closed: items.filter((q) => q.state === 'closed').length,
  }
  const q = query.trim().toLowerCase()
  const match = (it: StudentQuizListItem) =>
    q === '' || it.quiz.title.toLowerCase().includes(q)

  const available = items.filter((it) => it.state === 'available' && match(it))
  const others = items.filter((it) => it.state !== 'available' && match(it))
  const single = items.filter((it) => it.state === status && match(it))

  // 짚어 온 줄만 옅게 물들인다 — 목록이 길어 어느 줄을 보라는 건지 알기 어렵다.
  const focusRing = (it: StudentQuizListItem) =>
    it.quiz.id === quizId ? 'bg-brand/[0.06]' : undefined

  const goTake = (id: string) => navigate(`/student/quizzes/${id}/take`)
  const goResult = (id: string) => navigate(`/student/quizzes/${id}/result`)

  const pageCount = Math.max(1, Math.ceil(items.length / 10))
  const curPage = Math.min(page, pageCount)

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />

      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        errorTitle="퀴즈를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* 상태 필터 + 검색 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuizStatusChips
            counts={counts}
            active={status}
            onChange={setStatus}
          />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="퀴즈명 검색"
            ariaLabel="퀴즈 검색"
            className="h-[38px] w-[260px] rounded-[10px] px-3.5"
          />
        </div>

        {status === 'available' ? (
          <>
            {/* 응시 가능 퀴즈 */}
            <section className="bg-surface flex w-full flex-col rounded-2xl">
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-warning size-2 rounded-full" />
                  <h2 className="text-fg text-[15px] font-bold">
                    응시 가능 퀴즈
                  </h2>
                  <span className="bg-warning-bg text-warning rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold">
                    {available.length}건
                  </span>
                </div>
                <span className="text-fg-subtle text-[11px] font-medium">
                  최신순 정렬
                </span>
              </div>
              {available.length === 0 ? (
                <div className="px-6 pb-6">
                  <Empty title="응시 가능한 퀴즈가 없어요" />
                </div>
              ) : (
                available.map((it, i) => (
                  <Fragment key={it.quiz.id}>
                    {i > 0 && <div className="bg-divider h-px w-full" />}
                    <div data-quiz-id={it.quiz.id} className={focusRing(it)}>
                      <AvailableQuizRow
                        item={it}
                        onTake={() => goTake(it.quiz.id)}
                      />
                    </div>
                  </Fragment>
                ))
              )}
            </section>

            {/* 다른 상태 미리보기 */}
            {others.length > 0 && (
              <section className="bg-surface flex w-full flex-col rounded-2xl">
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-fg text-[15px] font-bold">
                      다른 상태 미리보기
                    </h2>
                    <span className="text-fg-muted text-[11px]">
                      응시 예정·완료·채점 대기·기간 종료
                    </span>
                  </div>
                  <span className="text-brand text-[12px] font-semibold">
                    전체 보기 →
                  </span>
                </div>
                {others.map((it, i) => (
                  <Fragment key={it.quiz.id}>
                    {i > 0 && <div className="bg-divider h-px w-full" />}
                    <div data-quiz-id={it.quiz.id} className={focusRing(it)}>
                      <OtherStatusRow
                        item={it}
                        onResult={() => goResult(it.quiz.id)}
                      />
                    </div>
                  </Fragment>
                ))}
              </section>
            )}
          </>
        ) : (
          /* 단일 상태 필터 뷰 */
          <section className="bg-surface flex w-full flex-col rounded-2xl">
            <div className="flex items-center gap-2 px-6 pt-5 pb-4">
              <h2 className="text-fg text-[15px] font-bold">
                {STATUS_LABEL[status]} 퀴즈
              </h2>
              <span className="bg-surface-muted text-fg-muted rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold">
                {single.length}건
              </span>
            </div>
            {single.length === 0 ? (
              <div className="px-6 pb-6">
                <Empty title={`${STATUS_LABEL[status]} 퀴즈가 없어요`} />
              </div>
            ) : (
              single.map((it, i) => (
                <Fragment key={it.quiz.id}>
                  {i > 0 && <div className="bg-divider h-px w-full" />}
                  <div data-quiz-id={it.quiz.id} className={focusRing(it)}>
                    <OtherStatusRow
                      item={it}
                      onResult={() => goResult(it.quiz.id)}
                    />
                  </div>
                </Fragment>
              ))
            )}
          </section>
        )}

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between">
          <p className="text-fg-muted text-[12px] font-medium">
            총 {items.length}건 · 응시 가능 {counts.available}건
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="이전"
              onClick={() => setPage(Math.max(1, curPage - 1))}
              className="border-border text-fg-muted flex size-9 items-center justify-center rounded-lg border text-[12px] font-medium"
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === curPage ? 'page' : undefined}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg text-[12px] font-medium',
                  p === curPage
                    ? 'bg-brand-deep text-white'
                    : 'border-border text-fg-muted border',
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              aria-label="다음"
              onClick={() => setPage(Math.min(pageCount, curPage + 1))}
              className="border-border text-fg-muted flex size-9 items-center justify-center rounded-lg border text-[12px] font-medium"
            >
              ›
            </button>
          </div>
        </div>
      </DataBoundary>
    </div>
  )
}
