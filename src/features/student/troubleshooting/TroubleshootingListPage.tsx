import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  FileText,
  Flag,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useTsList } from '../api/troubleshooting'
import { tsKeys } from './queryKeys'
import { useProjectTsLinks } from './projectLinks'
import { TsCaseCard } from './components/TsCaseCard'
import { RejectNoticeModal } from './components/RejectNoticeModal'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { TS_LINKABLE_PROJECTS, type TsCase, type TsListData } from './types'
import { TONE_SOLID, TONE_TEXT } from '@/shared/lib/tone'

// 목록 카드 우상단 버튼 라벨 — 상태/작성완료 기준.
//   작성 중(미완료) 이어 작성 · 작성 완료 인증요청 · 검토 중 검토 중 · 인증 완료 사례 열기
function listActionLabel(c: TsCase): string {
  if (c.status === 'draft') return c.completed ? '인증요청' : '이어 작성'
  if (c.status === 'reviewing') return '검토 중'
  return '사례 열기'
}

// 트러블슈팅 사례 목록 (/student/troubleshooting) — Figma 360:1297.
// 통계카드 우상단 아이콘(노트/체크/깃발/스톱워치) — 키별 매핑.
const STAT_ICON: Record<string, LucideIcon> = {
  total: FileText,
  certified: CheckCircle2,
  independent: Flag,
  avgdays: Timer,
}
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
// 페이지당 사례 수 — 3건씩 × 4페이지(전체 12건) 구성.
const PAGE_SIZE = 3

export default function TroubleshootingListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  // 프로젝트 연결 상태(인증완료 카드 표시) — 스토어 전체 구독으로 연결 변경 시 즉시 반영.
  const projectLinks = useProjectTsLinks()
  const { data, isPending, isError, refetch } = useTsList()
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  // 삭제 확인 대상 — 인증 완료 전(작성 중·검토 중) 사례만 삭제 가능.
  const [delTarget, setDelTarget] = useState<TsCase | null>(null)
  // 반려 사유 모달 대상 — 카드의 '반려 사유' 클릭 시 사유(코멘트)를 보여준다.
  const [reasonTarget, setReasonTarget] = useState<TsCase | null>(null)
  // 카테고리·검색어가 바뀌면 1페이지로 되돌린다.
  useEffect(() => {
    setPage(1)
  }, [active, query])
  usePageHeader(
    '트러블슈팅',
    '겪어 해결한 사례를 상황·해결·결과로 기록하고 팀별 인증을 준비하세요.',
  )

  // 트러블슈팅 흐름은 상세(/:id) 한 페이지로 통일 — 어떤 상태든 상세로 진입한다.
  //   작성 중(draft)     → 상세에서 바로 편집(이어 작성).
  //   검토 중(reviewing) → 읽기전용 + '수정'으로 보완(인증 완료 전까지).
  //   인증 완료(certified) → 잠금 + '변경 제안'.
  const open = (c: TsCase) => {
    navigate(`/student/troubleshooting/${c.id}`)
  }
  // 삭제 — 인증 완료 전 사례만(목록·상세 캐시에서 제거). 확인 모달을 거친다.
  const confirmRemove = () => {
    if (!delTarget) return
    const rid = delTarget.id
    queryClient.setQueryData<TsListData>(tsKeys.list(), (old) =>
      old ? { ...old, cases: old.cases.filter((c) => c.id !== rid) } : old,
    )
    queryClient.removeQueries({ queryKey: tsKeys.case(rid) })
    toast.success('사례를 삭제했어요')
    setDelTarget(null)
  }

  // 카테고리 칩 + 검색어(제목·카테고리·태그)로 사례 필터.
  const q = query.trim().toLowerCase()
  const visible = (data?.cases ?? []).filter((c) => {
    if (active !== 'all' && c.categoryKey !== active) return false
    if (!q) return true
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  // 현재 필터 결과를 PAGE_SIZE 단위로 나눠 현재 페이지만 표시.
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
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.stats.map((s) => {
              const Icon = STAT_ICON[s.key] ?? FileText
              return (
                <div key={s.key} className={cn(card, 'flex flex-col gap-2')}>
                  <div className="flex items-start justify-between">
                    <span className="text-fg-muted text-[12px]">{s.label}</span>
                    <Icon
                      className={cn('size-4 shrink-0', TONE_TEXT[s.tone])}
                    />
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
                        className={cn(
                          'h-full rounded-full',
                          TONE_SOLID[s.tone],
                        )}
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
              <h2 className="text-fg text-[16px] font-bold">
                내 트러블슈팅 사례
              </h2>
              <span className="text-fg-subtle text-[12px]">
                {data.cases.length}건
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
                  placeholder="제목·카테고리·태그 검색"
                  className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-[220px] rounded-lg border py-2 pr-3 pl-8 text-[12px] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => navigate('/student/troubleshooting/new')}
                className={buttonClass({ size: 'sm' })}
              >
                + 새 사례 작성
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
            {/* 우측 상태 칩 (인증 완료·검토 중·작성 중) */}
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
                검색·필터 조건에 맞는 사례가 없어요.
              </div>
            )}
            {pageItems.map((c) => {
              // 인증 완료 사례만 프로젝트 연결 칩 — 연결됨(프로젝트명)/연결 필요.
              const proj = TS_LINKABLE_PROJECTS.find(
                (p) => p.id === projectLinks.projectIdFor(c.id),
              )
              return (
                <TsCaseCard
                  key={c.id}
                  c={c}
                  onOpen={open}
                  actionLabel={listActionLabel(c)}
                  connection={
                    c.status === 'certified'
                      ? proj
                        ? { label: proj.title, ok: true }
                        : { label: '연결 필요', ok: false }
                      : undefined
                  }
                  onRemove={
                    c.status === 'certified' ? undefined : () => setDelTarget(c)
                  }
                  removeLabel="삭제"
                  onShowReason={() => setReasonTarget(c)}
                />
              )
            })}
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

          {delTarget && (
            <ConfirmDialog
              open
              onClose={() => setDelTarget(null)}
              onConfirm={confirmRemove}
              size="sm"
              title="사례 삭제"
              confirmLabel="삭제"
              tone="danger"
            >
              <p className="text-fg-muted text-[13px] leading-5">
                ‘{delTarget.title}’ 사례를 삭제할까요? 인증 완료 전 사례만
                삭제할 수 있어요. 삭제하면 목록에서 사라집니다.
              </p>
            </ConfirmDialog>
          )}

          {/* 강사 반려 사유 — 카드 '반려 사유' 클릭 시 코멘트 회신을 보여준다(확인 후 페이지에서 보완). */}
          {reasonTarget?.rejectionReason && (
            <RejectNoticeModal
              kind={reasonTarget.rejectionFrom ?? 'cert'}
              reviewer={`${reasonTarget.category} · 임수현 강사`}
              reason={reasonTarget.rejectionReason}
              onClose={() => setReasonTarget(null)}
            />
          )}
        </div>
      )}
    </DataBoundary>
  )
}
