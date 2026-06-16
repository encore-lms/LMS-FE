import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useRecordsOverview } from '../api/records'
import { RecordStatCards } from './components/RecordStatCards'
import { BlogRecordCard } from './components/BlogRecordCard'
import { DeleteRecordModal } from './components/DeleteRecordModal'
import { RecordToast } from './components/RecordToast'
import type { BlogRecord, RecordStatus, RecordsOverview } from './types'

const UPDATED_MSG = '블로그 기록이 수정되었습니다.'

type SortKey = 'latest' | 'oldest'
type StatusFilter = 'all' | RecordStatus

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
]
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '상태 전체' },
  { value: 'approved', label: '승인' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'rejected', label: '반려' },
]

/**
 * 기록실 (/student/records) — Figma 246:27.
 * 필터 탭·요약 통계·제출 배너·블로그 기록 목록. 상태 변형:
 * ?toast=deleted|blog-updated (우하단 토스트), ?modal=delete-blog (삭제 확인 모달).
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
  const [params, setParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('blog')
  // 목록을 로컬 상태로 둬 삭제 시 해당 기록만 제거(새로고침하면 mock 그대로 복원).
  const [records, setRecords] = useState<BlogRecord[]>(data.records)
  const [sort, setSort] = useState<SortKey>('latest')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(() => {
    const t = params.get('toast')
    if (t === 'deleted') return '블로그 기록이 삭제되었습니다.'
    if (t === 'blog-updated') return UPDATED_MSG
    if (t === 'study-updated') return '스터디 기록이 수정되었습니다.'
    if (t === 'cert-updated') return '자격증 기록이 수정되었습니다.'
    return null
  })

  const modalParam = params.get('modal') === 'delete-blog'

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])

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
            sub: '인증 가능한 자격증(PCCE/PCCP/PCSQL) 취득 사진을 등록',
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
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setToast(`'${deleteTarget.title}' 기록이 삭제되었습니다.`)
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
    navigate(`/student/records/${base}/${id}/edit`)
  }

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
          {visible.map((r) => (
            <BlogRecordCard
              key={r.id}
              record={r}
              onEdit={goEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* 푸터 + 페이지네이션 */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-fg-subtle text-[12px]">
          {totalCount}건 중 {visible.length}건 표시
        </span>
        <div className="flex items-center gap-1">
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border">
            <ChevronLeft className="size-4" />
          </span>
          {['1', '2', '3'].map((n) => (
            <span
              key={n}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                n === '1'
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted border',
              )}
            >
              {n}
            </span>
          ))}
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border">
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>

      {deleteTarget && (
        <DeleteRecordModal
          record={deleteTarget}
          onCancel={closeModal}
          onConfirm={confirmDelete}
        />
      )}

      {toast && <RecordToast message={toast} onClose={() => setToast(null)} />}
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
