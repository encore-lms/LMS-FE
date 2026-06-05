import { cn } from '@/shared/lib/cn'
import { SKILL_OPTIONS, SKILL_MAX } from '../types'
import { StepHead } from '../components/StepHead'

// 온보딩 Step 2 스킬 선택 — 관심 스킬 다중 선택(최대 6). Figma 2197:14961.
export function SkillsStep({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (skill: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHead
        no="02"
        title="관심 스킬을 선택해주세요"
        sub="앞으로 집중하고 싶은 기술을 선택해주세요. 선택한 스킬은 역량 리포트와 추천 학습 자료에 활용됩니다."
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-fg text-[13px] font-bold">관심 스킬</span>
          <span className="text-fg-subtle text-[11px]">다중 선택</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((s) => {
            const on = selected.includes(s)
            const full = !on && selected.length >= SKILL_MAX
            return (
              <button
                key={s}
                type="button"
                disabled={full}
                onClick={() => onToggle(s)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                  on
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-fg-muted hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {on && <span className="text-[11px]">✓</span>}
                {s}
              </button>
            )
          })}
        </div>

        <span className="text-fg-subtle text-[11px]">
          {selected.length}개 선택됨 · 최대 {SKILL_MAX}개까지 선택 가능
        </span>
        <span className="text-fg-subtle text-[11px]">
          ⓘ 선택한 스킬은 온보딩 완료 후에도 마이 프로필에서 수정할 수 있습니다.
        </span>
      </div>
    </div>
  )
}
