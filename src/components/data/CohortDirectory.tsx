import { type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { DataTable, type Column } from './DataTable'
import { DataBoundary } from '../ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { SearchInput } from '@/components/ui/SearchInput'

/**
 * 과정/기수 디렉터리 — 기수를 골라 허브로 들어가는 목록 화면의 공용 골격.
 *
 * <p>강사(/instructor/cohorts)와 운영(/admin/education)이 같은 모양을 쓴다.
 * 데이터 출처·컬럼·요약 카드·클릭 목적지는 역할마다 달라 주입받고, 상태 탭·검색·표 배치만
 * 여기서 관리한다. 한쪽 화면만 손봐서 두 화면이 어긋나는 일을 막는다.</p>
 */
export interface CohortDirectoryTab<S extends string> {
  key: S
  label: string
  count: number
}

export interface CohortDirectoryCard {
  label: string
  value: string | number
  unit: string
  hint: string
  /** 우상단 점 색(Tailwind 클래스). 미지정 시 brand. */
  dot?: string
  hintColor?: string
}

export function CohortDirectory<T, S extends string>({
  tabs,
  status,
  onStatusChange,
  q,
  onQChange,
  toolbar,
  searchPlaceholder = '과정명·기수명으로 검색',
  errorTitle = '과정·기수를 불러오지 못했어요',
  scopeSummary,
  cards,
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyText = '조건에 맞는 과정이 없어요',
  footnote,
  isPending,
  isError,
  onRetry,
}: {
  tabs: CohortDirectoryTab<S>[]
  status: S
  onStatusChange: (next: S) => void
  q: string
  onQChange: (next: string) => void
  searchPlaceholder?: string
  /** 표 오른쪽 위에 붙일 도구(내보내기 같은 것). 없으면 자리도 없다. */
  toolbar?: ReactNode
  errorTitle?: string
  /** 필터 줄 오른쪽 요약 문구(예: '담당 2개 (진행 중 2 · 예정 0 · 종료 0)'). */
  scopeSummary?: string
  cards: CohortDirectoryCard[]
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick: (row: T) => void
  emptyText?: string
  footnote?: ReactNode
  isPending: boolean
  isError: boolean
  onRetry?: () => void
}) {
  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={onRetry}
      errorTitle={errorTitle}
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
      skeleton={
        <div className="flex flex-col gap-3 p-8" aria-busy="true">
          <div className="bg-surface-muted h-9 w-80 animate-pulse rounded-lg" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="bg-surface-muted h-24 animate-pulse rounded-xl"
              />
            ))}
          </div>
          <div className="bg-surface-muted h-64 animate-pulse rounded-xl" />
        </div>
      }
    >
      <div className="p-8">
        {/* 검색 + 상태 탭 */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={q}
            onChange={onQChange}
            placeholder={searchPlaceholder}
            ariaLabel={searchPlaceholder}
            className="w-80"
          />
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onStatusChange(t.key)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-sm font-medium',
                status === t.key
                  ? 'bg-brand font-bold text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {t.label} ({t.count})
            </button>
          ))}
          {scopeSummary && (
            <span className="text-fg-subtle ml-auto text-xs">
              {scopeSummary}
            </span>
          )}
        </div>

        {/* 요약 카드 */}
        {cards.length > 0 && (
          <div
            className={cn(
              'mt-4 grid gap-3 md:grid-cols-2',
              cards.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
            )}
          >
            {cards.map((card) => (
              <div
                key={card.label}
                className="border-border bg-surface rounded-xl border p-4.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-fg-muted text-sm font-medium">
                    {card.label}
                  </p>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      card.dot ?? 'bg-brand',
                    )}
                  />
                </div>
                <p className="text-fg mt-2 text-3xl font-bold">
                  {card.value}{' '}
                  <span className="text-fg-subtle text-base font-medium">
                    {card.unit}
                  </span>
                </p>
                <p
                  className={cn(
                    'mt-1.5 text-xs',
                    card.hintColor ?? 'text-info',
                  )}
                >
                  {card.hint}
                </p>
              </div>
            ))}
          </div>
        )}

        {toolbar && (
          <div className="mt-4 flex items-center justify-end">{toolbar}</div>
        )}

        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            onRowClick={onRowClick}
            empty={emptyText}
          />
        </div>

        {footnote && (
          <p className="text-fg-subtle mt-3 flex items-center gap-1.5 text-xs">
            <Info className="h-3 w-3 shrink-0" />
            {footnote}
          </p>
        )}
      </div>
    </DataBoundary>
  )
}
