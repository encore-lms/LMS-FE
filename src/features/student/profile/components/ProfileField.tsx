import { useFormContext } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import type { ProfileFormValues } from '../profileSchema'

// 텍스트 입력 필드(RHF) — 라벨 + 필수 배지 + 에러. 표시명·외부 URL에 사용.
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
    formState: { errors },
  } = useFormContext<ProfileFormValues>()
  const error = errors[name]?.message

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
          error ? 'border-danger' : 'border-border focus:border-brand',
        )}
      />
      {error ? (
        <p className="text-danger text-xs">{error}</p>
      ) : (
        hint && <span className="text-fg-subtle text-xs">{hint}</span>
      )}
    </div>
  )
}
