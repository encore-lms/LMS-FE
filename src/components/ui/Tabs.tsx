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
  /** pill=알약형 칩(정본) · underline=밑줄(콘텐츠 전환 탭) */
  variant?: 'pill' | 'underline'
  'aria-label'?: string
  className?: string
}

// 공용 탭/세그먼트 스위처 — 역할마다 제각각이던 5종 변형(밑줄/박스필-brand/박스필-deep/
// 소프트틴트/카운트필)을 정본 2종(pill·underline)으로 통일한다. 제어형(value/onChange).
//
// 두 변형은 계층이 다르다. 화면을 통째로 갈아 끼우는 1차 탭은 underline, 그 안에서 범위를
// 좁히는 2차 탭은 pill 이다. 둘 다 밑줄이면 같은 줄이 두 번 겹쳐 어느 쪽이 상위인지 읽히지
// 않는다. pill 은 컨테이너에 상자를 두르지 않고 칩만 나열한다 — 상자를 두르면 2차 탭이
// 오히려 더 무거워 보인다.
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
          ? // w-fit — flex 컬럼 부모의 stretch로 가로가 늘어나지 않게(컴팩트 유지)
            'inline-flex w-fit flex-wrap items-center gap-2'
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
                    'h-8 rounded-full px-3.5 font-semibold',
                    active
                      ? 'bg-brand-deep text-white'
                      : 'border-border text-fg-muted hover:bg-surface-muted border',
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
            {typeof t.count === 'number' &&
              (pill ? (
                // 알약 안에서는 배지를 또 씌우지 않는다 — 칩 안의 칩이 되어 지저분해진다.
                <span
                  className={cn(
                    'text-[12px] tabular-nums',
                    active ? 'text-white/70' : 'text-fg-subtle',
                  )}
                >
                  {t.count}
                </span>
              ) : (
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
              ))}
          </button>
        )
      })}
    </div>
  )
}
