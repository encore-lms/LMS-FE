import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TabItem {
  value: string
  label: ReactNode
  /** 우측 카운트 배지(요청 대기 N건 등) */
  count?: number
  /** 라벨 앞 아이콘(장식 — aria-hidden 처리됨) */
  icon?: ReactNode
  /** 라벨 앞 상태 점 색 className(비활성일 때만 표시). 예: 'bg-warning' */
  dot?: string
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  /** pill=박스 세그먼트(정본, Button primary와 일관되는 딥 브랜드 active) · underline=밑줄(콘텐츠 전환 탭) */
  variant?: 'pill' | 'underline'
  'aria-label'?: string
  className?: string
}

// 공용 탭/세그먼트 스위처 — 역할마다 제각각이던 5종 변형(밑줄/박스필-brand/박스필-deep/
// 소프트틴트/카운트필)을 정본 2종(pill·underline)으로 통일한다. 제어형(value/onChange).
export function Tabs({
  items,
  value,
  onChange,
  variant = 'pill',
  className,
  ...aria
}: TabsProps) {
  const pill = variant === 'pill'
  return (
    <div
      role="tablist"
      aria-label={aria['aria-label']}
      className={cn(
        pill
          ? // w-fit — flex 컬럼 부모의 stretch로 가로가 늘어나지 않게(컴팩트 세그먼트 유지)
            'border-border bg-surface inline-flex w-fit items-center gap-1 rounded-xl border p-1'
          : 'border-border flex items-center gap-1 border-b',
        className,
      )}
    >
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={t.disabled}
            onClick={() => onChange(t.value)}
            className={cn(
              'focus-visible:ring-brand inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40',
              pill
                ? cn(
                    'h-9 rounded-lg px-3.5',
                    active
                      ? 'bg-brand-deep text-on-color font-bold'
                      : 'text-fg-muted hover:bg-surface-muted font-medium',
                  )
                : cn(
                    '-mb-px border-b-2 px-3 py-2',
                    active
                      ? 'border-brand text-brand font-bold'
                      : 'text-fg-muted hover:text-fg border-transparent font-medium',
                  ),
            )}
          >
            {t.icon && (
              <span aria-hidden="true" className="inline-flex">
                {t.icon}
              </span>
            )}
            {t.dot && !active && (
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', t.dot)}
              />
            )}
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
                  active
                    ? 'text-on-color bg-white/20'
                    : 'bg-surface-muted text-fg-subtle',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
