import { cn } from '@/shared/lib/cn'

// 공용 스켈레톤 — 데이터 로딩 중 화면 골격을 미리 보여준다(체감 로딩 단축).
// 토큰 기반 수동 구현(ADR 0003). animate-pulse는 index.css의 reduced-motion 규칙에서 자동 감쇠된다.
// 원칙: 스켈레톤은 실제 콘텐츠의 레이아웃을 닮아야 한다 — 아무 데나 회색 박스를 깔지 않는다.

/** 기본 골격 박스 — 크기·모양은 className으로 지정한다. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('bg-surface-muted animate-pulse rounded-md', className)}
      aria-hidden
    />
  )
}

/** 텍스트 여러 줄 골격 — 마지막 줄은 짧게. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

/** KPI 타일 행 골격 — KpiCard 그리드와 동일한 구조. */
export function SkeletonKpiRow({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-border bg-surface flex flex-col gap-2.5 rounded-xl border p-5"
        >
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

/** 테이블 골격 — DataTable 카드 컨테이너와 동일한 테두리/여백. */
export function SkeletonTable({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface overflow-hidden rounded-xl border',
        className,
      )}
      aria-hidden
    >
      <div className="border-divider flex gap-4 border-b px-4 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="border-divider/60 flex gap-4 border-b px-4 py-4 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn('h-4 flex-1', c === 0 ? 'max-w-[40%]' : '')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** 리스트/테이블 페이지 본문 골격 — (선택)KPI 행 + 섹션 제목 + 테이블. 운영/강사/멘토 목록 공통. */
export function SkeletonListPage({
  kpis = 0,
  columns = 5,
  rows = 6,
  className = 'p-8',
}: {
  kpis?: number
  columns?: number
  rows?: number
  className?: string
}) {
  return (
    <div className={className} aria-busy="true">
      {kpis > 0 && <SkeletonKpiRow count={kpis} className="mb-6" />}
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  )
}

/** 대시보드 페이지 본문 골격 — KPI 행 + 카드 패널 그리드. 강사/멘토/수강생 대시보드 공통. */
export function SkeletonDashboard({
  kpis = 4,
  panels = 4,
  className = 'p-8',
}: {
  kpis?: number
  panels?: number
  className?: string
}) {
  return (
    <div className={className} aria-busy="true">
      <SkeletonKpiRow count={kpis} className="mb-6" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: panels }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-surface rounded-xl border p-5"
          >
            <Skeleton className="mb-4 h-4 w-28" />
            <SkeletonText lines={4} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 카드 그리드 골격 — 카드형 목록 화면용. */
export function SkeletonCards({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-7 w-32" />
          <SkeletonText lines={2} className="mt-1" />
        </div>
      ))}
    </div>
  )
}
