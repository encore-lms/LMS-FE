import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { TestModeFab } from '@/components/dev/TestModeFab'
import { usePageHeader } from '@/shared/store'
import { useRecordsOverview, useSimulateReview } from '../api/records'
import { RecordStatCards } from './components/RecordStatCards'
import { BlogRecordCard } from './components/BlogRecordCard'
import { DeleteRecordModal } from './components/DeleteRecordModal'
import type { BlogRecord, RecordStatus, RecordsOverview } from './types'

const UPDATED_MSG = '블로그 기록이 수정되었습니다.'

type SortKey = 'latest' | 'oldest'
type StatusFilter = 'all' | RecordStatus

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
]
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '임시저장' },
  { value: 'approved', label: '승인' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'rejected', label: '반려' },
]
// 페이지당 기록 수 — 4건씩 × 3페이지(카테고리당 12건) 구성.
const PAGE_SIZE = 4
// 카테고리 탭 유지 키 — 기록 보고 돌아와도 마지막 탭이 고정되게 sessionStorage에 보존.
const RECORDS_TAB_KEY = 'lms:records-tab'
// 검토 시뮬레이션 목록의 카테고리 라벨.
const CATEGORY_LABEL: Record<string, string> = {
  blog: '블로그',
  study: '스터디',
  cert: '자격증',
}

/**
 * 기록실 (/student/records) — Figma 246:27.
 * 필터 탭·요약 통계·제출 배너·블로그 기록 목록. 상태 변형:
 * ?toast=deleted|blog-updated (공용 토스트), ?modal=delete-blog (삭제 확인 모달).
 */
export default function RecordsPage() {
  const { data, isPending, isError, refetch } = useRecordsOverview()
  usePageHeader(
    '기록실',
    '블로그·스터디·자격증·이력서·GitHub 등 학습 기록을 한 곳에서 관리',
  )

  if (isPending)
    return <div className="text-fg-muted p-8">기록실을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="기록실을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  return <RecordsView data={data} />
}

