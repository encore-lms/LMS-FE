import { useFormContext, useWatch } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import type { ProfileFormValues } from '../profileSchema'

// 텍스트 입력 필드(RHF) — 라벨 + 필수 배지 + 힌트/에러. 표시명·외부 URL에 사용.
// 필수인데 비어 있으면 테두리·힌트를 danger로 표시(증명서 필수 안내).
type TextField =
  | 'displayName'
  | 'githubUrl'
  | 'blogUrl'
  | 'portfolioUrl'
  | 'linkedinUrl'

export function ProfileField({
  name,
  label,
  required,
  placeholder,
  hint,
}: {
  name: TextField
  label: string
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileFormValues>()
  const error = errors[name]?.message
  const value = useWatch({ control, name })
  const empty = !value || String(value).trim() === ''
  const requiredEmpty = !!required && empty
  const invalid = !!error || requiredEmpty

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
        {label}
        {required && (
          <span className="bg-danger-bg text-danger rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
            필수
          </span>
        )}
      </label>
      <input
        {...register(name)}
        placeholder={placeholder}
        className={cn(
          'text-fg placeholder:text-fg-subtle h-[52px] w-full rounded-[10px] border-2 bg-white px-4 text-[15px] font-medium outline-none',
          invalid ? 'border-danger' : 'border-border focus:border-brand',
        )}
      />
      {error ? (
        <p className="text-danger text-xs">{error}</p>
      ) : (
        hint && (
          <span
            className={cn(
              'text-xs',
              requiredEmpty ? 'text-danger' : 'text-fg-subtle',
            )}
          >
            {hint}
          </span>
        )
      )}
    </div>
  )
}
