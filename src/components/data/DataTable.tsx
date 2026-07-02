import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** 헤더·셀 공통 클래스(폭 등) */
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  empty?: ReactNode
}

const alignCls = (a?: 'left' | 'right' | 'center') =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

// 공통 데이터 컴포넌트 — 컬럼 설정 기반 테이블. 전 운영 list 화면 재사용.
// 토큰 기반 수동 구현(ADR 0003). 정렬·페이지네이션은 소비 화면에서 관리.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  empty,
}: DataTableProps<T>) {
  return (
    <div className="border-border bg-surface overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-divider border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-fg-muted px-4 py-3 text-[13px] font-semibold whitespace-nowrap',
                  alignCls(col.align),
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-fg-subtle px-4 py-10 text-center text-sm"
              >
                {empty ?? '데이터가 없습니다'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                // 행 클릭이 유일한 진입점인 화면이 있어 키보드 동작(Enter/Space)을 보장한다.
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.target !== e.currentTarget) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                className={cn(
                  'border-divider border-b last:border-b-0',
                  onRowClick &&
                    'hover:bg-surface-muted focus-visible:ring-brand cursor-pointer focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'text-fg px-4 py-3 text-sm',
                      alignCls(col.align),
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
