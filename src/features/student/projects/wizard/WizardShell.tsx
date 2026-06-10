import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'

// 프로젝트 생성 마법사 공통 셸 — 제목은 공유 헤더에 등록. 빵부스러기·스테퍼·히어로 밴드·하단 액션바. Figma 340:981 외.
const STEPS = [
  { no: 1, label: '기본 정보', sub: '프로젝트명·설명·기간' },
  { no: 2, label: '팀 설정', sub: 'PM·팀원 초대' },
  { no: 3, label: '상세 설정', sub: '스택·도메인·산출물' },
  { no: 4, label: '생성 확인', sub: '요약·생성' },
]

export function WizardShell({
  step,
  heroTitle,
  heroSub,
  summary,
  summarySub,
  leftLabel,
  onLeft,
  rightLabel,
  onRight,
  rightTone = 'brand',
  rightDisabled,
  children,
}: {
  step: number
  heroTitle: string
  heroSub: string
  summary: string
  summarySub: string
  leftLabel: string
  onLeft: () => void
  rightLabel: string
  onRight: () => void
  rightTone?: 'brand' | 'success'
  rightDisabled?: boolean
  children: ReactNode
}) {
  const navigate = useNavigate()
  usePageHeader(
    '신규 프로젝트 생성',
    '기본 정보부터 팀·상세 설정까지 단계별로 입력해요.',
  )
  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      {/* 빵부스러기 */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-[12px]">
          <button
            type="button"
            onClick={() => navigate('/student/projects')}
            className="text-fg-muted hover:text-fg"
          >
            ← 프로젝트 목록
          </button>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg font-semibold">
            신규 프로젝트 생성{step > 1 && ` · Step ${step}`}
          </span>
        </nav>
        <span className="text-fg-subtle text-[11px]">✎ 자동 저장 · 방금</span>
      </div>

      {/* 스테퍼 */}
      <div className="border-border bg-surface flex items-center rounded-2xl border p-4">
        {STEPS.map((s, i) => {
          const done = s.no < step
          const active = s.no === step
          return (
            <div key={s.no} className="flex flex-1 items-center">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                    done || active
                      ? 'bg-brand text-white'
                      : 'bg-surface-muted text-fg-subtle',
                  )}
                >
                  {done ? '✓' : s.no}
                </span>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-[11px] font-bold tracking-wider',
                      active ? 'text-brand' : 'text-fg-subtle',
                    )}
                  >
                    STEP {s.no}
                  </span>
                  <span
                    className={cn(
                      'text-[12px] font-semibold',
                      active || done ? 'text-fg' : 'text-fg-subtle',
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-fg-subtle hidden text-[10px] lg:block">
                    {s.sub}
                  </span>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-0.5 flex-1',
                    s.no < step ? 'bg-brand' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* 히어로 밴드 */}
      <div className="bg-brand flex items-center justify-between rounded-2xl p-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider text-white/70">
            STEP {step} · {STEPS[step - 1].label}
          </span>
          <span className="text-[20px] font-bold text-white">{heroTitle}</span>
          <span className="text-[12px] text-white/80">{heroSub}</span>
        </div>
      </div>

      {children}

      {/* 하단 액션바 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">{summary}</span>
          <span className="text-[11px] text-white/70">{summarySub}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLeft}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            {leftLabel}
          </button>
          <button
            type="button"
            onClick={onRight}
            disabled={rightDisabled}
            className={cn(
              'rounded-lg px-5 py-2.5 text-[13px] font-bold disabled:opacity-50',
              rightTone === 'success' ? 'bg-success' : 'bg-brand',
            )}
          >
            {rightLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
