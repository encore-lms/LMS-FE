import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useRecordsOverview, useDeleteRecord } from '../api/records'
import { BlogRecordCard } from './components/BlogRecordCard'
import { DeleteRecordModal } from './components/DeleteRecordModal'
import type {
  BlogRecord,
  RecordCategory,
  RecordStatus,
  RecordsOverview,
} from './types'

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

function isRecordCategory(value: string | null): value is RecordCategory {
  return value === 'blog' || value === 'study' || value === 'cert'
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

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={refetch}
      loadingText="기록실을 불러오는 중…"
      errorTitle="기록실을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && <RecordsView data={data} />}
    </DataBoundary>
  )
}

function RecordsView({ data }: { data: RecordsOverview }) {
  const navigate = useNavigate()
  const toast = useToast()
  const deleteRecord = useDeleteRecord()
  const [params, setParams] = useSearchParams()
  const [activeTab, setActiveTabState] = useState<RecordCategory>(() => {
    try {
      const stored = sessionStorage.getItem(RECORDS_TAB_KEY)
      return isRecordCategory(stored) ? stored : 'blog'
    } catch {
      return 'blog'
    }
  })
  const categoryTabs = data.tabs.filter((tab) => isRecordCategory(tab.key))
  // 탭 변경을 보존 — 기록 보고 돌아와도 마지막 카테고리 탭이 유지된다.
  const setActiveTab = (key: RecordCategory) => {
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
  const [sort, setSort] = useState<SortKey>('latest')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

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
    let list = records.filter((r) => r.category === activeTab)
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
  const activeTabInfo = categoryTabs.find((t) => t.key === activeTab)
  const listTitle = `${activeTabInfo?.label ?? ''} 기록`
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
      const t = deleteTarget
      deleteRecord.mutate(t.id, {
        onSuccess: () => toast.success(`'${t.title}' 기록이 삭제되었습니다.`),
        onError: () => toast.danger('삭제에 실패했어요'),
      })
      setDeletedIds((prev) => new Set(prev).add(t.id)) // 낙관적 가림
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

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 필터 탭 */}
      <Tabs
        aria-label="기록 카테고리"
        value={activeTab}
        onChange={(v) => setActiveTab(v as RecordCategory)}
        items={categoryTabs.map((t) => ({
          value: t.key,
          label: t.label,
          count: t.count,
        }))}
      />

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
          <div className="flex flex-col">
            {pageItems.map((r, i) => (
              <Fragment key={r.id}>
                {i > 0 && <div className="bg-divider h-px w-full" />}
                <BlogRecordCard
                  record={r}
                  onEdit={goEdit}
                  onDelete={(id) => setDeleteId(id)}
                />
              </Fragment>
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
