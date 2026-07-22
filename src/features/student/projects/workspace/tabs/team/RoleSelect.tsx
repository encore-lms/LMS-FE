// 역할 객관식 — 프리셋 선택 + '기타' 직접 입력. value가 프리셋이 아니면 기타로 간주.
import { inputClass } from '@/components/ui/inputClass'
import { Select } from '@/components/ui/Select'

export const ROLE_PRESETS = [
  '프론트엔드',
  '백엔드',
  '풀스택',
  'PM',
  '데브옵스',
  '기획',
  '디자인',
]
export const fieldCls = inputClass()

export function RoleSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const isPreset = ROLE_PRESETS.includes(value)
  const selectValue = isPreset ? value : '기타'
  return (
    <div className="flex flex-col gap-2">
      <Select
        value={selectValue}
        onChange={(v) => onChange(v === '기타' ? '' : v)}
        aria-label="역할 선택"
        options={[
          ...ROLE_PRESETS.map((r) => ({ value: r, label: r })),
          { value: '기타', label: '기타 (직접 입력)' },
        ]}
        className="h-10 w-full"
      />
      {selectValue === '기타' && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="역할을 직접 입력하세요"
          aria-label="역할 직접 입력"
          className={fieldCls}
        />
      )}
    </div>
  )
}
