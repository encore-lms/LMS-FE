import { cn } from '@/shared/lib/cn'
import { ONBOARDING_STEPS, type OnboardingStep } from '../types'

// 온보딩 진행 스테퍼 — 1 다짐 → 2 스킬 → 3 외부 URL. 현재 단계까지 brand 강조.
export function Stepper({ current }: { current: OnboardingStep }) {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === current)
  return (
    <div className="mx-auto flex w-full max-w-[440px] items-start">
      {ONBOARDING_STEPS.map((s, i) => {
        const done = i < idx
        const active = i === idx
        const reached = i <= idx
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* 왼쪽 라인 */}
              <span
                className={cn(
                  'h-0.5 flex-1',
                  i === 0 ? 'opacity-0' : i <= idx ? 'bg-brand' : 'bg-border',
                )}
              />
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors',
                  reached
                    ? 'bg-brand text-white'
                    : 'bg-surface-muted text-fg-subtle border-border border',
                )}
              >
                {done ? '✓' : s.no}
              </span>
              {/* 오른쪽 라인 */}
              <span
                className={cn(
                  'h-0.5 flex-1',
                  i === ONBOARDING_STEPS.length - 1
                    ? 'opacity-0'
                    : i < idx
                      ? 'bg-brand'
                      : 'bg-border',
                )}
              />
            </div>
            <span
              className={cn(
                'mt-2 text-[12px] font-semibold',
                active ? 'text-brand' : reached ? 'text-fg' : 'text-fg-subtle',
              )}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