function RecordsView({ data }: { data: RecordsOverview }) {
  const navigate = useNavigate()
  const toast = useToast()
  const reviewSim = useSimulateReview()

  // (테스트 UI) 운영자 검토 시뮬레이션 — 지정 기록을 승인/반려.
  const simReview = (id: string, action: 'approve' | 'reject') =>
    reviewSim.mutate(
      { id, action },
      {
        onSuccess: (res) => {
          if (!res.record) return
          if (action === 'approve') {
            toast.success(`'${res.record.title}' 승인 처리(시뮬레이션)`)
          } else {
            toast.warning(`'${res.record.title}' 반려 처리(시뮬레이션)`)
          }
        },
      },
    )
  const [params, setParams] = useSearchParams()
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return sessionStorage.getItem(RECORDS_TAB_KEY) ?? 'blog'
    } catch {
      return 'blog'
    }
  })
  // 탭 변경을 보존 — 기록 보고 돌아와도 마지막 카테고리 탭이 유지된다.
  const setActiveTab = (key: string) => {
    setActiveTabState(key)
    try {
      sessionStorage.setItem(RECORDS_TAB_KEY, key)
    } catch {
      // 보존 실패는 무시
    }
  }
  // 목록은 쿼리(data.records)에서 파생 — 검토 시뮬레이션/등록 결과가 즉시 반영된다.
  // 삭제는 로컬 deletedIds로만 가린다(새로고침하면 mock 그대로 복원).
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const records = data.records.filter((r) => !deletedIds.has(r.id))
  // 검토 시뮬레이션 대상 — 검토 중 기록(신규 포함).
  const reviewing = records.filter((r) => r.status === 'reviewing')
  const [sort, setSort] = useState<SortKey>('latest')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  // 검토 시뮬레이션 — 동작(승인/반려)을 먼저 고르고 대상 기록을 클릭한다.
  const [simAction, setSimAction] = useState<'approve' | 'reject' | null>(null)

  const modalParam = params.get('modal') === 'delete-blog'

  // 다른 화면에서 ?toast=... 로 진입하면(수정/삭제 후 복귀) 공용 토스트로 한 번 알린다.
  const greeted = useRef(false)
  useEffect(() => {
    if (greeted.current) return
    const t = params.get('toast')
    const msg =
      t === 'deleted'
        ? '블로그 기록이 삭제되었습니다.'
        : t === 'blog-updated'
          ? UPDATED_MSG
          : t === 'study-updated'
            ? '스터디 기록이 수정되었습니다.'
            : t === 'cert-updated'
              ? '자격증 기록이 수정되었습니다.'
              : t === 'blog-created'
                ? '블로그 기록이 등록되었습니다.'
                : t === 'study-created'
                  ? '스터디 기록이 등록되었습니다.'
                  : t === 'cert-created'
                    ? '자격증 기록이 등록되었습니다.'
                    : t === 'study-saved'
                      ? '스터디 기록을 임시저장했습니다.'
                      : t === 'cert-saved'
                        ? '자격증 기록을 임시저장했습니다.'
                        : t === 'blog-saved'
                          ? '블로그 기록을 임시저장했습니다.'
                          : null
    if (!msg) return
    greeted.current = true
    toast.success(msg)
  }, [params, toast])

  // 탭(카테고리) + 상태 필터 + 정렬(주차 번호 기준).
  const weekNo = (r: BlogRecord) => parseInt(r.weekLabel, 10) || 0
  const visible = useMemo(() => {
    let list =
      activeTab === 'all'
        ? records
        : records.filter((r) => r.category === activeTab)
    if (statusFilter !== 'all')
      list = list.filter((r) => r.status === statusFilter)
    return [...list].sort((a, b) =>
      sort === 'latest' ? weekNo(b) - weekNo(a) : weekNo(a) - weekNo(b),
    )
  }, [records, activeTab, statusFilter, sort])

  // 페이지네이션 — 현재 필터 결과(visible)를 PAGE_SIZE 단위로 나눠 표시.
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 탭·정렬·상태 필터가 바뀌면 1페이지로 되돌린다.
  useEffect(() => {
    setPage(1)
  }, [activeTab, sort, statusFilter])

  // 목록이 줄어 현재 페이지가 비면 마지막 페이지로 보정(삭제 등).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // 활성 탭 기준 목록 제목·총 건수.
  const activeTabInfo = data.tabs.find((t) => t.key === activeTab)
  const listTitle =
    activeTab === 'all' ? '전체 기록' : `${activeTabInfo?.label ?? ''} 기록`
  const totalCount = activeTabInfo?.count ?? visible.length

  // 제출 배너 — 활성 탭에 맞는 등록 폼으로 연결(블로그/스터디/자격증).
  const submitCfg =
    activeTab === 'study'
      ? {
          route: '/student/records/new/study',
          title: '스터디 활동 등록',
          sub: '진행한 스터디 활동을 시간·활동 내역·인증 사진으로 기록',
          action: '스터디 등록',
        }
      : activeTab === 'cert'
        ? {
            route: '/student/records/new/certificate',
            title: '자격증 등록',
            sub: '자격증(PCCE·PCCP·PCSQL 또는 기타) 취득 증빙을 등록',
            action: '자격증 등록',
          }
        : {
            route: '/student/records/new/blog',
            title: data.banner.title,
            sub: data.banner.sub,
            action: data.banner.actionLabel,
          }

  // 삭제 대상: 로컬 선택 또는 ?modal=delete-blog 진입 시 첫 삭제 가능 기록.
  const targetId =
    deleteId ?? (modalParam ? records.find((r) => r.canDelete)?.id : undefined)
  const deleteTarget = records.find((r) => r.id === targetId)

  const closeModal = () => {
    setDeleteId(null)
    if (modalParam) setParams({}, { replace: true })
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      setDeletedIds((prev) => new Set(prev).add(deleteTarget.id))
      toast.success(`'${deleteTarget.title}' 기록이 삭제되었습니다.`)
    }
    closeModal()
  }

  // 수정 — 기록 카테고리에 맞는 등록/수정 폼으로 이동.
  const goEdit = (id: string) => {
    const rec = records.find((r) => r.id === id)
    const base =
      rec?.category === 'study'
        ? 'study'
        : rec?.category === 'cert'
          ? 'certificate'
          : 'blog'
    // 임시저장(draft) 기록 수정은 반려 재제출과 구분 — 저장 시 임시저장으로 유지되게 표시.
    const suffix = rec?.status === 'draft' ? '?from=draft' : ''
    navigate(`/student/records/${base}/${id}/edit${suffix}`)
  }

  // 검토 시뮬레이션 대상 — 현재 탭 카테고리의 '검토 중' 기록만(전체 탭이면 모두). 승인·임시저장 제외.
  const simList =
    activeTab === 'all'
      ? reviewing
      : reviewing.filter((r) => r.category === activeTab)

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 필터 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        {data.tabs.map((t) => {
          const on = t.key === activeTab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'text-[12px]',
                  on ? 'text-white/70' : 'text-fg-subtle',
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <RecordStatCards stats={data.stats} />

      {/* 제출 안내 배너 */}
      <div className="bg-brand flex items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(submitCfg.route)}
            aria-label={`${submitCfg.action} 폼 열기`}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/20 transition-colors hover:bg-white/30"
          >
            <Plus className="size-5 text-white" strokeWidth={2.5} />
          </button>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-white">
              {submitCfg.title}
            </span>
            <span className="text-[12px] text-white/80">{submitCfg.sub}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(submitCfg.route)}
          className="text-brand shrink-0 rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold"
        >
          {submitCfg.action} →
        </button>
      </div>

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">{listTitle}</h2>
          <span className="text-fg-subtle text-[12px]">{totalCount}건</span>
        </div>
        <div className="flex items-center gap-2">
          <FilterDropdown
            value={sort}
            options={SORT_OPTIONS}
            onChange={setSort}
          />
          <FilterDropdown
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* 목록 영역 — 페이지마다 카드 수·높이가 달라도 페이지네이션 위치가 튀지 않게 최소 높이 고정 */}
      <div className="min-h-[560px]">
        {visible.length === 0 ? (
          <Empty
            title="표시할 기록이 없어요"
            description={
              statusFilter !== 'all'
                ? '다른 상태 필터를 선택해 보세요.'
                : '아직 등록된 블로그 기록이 없습니다.'
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {pageItems.map((r) => (
              <BlogRecordCard
                key={r.id}
                record={r}
                onEdit={goEdit}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 푸터 + 페이지네이션 */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-fg-subtle text-[12px]">
          {visible.length}건 중 {pageItems.length}건 표시
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label="이전 페이지"
            className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNo) => (
              <button
                key={pageNo}
                type="button"
                onClick={() => setPage(pageNo)}
                aria-current={pageNo === page ? 'page' : undefined}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                  pageNo === page
                    ? 'bg-brand-deep text-white'
                    : 'border-border text-fg-muted border',
                )}
              >
                {pageNo}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            aria-label="다음 페이지"
            className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {deleteTarget && (
        <DeleteRecordModal
          record={deleteTarget}
          onCancel={closeModal}
          onConfirm={confirmDelete}
        />
      )}

      <TestModeFab note="운영자 검토 시뮬레이션 — 동작을 고른 뒤 '검토 중' 기록을 클릭하세요(현재 탭 기준).">
        {simAction === null ? (
          <>
            <button
              type="button"
              onClick={() => setSimAction('approve')}
              className="bg-success rounded-md px-3 py-1.5 text-[12px] font-bold text-white"
            >
              ✓ 승인
            </button>
            <button
              type="button"
              onClick={() => setSimAction('reject')}
              className="bg-danger rounded-md px-3 py-1.5 text-[12px] font-bold text-white"
            >
              ✕ 반려
            </button>
          </>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-[12px] font-bold',
                  simAction === 'approve' ? 'text-success' : 'text-danger',
                )}
              >
                {simAction === 'approve' ? '승인' : '반려'}할 기록 선택
              </span>
              <button
                type="button"
                onClick={() => setSimAction(null)}
                className="text-fg-subtle hover:text-fg text-[11px] font-semibold"
              >
                ← 뒤로
              </button>
            </div>
            {simList.length === 0 ? (
              <span className="text-fg-muted text-[12px]">
                검토 중인 기록이 없어요.
              </span>
            ) : (
              <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
                {simList.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => simReview(r.id, simAction)}
                    disabled={reviewSim.isPending}
                    className="border-border bg-surface hover:bg-surface-muted flex items-center gap-2 rounded-lg border p-2 text-left disabled:opacity-50"
                  >
                    <span className="text-fg-subtle shrink-0 text-[10px]">
                      {CATEGORY_LABEL[r.category] ?? r.category}
                    </span>
                    <span className="text-fg flex-1 truncate text-[12px] font-semibold">
                      {r.title}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-[11px] font-bold',
                        simAction === 'approve'
                          ? 'text-success'
                          : 'text-danger',
                      )}
                    >
                      {simAction === 'approve' ? '승인' : '반려'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </TestModeFab>
    </div>
  )
}

// 정렬·상태 필터 드롭다운 — 배경 클릭 시 닫힘.
function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
      >
        {current?.label ?? value}
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="border-border bg-surface absolute top-full right-0 z-20 mt-1 flex min-w-[120px] flex-col rounded-lg border py-1 shadow-[0px_8px_24px_0px_rgba(18,23,38,0.12)]">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  'hover:bg-surface-muted px-3 py-1.5 text-left text-[12px]',
                  o.value === value ? 'text-brand font-bold' : 'text-fg-muted',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
