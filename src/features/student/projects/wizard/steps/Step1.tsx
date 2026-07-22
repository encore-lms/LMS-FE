import { type UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Field } from '../wizardShared'
import { card } from '../wizardConstants'

/* ── Step 1 기본 정보 ── */
export function Step1(p: {
  name: string
  desc: string
  start: string
  end: string
  days: number
  nameInput: UseFormRegisterReturn
  descInput: UseFormRegisterReturn
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  invalid: Record<'name' | 'desc' | 'start' | 'end', boolean>
}) {
  // focus-visible:shadow-none — 전역 base의 input/textarea 포커스 링을 끄고 focus:border-brand 테두리만
  // 남긴다(링+테두리 2겹 방지, 날짜 picker 트리거와 동일 포커스 표현).
  const input =
    'border-border bg-surface text-fg focus:border-brand focus-visible:shadow-none w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'
  return (
    <section className={cn(card, 'flex flex-col gap-4')}>
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[15px] font-bold">
          프로젝트 기본 정보
        </span>
        <span className="text-fg-subtle text-[11px]">
          저장된 값은 자동 저장되며 다음 단계에서도 수정할 수 있어요
        </span>
      </div>
      <Field label="프로젝트명" required counter={`${p.name.length} / 80`}>
        <input
          className={input}
          maxLength={80}
          aria-invalid={p.invalid.name}
          {...p.nameInput}
        />
      </Field>
      <Field label="프로젝트 설명" required counter={`${p.desc.length} / 500`}>
        <textarea
          className={cn(input, 'min-h-[120px] resize-none leading-6')}
          maxLength={500}
          aria-invalid={p.invalid.desc}
          {...p.descInput}
        />
        <span className="text-fg-subtle text-[11px]">
          무엇을 만들고 왜 만드는지 한두 단락으로 설명하면 좋습니다 · Markdown
          지원
        </span>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="시작일" required>
          <DateTimePicker
            mode="date"
            value={p.start}
            onChange={p.onStartChange}
            error={
              p.invalid.start ? '교육 기간 내 날짜를 선택하세요' : undefined
            }
            ariaLabel="시작일"
            placeholder="시작일"
            max={p.end || undefined}
          />
          <span className="text-fg-subtle text-[11px]">
            교육 기간 내에서 정합니다
          </span>
        </Field>
        <Field label="종료일" required>
          <DateTimePicker
            mode="date"
            value={p.end}
            onChange={p.onEndChange}
            error={p.invalid.end ? '시작일로부터 7일 이상 뒤로' : undefined}
            ariaLabel="종료일"
            placeholder="종료일"
            min={p.start || undefined}
          />
          <span className="text-fg-subtle text-[11px]">
            시작일로부터 최소 7일 이상
          </span>
        </Field>
      </div>
      <div className="bg-brand/10 flex flex-col gap-0.5 rounded-xl p-4">
        <span className="text-brand text-[12px] font-bold">
          ⓘ 프로젝트 기간 {p.days}일
        </span>
        <span className="text-fg-muted text-[11px]">
          {p.start} → {p.end} · 교육 기간 내 시점 시작
        </span>
      </div>
    </section>
  )
}
