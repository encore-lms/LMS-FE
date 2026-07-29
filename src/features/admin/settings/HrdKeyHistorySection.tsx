// HRD API Key 이력 섹션 — 필터 칩 + 감사 로그 테이블 + 페이지네이션. HrdApiKeyPage에서 분리.
import { DataTable } from '@/components/data/DataTable'
import { Pagination } from '@/components/data/Pagination'
import { cn } from '@/shared/lib/cn'
import type { HrdKeyHistoryData, HrdKeyHistoryRow } from '@/shared/types'
import { HISTORY_FILTERS, type HistoryFilter } from './hrdKeyMeta'
import { buildHistoryColumns } from './hrdKeyColumns'

export function HrdKeyHistorySection({
  history,
  isError,
  filter,
  onFilterChange,
  page,
  onPage,
  onOpenDetail,
}: {
  history: HrdKeyHistoryData | undefined
  isError: boolean
  filter: string
  onFilterChange: (key: HistoryFilter) => void
  page: number
  onPage: (page: number) => void
  onOpenDetail: (h: HrdKeyHistoryRow) => void
}) {
  const historyColumns = buildHistoryColumns({ onOpenDetail })

  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-fg text-sm font-bold">이력</p>
          <p className="text-fg-subtle text-xs">
            등록·수정·삭제·연결 테스트 · 감사 로그
          </p>
        </div>
        <div className="flex gap-1">
          {HISTORY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium',
                filter === f.key
                  ? 'bg-accent-bg text-accent-strong'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={historyColumns}
        rows={history?.items ?? []}
        rowKey={(h) => h.id}
        onRowClick={onOpenDetail}
        empty={isError ? '이력을 불러오지 못했어요' : '이력이 없어요'}
      />
      {history && history.totalElements > 0 && (
        <div className="mt-3">
          <Pagination
            page={page}
            pageCount={Math.max(1, history.totalPages)}
            totalCount={history.totalElements}
            shownCount={history.items.length}
            onPage={onPage}
          />
        </div>
      )}
    </div>
  )
}
