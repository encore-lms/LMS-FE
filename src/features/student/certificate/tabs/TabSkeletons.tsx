import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * 증명서 탭 로딩 골격.
 *
 * <p>탭마다 자기 데이터를 따로 가져오므로 새로고침 뒤 각 탭 첫 진입에서 한 번씩 로딩을 거친다.
 * 골격을 주지 않으면 DataBoundary 가 "불러오는 중…" 한 줄(높이 96px)로 줄었다가 본문 높이로
 * 튀어 화면이 깜빡인다. 실제 레이아웃과 비슷한 높이를 미리 잡아 그 튐을 없앤다.</p>
 */

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

/** 탭 머리(번호 배지 + 제목 + 부제) 자리. */
function HeadBone() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-6 rounded-md" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-[18px] w-40" />
          <Skeleton className="h-[11px] w-56" />
        </div>
      </div>
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
  )
}

/** 카드 하나 — 제목 두 줄 + 본문 행 n개. */
function CardBone({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <section className={cn(card, 'flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-[15px] w-32" />
        <Skeleton className="h-[11px] w-48" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[150px_1fr_120px]">
            <Skeleton className="h-4" />
            <Skeleton className="h-2.5 self-center rounded-full" />
            <Skeleton className="h-4" />
          </div>
        ))}
      </div>
    </section>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <span className="sr-only">불러오는 중…</span>
      {children}
    </div>
  )
}

/** 기술·검증 — 머리 + 성장 곡선 + 카테고리별 점수 2단. */
export function TechTabSkeleton() {
  return (
    <Frame>
      <HeadBone />
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-[15px] w-24" />
          <Skeleton className="h-[11px] w-64" />
        </div>
        <Skeleton className="h-[220px] w-full rounded-xl" />
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <CardBone rows={4} />
        <CardBone rows={4} />
      </div>
    </Frame>
  )
}

/** 문제해결 — 머리 + 표 한 장. */
export function ProblemTabSkeleton() {
  return (
    <Frame>
      <HeadBone />
      <section className={cn(card, 'flex flex-col gap-3 overflow-hidden')}>
        <Skeleton className="h-9 w-full rounded-lg" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </section>
    </Frame>
  )
}

/** 평가·추천 — 머리 + 성장 타임라인 + 평판/코멘트 2단. */
export function GrowthTabSkeleton() {
  return (
    <Frame>
      <HeadBone />
      <section className={cn(card, 'flex flex-col gap-5')}>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-[15px] w-28" />
          <Skeleton className="h-[11px] w-52" />
        </div>
        <Skeleton className="h-[180px] w-full rounded-xl" />
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <CardBone rows={5} />
        <section className={cn(card, 'flex flex-col gap-3')}>
          <Skeleton className="h-[15px] w-24" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </section>
      </div>
    </Frame>
  )
}

/**
 * 이력서 — 섹션 카드 3장.
 * 이 탭은 TabHead 가 DataBoundary 바깥에 있어 로딩 중에도 머리가 남는다 — 골격에 넣지 않는다.
 */
export function ResumeTabSkeleton() {
  return (
    <Frame>
      {Array.from({ length: 3 }, (_, i) => (
        <section key={i} className={cn(card, 'flex flex-col gap-3')}>
          <Skeleton className="h-[15px] w-36" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-4/5" />
        </section>
      ))}
    </Frame>
  )
}

/**
 * 프로젝트 — 요약 줄 + 프로젝트 카드 3장.
 * 이력서와 마찬가지로 TabHead 가 바깥이라 골격은 본문만 그린다.
 */
export function ProjectsTabSkeleton() {
  return (
    <Frame>
      {Array.from({ length: 3 }, (_, i) => (
        <section key={i} className={cn(card, 'flex flex-col gap-4')}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[17px] w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, k) => (
              <Skeleton key={k} className="h-6 w-16 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </section>
      ))}
    </Frame>
  )
}

/** AI 분석 — 소개 배너 + 핵심 분석 3장 + 상세 카드. */
export function AiTabSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-live="polite">
      <span className="sr-only">불러오는 중…</span>
      <header className="border-accent/25 bg-accent-bg/40 flex gap-3 rounded-2xl border px-6 py-5">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <section key={i} className={cn(card, 'flex flex-col gap-3')}>
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-[15px] w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </section>
        ))}
      </div>
      <CardBone rows={5} />
    </div>
  )
}
