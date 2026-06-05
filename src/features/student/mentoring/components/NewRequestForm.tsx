import { cn } from '@/shared/lib/cn'

// 새 멘토링 요청 폼 — 진행 중 요청 1건 존재 시 비활성(팀당 1건 한도).
function Field({
  label,
  placeholder,
  required,
}: {
  label: string
  placeholder: string
  required?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="flex items-center gap-1 text-[12px] font-bold">
        <span className="text-fg-muted">{label}</span>
        {required && <span className="text-danger text-[13px]">*</span>}
      </span>
      <div className="bg-surface-muted border-border flex h-[42px] items-center rounded-lg border px-3">
        <span className="text-fg-subtle text-[13px] font-medium">
          {placeholder}
        </span>
      </div>
    </div>
  )
}

export function NewRequestForm({
  disabled,
  variant = 'active',
}: {
  disabled: boolean
  variant?: 'active' | 'no-mentor'
}) {
  const noMentor = variant === 'no-mentor'
  const title = noMentor ? '멘토 배정 후 요청 가능' : '새 멘토링 요청'
  const chip = noMentor
    ? '⊘ 비활성 — 멘토 미배정'
    : '⊘ 비활성 — 진행 중 요청 1건 존재'
  const sub = noMentor
    ? '운영팀이 멘토를 배정하면 팀 단위 멘토링 요청을 시작할 수 있습니다'
    : '팀당 진행 중 요청은 1개만 허용 · 현재 요청 응답 후 다시 요청 가능'
  return (
    <section
      className={cn(
        'border-border bg-surface overflow-hidden rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex flex-col gap-0.5 px-6 pt-[18px] pb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">{title}</span>
          {disabled && (
            <span className="bg-surface-muted text-fg-subtle flex items-center gap-1 rounded-[5px] px-[7px] py-[3px] text-[10px] font-bold">
              {chip}
            </span>
          )}
        </div>
        <span className="text-fg-subtle text-[11px]">{sub}</span>
      </div>
      <div className="flex flex-col gap-3.5 px-6 pt-2 pb-5">
        <Field
          label="희망 일정"
          placeholder="날짜·시작 시각·종료 시각 선택"
          required
        />
        <div className="flex gap-3.5">
          <Field
            label="장소 유형"
            placeholder="오프라인 / 온라인 / 기타 중 선택"
            required
          />
          <Field
            label="상세 장소"
            placeholder="Zoom 링크 · 강의장 · Discord 채널 등"
            required
          />
        </div>
        <Field
          label="요청 메모"
          placeholder="이번 멘토링에서 다루고 싶은 안건을 간단히 작성 (선택)"
        />
      </div>
      <div className="border-divider flex items-center justify-between border-t px-6 pt-3.5 pb-[18px]">
        <span className="text-fg-subtle text-[11px] font-medium">
          팀원 누구나 요청 가능 · 요청자는 기록 · 확정 전까지 수강생 취소 가능
        </span>
        <span className="bg-surface-muted text-fg-subtle rounded-[9px] px-[18px] py-[9px] text-[13px] font-bold">
          요청 제출 {disabled ? '(비활성)' : ''}
        </span>
      </div>
    </section>
  )
}
