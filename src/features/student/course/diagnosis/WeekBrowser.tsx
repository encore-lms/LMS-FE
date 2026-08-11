import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'

// 주차 탐색 셸 — 좌측 주차 목록(최신 우선) + 이전/다음 주 이동 + 본문(children).
// 그룹 리포트(매니저 허브)와 개인 리포트(수강생 탭)가 같은 탐색 UI를 공유한다.

export interface WeekItem {
  week: number
  baseDate: string
  /** 목록에 붙일 경고 배지 텍스트 (예: '⚠ 2'). 없으면 표시 안 함 */
  alertLabel?: string
}

function WeekList({
  items,
  selected,
  onSelect,
}: {
  items: WeekItem[]
  selected: number
  onSelect: (week: number) => void
}) {
  return (
    <nav
      aria-label="주차 선택"
      className="border-border bg-surface w-full shrink-0 self-start rounded-xl border p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:w-52 lg:overflow-y-auto"
    >
      <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
        {items.map((item) => {
          const active = item.week === selected
          return (
            <li key={item.week} className="shrink-0">
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(item.week)}
                className={cn(
                  'flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors',
                  active
                    ? 'bg-brand-deep text-white'
                    : 'text-fg-muted hover:bg-surface-muted',
                )}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap">
                  {item.week}주차
                  {item.alertLabel && (
                    <span
                      className={cn(
                        'rounded px-1 text-[10px] font-bold',
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-warning-bg text-warning',
                      )}
                    >
                      {item.alertLabel}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[11px] whitespace-nowrap tabular-nums',
                    active ? 'text-white/70' : 'text-fg-subtle',
                  )}
                >
                  {item.baseDate}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function WeekBrowser({
  items,
  selected,
  onSelect,
  children,
}: {
  /** 주차 항목 — 정렬은 내부에서 최신 우선으로 한다 */
  items: WeekItem[]
  selected: number
  onSelect: (week: number) => void
  /** 선택 주차의 리포트 본문 */
  children: ReactNode
}) {
  const sorted = [...items].sort((a, b) => b.week - a.week)
  const latest = sorted[0]?.week ?? selected
  const earliest = sorted[sorted.length - 1]?.week ?? selected
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-fg-muted text-sm">
          총 {items.length}개 주차 리포트 · {selected}주차 열람 중
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={selected <= earliest}
            onClick={() => onSelect(selected - 1)}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            이전 주
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={selected >= latest}
            onClick={() => onSelect(selected + 1)}
          >
            다음 주
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <WeekList items={sorted} selected={selected} onSelect={onSelect} />
        {children}
      </div>
    </div>
  )
}
