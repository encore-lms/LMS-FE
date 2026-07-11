import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import { usePageHeader } from '@/shared/store'
import {
  useCourseMaterials,
  useShareMaterial,
  useDeleteMaterial,
} from '../../api/course'
import type { MaterialItem } from '../types'
import { CourseTabs } from '../CourseTabs'

const SORTS = [
  { key: 'latest', label: '최신 업로드 순' },
  { key: 'oldest', label: '오래된 순' },
  { key: 'title', label: '이름순' },
] as const
type SortKey = (typeof SORTS)[number]['key']
const PAGE_SIZE = 8
import {
  MaterialCategoryChips,
  type CategoryKey,
} from './components/MaterialCategoryChips'
import { MaterialRow } from './components/MaterialRow'
import { MaterialPagination } from './components/MaterialPagination'
import { ShareMaterialModal } from './components/ShareMaterialModal'

/**
 * 강의 자료실 (/student/course/materials) — 나의 과정 자료실 탭.
 * 카테고리 칩·검색으로 필터링, 즐겨찾기 토글. 데이터/상태는 여기, 행은 components/* 가 그린다.
 */
export default function MaterialsPage() {
  const { data, isPending, isError, refetch } = useCourseMaterials()
  const shareMutation = useShareMaterial()
  const deleteMutation = useDeleteMaterial()
  const [deleteTarget, setDeleteTarget] = useState<MaterialItem | null>(null)
  usePageHeader('자료실')
  const [category, setCategory] = useState<CategoryKey>('all')
  const [query, setQuery] = useState('')
  const [favOverride, setFavOverride] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortKey>('latest')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!sortOpen) return
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [sortOpen])

  const q = query.trim().toLowerCase()
  const items = (data?.items ?? [])
    .map((it) => ({ ...it, favorited: favOverride[it.id] ?? it.favorited }))
    .filter((it) => category === 'all' || it.category === category)
    .filter((it) => q === '' || it.title.toLowerCase().includes(q))

  const toggleFavorite = (id: string) =>
    setFavOverride((prev) => {
      const current =
        prev[id] ?? data?.items.find((it) => it.id === id)?.favorited ?? false
      return { ...prev, [id]: !current }
    })

  // 정렬(최신=기본 순서 / 오래된=역순 / 이름=가나다) → 페이지 슬라이싱
  const sorted = [...items]
  if (sort === 'oldest') sorted.reverse()
  else if (sort === 'title')
    sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount)
  const pageItems = sorted.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        setToast('자료가 삭제되었습니다')
        setTimeout(() => setToast(null), 2800)
      },
    })
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />

      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        errorTitle="자료실을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            {/* 필터 행 — 카테고리 칩 + 검색/공유 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <MaterialCategoryChips
                categories={data.categories}
                active={category}
                onChange={(k) => {
                  setCategory(k)
                  setPage(1)
                }}
              />
              <div className="flex items-center gap-2">
                <div className="border-border bg-surface flex h-[38px] w-60 items-center gap-2 rounded-[10px] border px-3.5">
                  <svg
                    viewBox="0 0 24 24"
                    className="text-fg-subtle size-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3-3" strokeLinecap="round" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="자료 제목·키워드 검색"
                    className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-[13px] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className={buttonClass({ size: 'md' })}
                >
                  <span className="text-[14px]">+</span> 자료 공유
                </button>
              </div>
            </div>

            {/* 리스트 헤더 — 제목/건수 + 정렬 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-fg text-[16px] font-bold">
                  {category === 'all'
                    ? '전체 자료'
                    : data.categories.find((c) => c.key === category)?.label}
                </h2>
                <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                  {items.length}건
                </span>
              </div>
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  className="border-border text-fg-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium"
                >
                  {SORTS.find((s) => s.key === sort)?.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {sortOpen && (
                  <div className="border-border absolute right-0 z-30 mt-1 w-36 rounded-lg border bg-white p-1 shadow-[0px_8px_24px_0px_rgba(18,23,38,0.12)]">
                    {SORTS.map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => {
                          setSort(o.key)
                          setPage(1)
                          setSortOpen(false)
                        }}
                        className={cn(
                          'w-full rounded-md px-3 py-1.5 text-left text-[12px]',
                          o.key === sort
                            ? 'bg-brand/10 text-brand font-semibold'
                            : 'text-fg-muted hover:bg-surface-muted',
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 자료 목록 */}
            {sorted.length === 0 ? (
              <Empty
                title="자료가 없어요"
                description="검색어나 분류를 바꿔보세요."
              />
            ) : (
              <div className="border-border bg-surface flex w-full flex-col rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
                {pageItems.map((it, i) => (
                  <Fragment key={it.id}>
                    {i > 0 && <div className="bg-divider h-px w-full" />}
                    <MaterialRow
                      item={it}
                      onToggleFavorite={toggleFavorite}
                      onDelete={setDeleteTarget}
                    />
                  </Fragment>
                ))}
              </div>
            )}

            <MaterialPagination
              shownCount={pageItems.length}
              totalCount={sorted.length}
              pageCount={pageCount}
              page={curPage}
              onPage={setPage}
            />
          </>
        )}
      </DataBoundary>

      <ShareMaterialModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShared={(payload) => {
          shareMutation.mutate(payload, {
            onSuccess: () => {
              // 새 자료(학생 공유)가 맨 앞에 보이도록 필터·정렬·페이지를 초기화한다.
              setShareOpen(false)
              setCategory('all')
              setSort('latest')
              setPage(1)
              setToast('자료가 공유되었습니다')
              setTimeout(() => setToast(null), 2800)
            },
          })
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        size="sm"
        title="자료 삭제"
        confirmLabel="삭제"
        tone="danger"
        confirmDisabled={deleteMutation.isPending}
      >
        <p className="text-fg-muted text-[14px] leading-[22px]">
          <span className="text-fg font-semibold">{deleteTarget?.title}</span>{' '}
          자료를 삭제할까요? 삭제하면 되돌릴 수 없습니다.
        </p>
      </ConfirmDialog>

      {toast && (
        <div className="bg-accent-strong fixed right-8 bottom-8 z-50 flex items-center gap-3 rounded-[10px] px-5 py-3 text-[13px] font-semibold text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
          {toast}
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="닫기"
            className="text-white/80"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
