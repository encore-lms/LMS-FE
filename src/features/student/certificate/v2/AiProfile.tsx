import { cn } from '@/shared/lib/cn'
import type { CertAiProfile } from '../types'
import type { AiPersona } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

// 증명서 v2 — AI 역량 프로파일링(유형 분류 + 한줄 요약 + 강점/성장) + 페르소나 TOP 3.
export function AiProfile({
  profile,
  personas,
  className,
}: {
  profile: CertAiProfile
  personas: AiPersona[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <AiAnalysisPanel title="AI 역량 프로파일링">
        <div className="flex flex-col gap-2">
          {profile.rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 text-[12px]">
              <span className="text-fg-subtle w-12 shrink-0">{r.label}</span>
              <span className="text-fg font-bold">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-surface flex flex-col gap-1 rounded-xl p-3.5">
          <span className="text-accent-strong text-[11px] font-bold">
            AI 한줄 요약
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            “{profile.summary}”
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="bg-success-bg/60 flex flex-col gap-1 rounded-xl p-3">
            <span className="text-success text-[11px] font-bold">
              핵심 강점
            </span>
            <span className="text-fg-muted text-[11px] leading-4">
              {profile.strengths}
            </span>
          </div>
          <div className="bg-warning-bg/60 flex flex-col gap-1 rounded-xl p-3">
            <span className="text-warning text-[11px] font-bold">
              성장 포인트
            </span>
            <span className="text-fg-muted text-[11px] leading-4">
              {profile.growth}
            </span>
          </div>
        </div>
      </AiAnalysisPanel>

      {personas.length > 0 && (
        <AiAnalysisPanel title="AI 페르소나 TOP 3">
          <div className="flex flex-col gap-2">
            {personas.map((p) => (
              <div
                key={p.rank}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-3',
                  p.rank === 1 ? 'bg-accent-strong text-white' : 'bg-surface',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold',
                    p.rank === 1
                      ? 'bg-white/20 text-white'
                      : 'bg-accent-bg text-accent-strong',
                  )}
                >
                  #{p.rank}
                </span>
                <span
                  className={cn(
                    'text-[13px] font-bold',
                    p.rank === 1 ? 'text-white' : 'text-fg',
                  )}
                >
                  {p.title}
                </span>
                {/* 부연: 아이콘 호버/포커스 시 실제 활동 근거 툴팁(계산 설명 아님) */}
                <span className="group relative ml-auto shrink-0">
                  <span
                    className={cn(
                      'cursor-help text-[13px]',
                      p.rank === 1 ? 'text-white/80' : 'text-fg-subtle',
                    )}
                    tabIndex={0}
                    role="button"
                    aria-label="추천 근거 보기"
                  >
                    ⓘ
                  </span>
                  <span
                    role="tooltip"
                    className="border-border bg-surface text-fg-muted pointer-events-none absolute top-full right-0 z-10 mt-1.5 hidden w-56 rounded-lg border p-2.5 text-[11px] leading-4 font-normal shadow-lg group-focus-within:block group-hover:block"
                  >
                    {p.subtitle}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </AiAnalysisPanel>
      )}
    </div>
  )
}
