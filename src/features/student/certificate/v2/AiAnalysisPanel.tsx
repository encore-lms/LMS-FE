import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 증명서 v2 — 탭 공용 "AI 분석" 패널 크롬(보라 강조 박스 + AI 분석 배지).
// confirmed 데이터 기반 해석 콘텐츠를 감싼다. 외부 공개 payload 노출은 후속(운영자 승인) 과제.
export function AiAnalysisPanel({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-accent/30 bg-accent-bg/40 flex flex-col gap-4 rounded-2xl border p-5',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-accent-strong flex items-center gap-1.5 text-[14px] font-bold">
          <span className="bg-accent-strong flex size-4 items-center justify-center rounded text-[10px] text-white">
            ✦
          </span>
          {title}
        </span>
        <span className="text-accent-strong rounded bg-white px-2 py-0.5 text-[10px] font-bold">
          AI 분석
        </span>
      </div>
      {children}
    </section>
  )
}
