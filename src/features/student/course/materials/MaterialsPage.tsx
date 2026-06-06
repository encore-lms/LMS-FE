import { Fragment, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useCourseMaterials } from '../../api/course'
import { CourseTabs } from '../CourseTabs'
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
  const [category, setCategory] = useState<CategoryKey>('all')
  const [query, setQuery] = useState('')
  const [favOverride, setFavOverride] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (isPending) {
    return <div className="text-fg-muted p-8">자료실을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="자료실을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const q = query.trim().toLowerCase()
  const items = data.items
    .map((it) => ({ ...it, favorited: favOverride[it.id] ?? it.favorited }))
    .filter((it) => category === 'all' || it.category === category)
    .filter((it) => q === '' || it.title.toLowerCase().includes(q))

  const toggleFavorite = (id: string) =>
    setFavOverride((prev) => {
      const current =
        prev[id] ?? data.items.find((it) => it.id === id)?.favorited ?? false
      return { ...prev, [id]: !current }
    })

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />

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
            className="bg-brand flex items-center gap-1.5 rounded-[10px] px-3.5 py-[9px] text-[13px] font-bold text-white"
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
        <button
          type="button"
          className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-medium"
        >
          최신 업로드 순 ⌄
        </button>
      </div>

      {/* 자료 목록 */}
      {items.length === 0 ? (
        <Empty
          title="자료가 없어요"
          description="검색어나 분류를 바꿔보세요."
        />
      ) : (
        <div className="border-border bg-surface flex w-full flex-col rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
          {items.map((it, i) => (
            <Fragment key={it.id}>
              {i > 0 && <div className="bg-divider h-px w-full" />}
              <MaterialRow item={it} onToggleFavorite={toggleFavorite} />
            </Fragment>
          ))}
        </div>
      )}

      <MaterialPagination
        shownCount={items.length}
        totalCount={data.totalCount}
        pageCount={3}
        page={page}
        onPage={setPage}
      />

      <ShareMaterialModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShared={() => {
          setShareOpen(false)
          setToast('자료가 공유되었습니다')
          setTimeout(() => setToast(null), 2800)
        }}
      />

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
