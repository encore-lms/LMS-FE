import { Fragment } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

// 멘토링 페이지 로딩 골격 — 실제 레이아웃(히어로 + 좌 기록 / 우 팀원)을 닮게.
export function MentoringSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-8" aria-busy="true">
      <Skeleton className="h-[132px] w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <div className="flex flex-col">
            {Array.from({ length: 4 }).map((_, i) => (
              <Fragment key={i}>
                {i > 0 && <div className="bg-divider h-px w-full" />}
                <div className="flex items-center gap-3 py-3">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-12 rounded" />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-8 flex-1" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
