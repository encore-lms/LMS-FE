import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import { useQnaList } from '../api/qna'
import { useQnaBase } from './useQnaBase'
import { QnaQuestionCard } from './components/QnaQuestionCard'
import type { QnaQuestion } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { TONE_SOLID } from '@/shared/lib/tone'
import { SearchInput } from '@/components/ui/SearchInput'
import { CourseTabs } from '../course/CourseTabs'
import { useCourseHubHeader } from '../course/useCourseHubHeader'

const PAGE_SIZE = 4

// 수강생 QnA 게시판 목록 (/student/qna) — 트러블슈팅 목록 패턴 차용(검색·필터·페이지네이션).
// embedded=true 면 기수 허브의 'QnA' 탭에 임베드(자체 헤더·바깥 패딩 생략).
export default function QnaListPage({
  embedded = false,
  backTo,
}: {
  embedded?: boolean
  /** 임베드 시 상세에서 돌아올 곳. 없으면 상세가 자기 마운트 위치의 목록으로 돌아간다. */
  backTo?: string
} = {}) {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useQnaList()
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [active, query])
  // 운영(/admin/qna)·강사(/instructor/qna)에서도 같은 화면을 쓴다 — 이동 경로는 마운트 위치를 따르고,
  // 질문 작성은 수강생 전용이라 나머지 역할에선 숨긴다(BE도 작성 엔드포인트를 열지 않는다).
  const base = useQnaBase()
  const canAsk = base === '/student/qna'
  // 수강생 마운트는 허브 공통 헤더(과정명/기간, 3역할 통일 2026-08-05),
  // 스태프 단독 라우트(/admin·/instructor/qna)는 기존 화면 제목 유지. 훅 규칙상 둘 다 호출하고 enabled 로 가른다.
  useCourseHubHeader(!embedded && canAsk)
  usePageHeader(
    'QnA 게시판',
    base === '/instructor/qna'
      ? '담당 기수 수강생이 올린 질문을 확인하고 답변해 주세요.'
      : '강의·과제·환경설정·진로 궁금증을 동료·멘토·강사와 함께 풀어요.',
    !embedded && !canAsk,
  )

  // 상세는 허브 밖 라우트라, 허브에서 열었으면 돌아올 곳을 들려 보낸다.
  const open = (q: QnaQuestion) =>
    navigate(
      backTo
        ? `${base}/${q.id}?from=${encodeURIComponent(backTo)}`
        : `${base}/${q.id}`,
    )

  const q = query.trim().toLowerCase()
  const visible = (data?.questions ?? []).filter((item) => {
    if (active !== 'all' && item.categoryKey !== active) return false
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    )
  })
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageItems = visible.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  )

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={<SkeletonListPage columns={4} className="" />}
      errorTitle="불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      {data && (
        <div
          className={
            embedded ? 'flex flex-col gap-5' : 'flex flex-col gap-5 p-8'
          }
        >
          {/* 교육과정 허브 탭바 — 수강생 단독 화면에서만(허브 임베드는 바깥 탭이 담당). */}
          {!embedded && <CourseTabs />}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <h2 className="text-fg text-[16px] font-bold">질문 목록</h2>
              <span className="text-fg-subtle text-[12px]">
                {data.questions.length}건
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="제목·내용·태그 검색"
                ariaLabel="질문 검색"
                className="hidden w-[220px] sm:flex"
              />
              {canAsk && (
                <button
                  type="button"
                  onClick={() => navigate('/student/qna/new')}
                  className={buttonClass({ size: 'md' })}
                >
                  + 질문하기
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {data.filters.map((f) => {
                const on = f.key === active
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActive(f.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                      on
                        ? 'bg-brand-deep text-white'
                        : 'border-border text-fg-muted hover:bg-surface-muted border',
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        'text-[12px]',
                        on ? 'text-white/70' : 'text-fg-subtle',
                      )}
                    >
                      {f.count}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {data.statusFilters.map((f) => (
                <span
                  key={f.key}
                  className="text-fg-muted flex items-center gap-1.5 text-[12px] font-medium"
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      TONE_SOLID[f.tone ?? 'brand'],
                    )}
                  />
                  {f.label}
                  <span className="text-fg font-bold">{f.count}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {visible.length === 0 && (
              <div className="border-border text-fg-subtle rounded-2xl border border-dashed p-10 text-center text-[13px]">
                검색·필터 조건에 맞는 질문이 없어요.
              </div>
            )}
            {pageItems.map((item) => (
              <QnaQuestionCard key={item.id} q={item} onOpen={open} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-fg-subtle text-[12px]">
              {visible.length}건 중 {pageItems.length}건 표시
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="이전 페이지"
                className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px] disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === pageSafe ? 'page' : undefined}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                    n === pageSafe
                      ? 'bg-brand-deep text-white'
                      : 'border-border text-fg-muted border',
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="다음 페이지"
                className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px] disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
