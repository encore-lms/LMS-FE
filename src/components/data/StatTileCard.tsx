import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface StatTileCardProps {
  label: ReactNode
  value: ReactNode
  /** 값 우측 유닛(건·%·명 등) — 항상 값 옆 span으로 렌더 */
  unit?: ReactNode
  sub: ReactNode
  /** 라벨 우측 배지 — 아이콘 박스(프로젝트) 또는 톤 도트(기록실) 등 */
  badge?: ReactNode
  /** 헤더 정렬 — 아이콘 박스는 'start', 도트는 'center' */
  headerAlign?: 'start' | 'center'
  /** 값 아래 진행률 막대 등 부가 요소(기록실) */
  bar?: ReactNode
  /** sub 위 구분선(프로젝트) */
  subDivider?: boolean
}

/**
 * 세로형 통계 타일 shell — 라벨 + 큰 값(+유닛) + sub 의 공통 골격.
 * 지표 표현(아이콘 박스/도트/진행바/구분선)은 feature마다 달라 slot·flag 로 주입한다.
 * 프로젝트 목록·기록실 요약 통계가 공유(무동작변경으로 동일 마크업 재사용).
 */
export function StatTileCard({
  label,
  value,
  unit,
  sub,
  badge,
  headerAlign = 'start',
  bar,
  subDivider = false,
}: StatTileCardProps) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
      <div
        className={cn(
          'flex justify-between',
          headerAlign === 'start' ? 'items-start' : 'items-center',
        )}
      >
        <span className="text-fg-muted text-[12px] font-medium">{label}</span>
        {badge}
      </div>
      <span className="text-fg text-[28px] leading-none font-bold">
        {value}
        <span className="text-fg-muted ml-1 text-[14px] font-medium">
          {unit}
        </span>
      </span>
      {bar}
      <span
        className={cn(
          'text-fg-subtle text-[11px]',
          subDivider && 'border-divider border-t pt-2.5',
        )}
      >
        {sub}
      </span>
    </div>
  )
}
