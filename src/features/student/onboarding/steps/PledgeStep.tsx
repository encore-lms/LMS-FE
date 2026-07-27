import { PLEDGE_MAX } from '../types'
import { StepHead } from '../components/StepHead'

// 온보딩 Step 1 다짐 — 학습 다짐 입력(최대 300자). Figma 225:27.
export function PledgeStep({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHead
        no="01"
        title="당신의 학습 다짐을 적어주세요"
        sub="어떤 학습자가 되고 싶으신가요? 짧아도 좋아요. 다짐은 마이 프로필에서 언제든 수정할 수 있습니다."
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-fg text-[13px] font-bold">학습 다짐</span>
          <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
            필수
          </span>
        </div>
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, PLEDGE_MAX))}
            placeholder="예) 매일 1시간씩 꾸준히 코딩하고, 한 달 안에 첫 토이 프로젝트를 완성하는 학습자가 되겠습니다."
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand min-h-[140px] w-full resize-none rounded-xl border px-4 py-3 text-[14px] leading-6 focus:outline-none"
          />
          <span className="text-fg-subtle absolute right-3 bottom-3 text-[11px]">
            {value.length} / {PLEDGE_MAX}
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          ⓘ 입력한 다짐은 대시보드 상단과 마이 프로필에 노출됩니다.
        </span>
      </div>
    </div>
  )
}
