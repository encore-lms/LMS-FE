import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useQnaList } from '../api/qna'
import { QnaQuestionCard } from './components/QnaQuestionCard'
import type { QnaQuestion, Tone } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

// 통계 카드 우상단 아이콘 — 키별 매핑.
const STAT_ICON: Record<string, LucideIcon> = {
  total: MessagesSquare,
  resolved: CheckCircle2,
  answers: MessageSquare,
  open: Clock,
}
const ICON_TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}
const ACCENT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const PAGE_SIZE = 4

// 수강생 QnA 게시판 목록 (/student/qna) — 트러블슈팅 목록 패턴 차용(검색·필터·페이지네이션).
export default function QnaListPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useQnaList()
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [active, query])
  usePageHeader(
    'QnA 게시판',
    '강의·과제·환경설정·진로 궁금증을 동료·멘토·강사와 함께 풀어요.',
  )

  if (isPending) return <SkeletonListPage columns={4} />
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const open = (q: QnaQuestion) => navigate(`/student/qna/${q.id}`)

  const q = query.trim().toLowerCase()
  const visible = data.questions.filter((item) => {
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
    <div className="flex flex-col gap-5 p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => {
          const Icon = STAT_ICON[s.key] ?? MessagesSquare
          return (
            <div key={s.key} className={cn(card, 'flex flex-col gap-2')}>
              <div className="flex items-start justify-between">
                <span className="text-fg-muted text-[12px]">{s.label}</span>
                <Icon className={cn('size-4 shrink-0', ICON_TEXT[s.tone])} />
              </div>
              <span className="text-fg text-[26px] leading-none font-bold">
                {s.value}
                {s.unit && (
                  <span className="text-fg-muted ml-0.5 text-[13px]">
                    {s.unit}
                  </span>
                )}
              </span>
              {s.barPct != null && (
                <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', ACCENT[s.tone])}
                    style={{ width: `${s.barPct}%` }}
                  />
                </div>
              )}
              <span className="text-fg-subtle text-[11px]">{s.sub}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">질문 목록</h2>
          <span className="text-fg-subtle text-[12px]">
            {data.questions.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <svg
              viewBox="0 0 24 24"
              className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목·내용·태그 검색"
              className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-[220px] rounded-lg border py-2 pr-3 pl-8 text-[12px] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/qna/new')}
            className="bg-brand rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
          >
            + 질문하기
          </button>
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
                className={cn('size-2 rounded-full', ACCENT[f.tone ?? 'brand'])}
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
  )
}
